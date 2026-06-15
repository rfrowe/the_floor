/**
 * Tests for CardsStep.
 *
 * Covers the Task 57 acceptance criteria for the UI: initial entry generates
 * once and renders the list; reroll-all (after confirm) replaces the list via a
 * single call and shows the overlay spinner; edit mutates one card; delete
 * removes the right card; add appends a blank; deleting a middle card preserves
 * the others (stable nanoid keys); Continue is disabled until ≥1 answer is
 * non-empty; and a failed generation surfaces a typed error with a working
 * Retry. `generateCardIdeas` is mocked — no real network.
 */

import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { CardIdea } from '@types';
import { CardsStep } from './CardsStep';
import { __resetCredentialsForTest, __setCredentialsForTest } from '@hooks/useCredentials';
import { GenerationError, generateCardIdeas } from '@services/openai';
import { createBlankCard } from '@hooks/useStudioState';

vi.mock('@services/openai', async () => {
  const actual = await vi.importActual<typeof import('@services/openai')>('@services/openai');
  return { ...actual, generateCardIdeas: vi.fn() };
});

const generateMock = vi.mocked(generateCardIdeas);

/** Build a card with a deterministic id for assertions. */
function card(id: string, answer: string, imagePrompt = `${answer} prompt`): CardIdea {
  return { id, answer, imageKeywords: `${answer} keywords`, imagePrompt };
}

/**
 * Assert the toolbar count badge reads exactly `expected`. Scoped past the
 * soft "drifts far from ~50" warning, which can also mention a card count.
 */
function expectCount(expected: string): void {
  const matches = screen
    .getAllByText((_content, element) => element?.textContent === expected)
    .filter((el) => el.tagName === 'SPAN');
  expect(matches.length).toBeGreaterThanOrEqual(1);
}

/** Seed the in-memory credentials store so `isConfigured` is true. */
function seedKey(apiKey = 'sk-test'): void {
  __setCredentialsForTest({ apiKey });
}

/**
 * A stateful harness mirroring the parent (Studio) wiring: it holds the card
 * list in local state and applies the same reducer semantics the real
 * `UPDATE_CARD`/`DELETE_CARD`/`ADD_CARD` actions do, so tests exercise real
 * list behavior (including stable keys) rather than just asserting callbacks.
 */
