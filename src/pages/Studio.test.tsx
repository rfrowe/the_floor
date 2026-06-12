/**
 * Tests for the Studio wizard shell page.
 *
 * Verifies the page renders, the stepper reflects the current step, the Resume
 * prompt appears when a draft is seeded into IndexedDB, and "Start over" clears
 * it. Runs against the global fake-indexeddb (see src/setupTests.ts).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Studio from './Studio';
import { putStudioDraft, clearStudioDraft, getStudioDraft } from '@storage/indexedDB';
import { STUDIO_DRAFT_ID } from '@hooks/useStudioDraftStore';
import type { StudioDraft } from '@types';

function renderStudio() {
  return render(
    <BrowserRouter>
      <Studio />
    </BrowserRouter>
  );
}

function makeDraft(overrides: Partial<StudioDraft> = {}): StudioDraft {
  return {
    version: 1,
    id: STUDIO_DRAFT_ID,
    step: 'cards',
    categoryName: 'Cryptids',
    cards: [
      { id: 'a', answer: 'Bigfoot', imageKeywords: 'sasquatch', imagePrompt: 'a hairy biped' },
    ],
    slides: [],
    imageSource: 'openai',
    updatedAt: '2026-06-12T00:00:00.000Z',
    ...overrides,
  };
}

describe('Studio page', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearStudioDraft(STUDIO_DRAFT_ID);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the header and the first step placeholder', async () => {
    renderStudio();

    expect(screen.getByRole('heading', { name: /The Floor — Studio/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Dashboard' })).toHaveAttribute('href', '/');

    // Wait out hydration; the credentials step should be active.
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Enter your OpenAI credentials/i })
      ).toBeInTheDocument();
    });
  });

  it('stepper reflects the current step and locks forward steps', async () => {
    renderStudio();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Enter your OpenAI credentials/i })
      ).toBeInTheDocument();
    });

    const nav = screen.getByRole('navigation', { name: 'Studio progress' });
    // First step is current.
    const credentialsStep = within(nav).getByRole('button', { name: /Step 1: Credentials/i });
    expect(credentialsStep).toHaveAttribute('aria-current', 'step');

    // A later step (Cards) is locked because the name guard isn't satisfied.
    const cardsStep = within(nav).getByRole('button', { name: /Step 3: Cards/i });
    expect(cardsStep).toBeDisabled();
  });

  it('hides the shared footer on the credentials step (it owns its own controls)', async () => {
    renderStudio();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Enter your OpenAI credentials/i })
      ).toBeInTheDocument();
    });

    // The shared footer "← Back" control is not rendered on the credentials
    // step; the step provides Clear + Continue instead.
    expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
  });

  it('advances to the category-name step once a key is entered', async () => {
    const user = userEvent.setup();
    renderStudio();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Enter your OpenAI credentials/i })
      ).toBeInTheDocument();
    });

    // The step's Continue is gated until a key is present.
    const credentialsContinue = screen.getByRole('button', { name: /Continue/i });
    expect(credentialsContinue).toBeDisabled();

    await user.type(screen.getByLabelText(/OpenAI API key/i), 'sk-test-key');
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    expect(screen.getByRole('heading', { name: /Pick a category name/i })).toBeInTheDocument();
    // The shared footer Continue is now disabled because no name is confirmed.
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  it('shows the Resume prompt when a draft is seeded', async () => {
    await putStudioDraft(makeDraft());
    renderStudio();

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Resume your draft/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/Cryptids/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start over' })).toBeInTheDocument();
  });

  it('Resume adopts the persisted draft (jumps to its step)', async () => {
    const user = userEvent.setup();
    await putStudioDraft(makeDraft());
    renderStudio();

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Resume your draft/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Resume' }));

    // The draft's step (cards) is now active and the prompt is gone.
    expect(screen.queryByRole('dialog', { name: /Resume your draft/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Generate card ideas/i })).toBeInTheDocument();
  });

  it('Start over clears the persisted draft and resets to step 1', async () => {
    const user = userEvent.setup();
    await putStudioDraft(makeDraft());
    renderStudio();

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Resume your draft/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Start over' }));

    expect(screen.queryByRole('dialog', { name: /Resume your draft/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Enter your OpenAI credentials/i })
    ).toBeInTheDocument();

    await waitFor(async () => {
      const stored = await getStudioDraft<StudioDraft>(STUDIO_DRAFT_ID);
      expect(stored).toBeNull();
    });
  });
});
