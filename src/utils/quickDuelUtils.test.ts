import { describe, it, expect } from 'vitest';
import type { Contestant } from '@types';
import { recordQuickDuelWin } from './quickDuelUtils';

function makeContestant(overrides: Partial<Contestant> = {}): Contestant {
  return {
    id: 'c1',
    name: 'Alice',
    category: { name: 'Math', slides: [] },
    wins: 3,
    eliminated: false,
    controlledSquares: ['0-0', '0-1'],
    ...overrides,
  };
}

describe('recordQuickDuelWin', () => {
  it('increments the winner win count by 1', () => {
    const winner = makeContestant({ wins: 3 });
    expect(recordQuickDuelWin(winner).wins).toBe(4);
  });

  it('does not eliminate or change territory', () => {
    const winner = makeContestant({
      eliminated: false,
      controlledSquares: ['0-0', '0-1', '1-0'],
    });

    const result = recordQuickDuelWin(winner);

    expect(result.eliminated).toBe(false);
    expect(result.controlledSquares).toEqual(['0-0', '0-1', '1-0']);
  });

  it('does not change category ownership', () => {
    const category = { name: 'History', slides: [] };
    const winner = makeContestant({ category });

    expect(recordQuickDuelWin(winner).category).toBe(category);
  });

  it('preserves an eliminated winner status (does not revive)', () => {
    const winner = makeContestant({ eliminated: true, controlledSquares: [] });

    const result = recordQuickDuelWin(winner);

    expect(result.eliminated).toBe(true);
    expect(result.controlledSquares).toEqual([]);
    expect(result.wins).toBe(4);
  });

  it('does not mutate the input contestant', () => {
    const winner = makeContestant({ wins: 5 });

    recordQuickDuelWin(winner);

    expect(winner.wins).toBe(5);
  });
});