function Harness({ initialCards = [] }: { initialCards?: CardIdea[] }) {
  const [cards, setCards] = useState<CardIdea[]>(initialCards);
  const [continued, setContinued] = useState(false);

  return (
    <div>
      <CardsStep
        categoryName="Cryptids"
        cards={cards}
        onSetCards={setCards}
        onUpdateCard={(id, changes) => {
          setCards((current) => current.map((c) => (c.id === id ? { ...c, ...changes } : c)));
        }}
        onDeleteCard={(id) => {
          setCards((current) => current.filter((c) => c.id !== id));
        }}
        onAddCard={() => {
          setCards((current) => [...current, createBlankCard()]);
        }}
        onContinue={() => {
          setContinued(true);
        }}
      />
      {continued && <p>advanced to images</p>}
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

describe('CardsStep', () => {
  it('without a key: prompts for credentials and does not generate', () => {
    render(<Harness />);
    expect(generateMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Add your OpenAI key/i)).toBeInTheDocument();
  });

  it('on entry with a key and no cards, generates once and renders the list', async () => {
    seedKey();
    generateMock.mockResolvedValue([card('a', 'Mothman'), card('b', 'Bigfoot')]);

    render(<Harness />);

    await waitFor(() => {
      expect(generateMock).toHaveBeenCalledTimes(1);
    });
    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-test' }),
      'Cryptids',
      50
    );

    expect(await screen.findByDisplayValue('Mothman')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bigfoot')).toBeInTheDocument();
    expectCount('2 cards');
  });

  it('does not regenerate when entering with existing cards (e.g. a resumed draft)', async () => {
    seedKey();
    render(<Harness initialCards={[card('a', 'Yeti')]} />);

    // Give any stray effect a tick; it must not fire.
    await waitFor(() => {
      expect(screen.getByDisplayValue('Yeti')).toBeInTheDocument();
    });
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('reroll-all confirms, then replaces the list via a single call with a spinner', async () => {
    const user = userEvent.setup();
    seedKey();
    // Control when the *reroll* call resolves so we can observe the spinner.
    let resolveReroll: ((cards: CardIdea[]) => void) | undefined;
    const rerollPending = new Promise<CardIdea[]>((resolve) => {
      resolveReroll = resolve;
    });
    generateMock
      .mockResolvedValueOnce([card('a', 'Mothman'), card('b', 'Bigfoot')])
      .mockReturnValueOnce(rerollPending);

    render(<Harness />);
    expect(await screen.findByDisplayValue('Mothman')).toBeInTheDocument();
    expect(generateMock).toHaveBeenCalledTimes(1);

    // Reroll-all is confirm-gated: first click reveals a confirm bar.
    await user.click(screen.getByRole('button', { name: /Reroll all/i }));
    const dialog = screen.getByRole('alertdialog', { name: /confirm reroll/i });
    await user.click(within(dialog).getByRole('button', { name: /Reroll all/i }));

    // One additional call; the overlay spinner is shown while pending.
    expect(generateMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/Generating card ideas/i)).toBeInTheDocument();

    // Resolve the reroll → the list is replaced and the spinner clears.
    resolveReroll?.([card('c', 'Nessie')]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Nessie')).toBeInTheDocument();
    });
    expect(screen.queryByDisplayValue('Mothman')).not.toBeInTheDocument();
    expect(screen.queryByText(/Generating card ideas/i)).not.toBeInTheDocument();
  });

  it('cancelling the reroll-all confirmation leaves the list untouched', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock.mockResolvedValue([card('a', 'Mothman')]);

    render(<Harness />);
    expect(await screen.findByDisplayValue('Mothman')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reroll all/i }));
    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue('Mothman')).toBeInTheDocument();
  });

  it('edits a single card answer', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock.mockResolvedValue([card('a', 'Mothman'), card('b', 'Bigfoot')]);

    render(<Harness />);
    const input = await screen.findByDisplayValue('Mothman');
    await user.type(input, '!');
    expect(input).toHaveValue('Mothman!');
    // The other card is unaffected.
    expect(screen.getByDisplayValue('Bigfoot')).toBeInTheDocument();
  });

  it('deletes a middle card, preserving the others (stable keys)', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock.mockResolvedValue([
      card('a', 'Mothman'),
      card('b', 'Bigfoot'),
      card('c', 'Nessie'),
    ]);

    render(<Harness />);
    await screen.findByDisplayValue('Mothman');

    await user.click(screen.getByRole('button', { name: /Delete Bigfoot/i }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Bigfoot')).not.toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Mothman')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nessie')).toBeInTheDocument();
    expectCount('2 cards');
  });

  it('adds a blank card to the end', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock.mockResolvedValue([card('a', 'Mothman')]);

    render(<Harness />);
    await screen.findByDisplayValue('Mothman');

    await user.click(screen.getByRole('button', { name: /Add card/i }));

    const answerInputs = screen.getAllByLabelText('Answer');
    expect(answerInputs).toHaveLength(2);
    expect(answerInputs[1]).toHaveValue('');
    expectCount('2 cards (1 with an answer)');
  });

  it('+ Add card appends a blank card without crashing, even when the list is empty', async () => {
    const user = userEvent.setup();
    seedKey();
    // One card, then the user deletes it to empty the list, then adds a blank.
    generateMock.mockResolvedValue([card('a', 'Mothman')]);

    render(<Harness />);
    await screen.findByDisplayValue('Mothman');

    // Empty the list first (this is the state that triggered the crash).
    await user.click(screen.getByRole('button', { name: /Delete Mothman/i }));
    await waitFor(() => {
      expect(screen.getByText(/No cards yet/i)).toBeInTheDocument();
    });

    // Adding a card on the empty list must append a blank card and not throw.
    await user.click(screen.getByRole('button', { name: /Add card/i }));

    const answerInputs = screen.getAllByLabelText('Answer');
    expect(answerInputs).toHaveLength(1);
    expect(answerInputs[0]).toHaveValue('');
    expectCount('1 card (0 with an answer)');
  });

  it('deleting all cards does NOT retrigger generation', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock.mockResolvedValue([card('a', 'Mothman'), card('b', 'Bigfoot')]);

    render(<Harness />);
    await screen.findByDisplayValue('Mothman');
    expect(generateMock).toHaveBeenCalledTimes(1);

    // Delete every card so the list becomes empty.
    await user.click(screen.getByRole('button', { name: /Delete Mothman/i }));
    await user.click(screen.getByRole('button', { name: /Delete Bigfoot/i }));

    await waitFor(() => {
      expect(screen.getByText(/No cards yet/i)).toBeInTheDocument();
    });

    // The auto-generate effect must not fire again from the empty list.
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  it('disables Continue until at least one card has a non-empty answer', async () => {
    const user = userEvent.setup();
    seedKey();
    // A single blank card → no non-empty answer.
    generateMock.mockResolvedValue([card('a', '')]);

    render(<Harness />);
    await waitFor(() => {
      expect(generateMock).toHaveBeenCalledTimes(1);
    });

    const continueBtn = await screen.findByRole('button', { name: /Continue/i });
    expect(continueBtn).toBeDisabled();

    const answer = screen.getByLabelText('Answer');
    await user.type(answer, 'Chupacabra');
    expect(continueBtn).toBeEnabled();

    await user.click(continueBtn);
    expect(screen.getByText(/advanced to images/i)).toBeInTheDocument();
  });

  it('surfaces a typed GenerationError with a working Retry', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock
      .mockRejectedValueOnce(new GenerationError('auth', 'Your OpenAI API key was rejected.'))
      .mockResolvedValueOnce([card('a', 'Recovered')]);

    render(<Harness />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/key was rejected/i);

    await user.click(screen.getByRole('button', { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Recovered')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(generateMock).toHaveBeenCalledTimes(2);
  });
});
