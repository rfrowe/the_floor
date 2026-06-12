import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { Contestant, StoredCategory } from '@types';
import { QuickDuelSetup, type QuickDuelSetupProps } from './QuickDuelSetup';

// Default the real audience hook to "connected"; tests can still force the
// disconnected state via the isAudienceWatching prop (which takes precedence).
vi.mock('@hooks/useAudienceConnection', () => ({
  useAudienceConnection: () => ({
    isConnected: true,
    waitForAudience: vi.fn().mockResolvedValue(true),
  }),
}));

const alice: Contestant = {
  id: 'alice',
  name: 'Alice',
  category: { name: 'Math', slides: [] },
  wins: 2,
  eliminated: false,
  controlledSquares: ['0-0'],
};

const bob: Contestant = {
  id: 'bob',
  name: 'Bob',
  category: { name: 'History', slides: [] },
  wins: 1,
  eliminated: false,
  controlledSquares: ['1-0'],
};

const carol: Contestant = {
  id: 'carol',
  name: 'Carol',
  category: { name: 'Science', slides: [] },
  wins: 0,
  eliminated: true,
  controlledSquares: [],
};

const mathCategory: StoredCategory = {
  id: 'cat-math',
  name: 'Math',
  slides: [{ answer: '4', imageUrl: 'a.png', censorBoxes: [] }],
  createdAt: '2026-01-01T00:00:00.000Z',
  thumbnailUrl: 'a.png',
};

const emptyCategory: StoredCategory = {
  id: 'cat-empty',
  name: 'Empty',
  slides: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  thumbnailUrl: '',
};

function renderSetup(props: Partial<QuickDuelSetupProps> = {}) {
  const defaultProps: QuickDuelSetupProps = {
    contestants: [alice, bob, carol],
    categories: [mathCategory, emptyCategory],
    onStart: vi.fn(),
    onCancel: vi.fn(),
  };
  const merged = { ...defaultProps, ...props };
  render(<QuickDuelSetup {...merged} />);
  return merged;
}

describe('QuickDuelSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders both player dropdowns and a category dropdown', () => {
    renderSetup();
    expect(screen.getByLabelText('Player 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Player 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('includes eliminated players in the dropdowns', () => {
    renderSetup();
    // Carol is eliminated but should still be selectable.
    expect(screen.getAllByText(/Carol \(eliminated\)/).length).toBeGreaterThan(0);
  });

  it('disables Start until two distinct players and a non-empty category are chosen', async () => {
    const user = userEvent.setup();
    renderSetup();

    const startButton = screen.getByRole('button', { name: /start quick duel/i });
    expect(startButton).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Player 1'), 'alice');
    await user.selectOptions(screen.getByLabelText('Player 2'), 'bob');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-math');

    expect(startButton).toBeEnabled();
  });

  it('keeps Start disabled when the chosen category has no slides', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.selectOptions(screen.getByLabelText('Player 1'), 'alice');
    await user.selectOptions(screen.getByLabelText('Player 2'), 'bob');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-empty');

    expect(screen.getByRole('button', { name: /start quick duel/i })).toBeDisabled();
  });

  it('excludes the Player 1 selection from the Player 2 options', async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.selectOptions(screen.getByLabelText('Player 1'), 'alice');

    const player2 = screen.getByLabelText('Player 2');
    const optionValues = Array.from(player2.querySelectorAll('option')).map((o) => o.value);
    expect(optionValues).not.toContain('alice');
    expect(optionValues).toContain('bob');
    expect(optionValues).toContain('carol');
  });

  it('keeps Start disabled when no audience is connected', async () => {
    const user = userEvent.setup();
    renderSetup({ isAudienceWatching: false });

    await user.selectOptions(screen.getByLabelText('Player 1'), 'alice');
    await user.selectOptions(screen.getByLabelText('Player 2'), 'bob');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-math');

    expect(screen.getByRole('button', { name: /start quick duel/i })).toBeDisabled();
  });

  it('calls onStart with the selected players and category', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    renderSetup({ onStart });

    await user.selectOptions(screen.getByLabelText('Player 1'), 'alice');
    await user.selectOptions(screen.getByLabelText('Player 2'), 'bob');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-math');
    await user.click(screen.getByRole('button', { name: /start quick duel/i }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith({
      contestant1: alice,
      contestant2: bob,
      category: mathCategory,
    });
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderSetup({ onCancel });

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
