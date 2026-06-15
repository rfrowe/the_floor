/**
 * Tests for ImagesStep.
 *
 * Covers the Task 58 acceptance criteria for the UI: a per-card Generate sets
 * THAT slide's image (by index) via the mocked `generateImage`; a per-card
 * failure shows an inline error with a working Retry and does NOT block other
 * cards; and "Generate all" respects the concurrency cap (asserted by tracking
 * max in-flight calls against a controllable, deferred mock). The index↔id
 * bridge is exercised by a stateful harness that applies real `SET_SLIDE_IMAGE`
 * (index-based) semantics. `generateImage` is mocked — no real network.
 */

import { useMemo, useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { CardIdea, Slide } from '@types';
import { ImagesStep, GENERATE_ALL_CONCURRENCY } from './ImagesStep';
import { __resetCredentialsForTest, __setCredentialsForTest } from '@hooks/useCredentials';
import { GenerationError, generateImage } from '@services/openai';

vi.mock('@services/openai', async () => {
  const actual = await vi.importActual<typeof import('@services/openai')>('@services/openai');
  return { ...actual, generateImage: vi.fn() };
});

const generateMock = vi.mocked(generateImage);

/** Build a card with a deterministic id for assertions. */
function card(id: string, answer: string): CardIdea {
  return { id, answer, imageKeywords: `${answer} keywords`, imagePrompt: `${answer} prompt` };
}

/** Seed the in-memory credentials store so `isConfigured` is true. */
function seedKey(apiKey = 'sk-test'): void {
  __setCredentialsForTest({ apiKey });
}

/** A deferred promise we can resolve/reject from the test. */
interface Deferred<T> {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Stateful harness mirroring the parent (Studio) wiring: it derives one slide
 * per card (like the reducer) and applies real index-based `SET_SLIDE_IMAGE`
 * semantics, so tests exercise the genuine index↔id bridge rather than just
 * asserting callbacks.
 */
function Harness({ cards }: { cards: CardIdea[] }) {
  const initialSlides = useMemo<Slide[]>(
    () => cards.map((c) => ({ imageUrl: '', answer: c.answer, censorBoxes: [] })),
    [cards]
  );
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [continued, setContinued] = useState(false);

  return (
    <div>
      <ImagesStep
        cards={cards}
        slides={slides}
        onSetSlideImage={(index, imageUrl) => {
          setSlides((current) => current.map((s, i) => (i === index ? { ...s, imageUrl } : s)));
        }}
        onContinue={() => {
          setContinued(true);
        }}
      />
      {continued && <p>advanced to censor</p>}
    </div>
  );
}

beforeEach(() => {
  __resetCredentialsForTest();
  generateMock.mockReset();
});

afterEach(() => {
  cleanup();
  __resetCredentialsForTest();
});

describe('ImagesStep', () => {
  it('without a key: prompts for credentials', () => {
    render(<Harness cards={[card('a', 'Fox')]} />);
    expect(screen.getByText(/Add your OpenAI key/i)).toBeInTheDocument();
  });

  it('generating one card sets THAT slide image (by index)', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock.mockResolvedValue('data:image/png;base64,FOX');

    render(<Harness cards={[card('a', 'Fox'), card('b', 'Bear')]} />);

    // Two cards, both blank initially.
    const foxItem = screen.getByText('1. Fox').closest('li');
    expect(foxItem).not.toBeNull();
    if (!foxItem) throw new Error('Fox card not found');

    await user.click(within(foxItem).getByRole('button', { name: 'Generate' }));

    // The Fox slide gets the image; it's called with the card's prompt.
    await waitFor(() => {
      expect(within(foxItem).getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,FOX');
    });
    expect(generateMock).toHaveBeenCalledWith(
      'Fox prompt',
      expect.objectContaining({ apiKey: 'sk-test' })
    );

    // The Bear slide remains blank (no image), proving index isolation.
    const bearItem = screen.getByText('2. Bear').closest('li');
    expect(bearItem).not.toBeNull();
    if (!bearItem) throw new Error('Bear card not found');
    expect(within(bearItem).queryByRole('img')).toBeNull();
  });

  it('a per-card failure shows an inline error + Retry and does not block others', async () => {
    const user = userEvent.setup();
    seedKey();
    // Fox fails the first time it's requested, succeeds on retry; Bear always
    // succeeds. Track Fox attempts explicitly to keep the mock simple.
    let foxAttempts = 0;
    generateMock.mockImplementation((prompt: string) => {
      if (prompt === 'Fox prompt') {
        foxAttempts += 1;
        if (foxAttempts === 1) {
          return Promise.reject(new GenerationError('rateLimit', 'Rate limited. Retry.'));
        }
      }
      return Promise.resolve(`data:image/png;base64,${prompt.slice(0, 3).toUpperCase()}`);
    });

    render(<Harness cards={[card('a', 'Fox'), card('b', 'Bear')]} />);

    const foxItem = screen.getByText('1. Fox').closest('li');
    const bearItem = screen.getByText('2. Bear').closest('li');
    if (!foxItem || !bearItem) throw new Error('cards not found');

    // Fox fails → inline error + Retry.
    await user.click(within(foxItem).getByRole('button', { name: 'Generate' }));
    await waitFor(() => {
      expect(within(foxItem).getByRole('alert')).toHaveTextContent('Rate limited');
    });
    expect(within(foxItem).getByRole('button', { name: 'Retry' })).toBeInTheDocument();

    // Bear still works despite Fox's failure.
    await user.click(within(bearItem).getByRole('button', { name: 'Generate' }));
    await waitFor(() => {
      expect(within(bearItem).getByRole('img')).toBeInTheDocument();
    });

    // Retry Fox → succeeds, error clears.
    await user.click(within(foxItem).getByRole('button', { name: 'Retry' }));
    await waitFor(() => {
      expect(within(foxItem).getByRole('img')).toBeInTheDocument();
    });
    expect(within(foxItem).queryByRole('alert')).toBeNull();
  });

  it('"Generate all" never exceeds the concurrency cap', async () => {
    const user = userEvent.setup();
    seedKey();

    let inFlight = 0;
    let maxInFlight = 0;
    const pending: (() => void)[] = [];

    generateMock.mockImplementation(() => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      const d = deferred<string>();
      pending.push(() => {
        inFlight -= 1;
        d.resolve('data:image/png;base64,OK');
      });
      return d.promise;
    });

    // More cards than the cap so the limiter must queue.
    const cards = Array.from({ length: GENERATE_ALL_CONCURRENCY + 4 }, (_v, i) =>
      card(`id-${String(i)}`, `Card${String(i)}`)
    );
    render(<Harness cards={cards} />);

    await user.click(screen.getByRole('button', { name: 'Generate all' }));

    // Let the initial pool start.
    await waitFor(() => {
      expect(generateMock).toHaveBeenCalledTimes(GENERATE_ALL_CONCURRENCY);
    });
    expect(maxInFlight).toBe(GENERATE_ALL_CONCURRENCY);

    // Drain one task at a time; the cap must hold as new tasks dequeue.
    while (pending.length > 0) {
      const resolveNext = pending.shift();
      if (resolveNext) resolveNext();
      // Allow the freed worker to pick up the next queued task.
      await waitFor(() => {
        expect(inFlight).toBeLessThanOrEqual(GENERATE_ALL_CONCURRENCY);
      });
    }

    await waitFor(() => {
      expect(generateMock).toHaveBeenCalledTimes(cards.length);
    });
    expect(maxInFlight).toBe(GENERATE_ALL_CONCURRENCY);
  });

  it('shows the blank-slide count and an AI-art accuracy caveat; Continue is always allowed', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock.mockResolvedValue('data:image/png;base64,FOX');

    render(<Harness cards={[card('a', 'Fox'), card('b', 'Bear')]} />);

    expect(screen.getByText(/2 of 2 cards are still blank/i)).toBeInTheDocument();
    expect(screen.getByText(/less photo-accurate/i)).toBeInTheDocument();

    // Continue works even with blank slides.
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(screen.getByText('advanced to censor')).toBeInTheDocument();
  });
});
