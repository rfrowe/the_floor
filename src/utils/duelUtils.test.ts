import { describe, it, expect } from 'vitest';
import {
  isDuelEligible,
  getDuelEligibleContestants,
  canStartDuel,
  canContestantsDuel,
} from './duelUtils';
import type { Contestant } from '@types';

describe('duelUtils', () => {
  describe('isDuelEligible', () => {
    it('should return true for contestant with controlled squares and not eliminated', () => {
      const contestant: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0', '0-1'],
      };
      expect(isDuelEligible(contestant)).toBe(true);
    });

    it('should return false for eliminated contestant', () => {
      const contestant: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: true,
        controlledSquares: ['0-0', '0-1'],
      };
      expect(isDuelEligible(contestant)).toBe(false);
    });

    it('should return false for contestant with no controlled squares', () => {
      const contestant: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: [],
      };
      expect(isDuelEligible(contestant)).toBe(false);
    });

    it('should return false for contestant with undefined controlled squares', () => {
      const contestant: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
      };
      expect(isDuelEligible(contestant)).toBe(false);
    });

    it('should return false for eliminated contestant even with controlled squares', () => {
      const contestant: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: true,
        controlledSquares: ['0-0', '0-1', '1-0'],
      };
      expect(isDuelEligible(contestant)).toBe(false);
    });
  });

  describe('getDuelEligibleContestants', () => {
    it('should return only eligible contestants', () => {
      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Test', slides: [] },
          wins: 5,
          eliminated: false,
          controlledSquares: ['0-0'],
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Test', slides: [] },
          wins: 3,
          eliminated: true,
          controlledSquares: ['1-0'],
        },
        {
          id: '3',
          name: 'Carol',
          category: { name: 'Test', slides: [] },
          wins: 2,
          eliminated: false,
          controlledSquares: ['2-0'],
        },
        {
          id: '4',
          name: 'David',
          category: { name: 'Test', slides: [] },
          wins: 1,
          eliminated: false,
          controlledSquares: [],
        },
      ];

      const eligible = getDuelEligibleContestants(contestants);

      expect(eligible).toHaveLength(2);
      expect(eligible[0]?.name).toBe('Alice');
      expect(eligible[1]?.name).toBe('Carol');
    });

    it('should return empty array when no contestants are eligible', () => {
      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Test', slides: [] },
          wins: 5,
          eliminated: true,
          controlledSquares: ['0-0'],
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Test', slides: [] },
          wins: 3,
          eliminated: false,
          controlledSquares: [],
        },
      ];

      const eligible = getDuelEligibleContestants(contestants);

      expect(eligible).toHaveLength(0);
    });

    it('should return empty array for empty input', () => {
      const eligible = getDuelEligibleContestants([]);
      expect(eligible).toHaveLength(0);
    });
  });

  describe('canStartDuel', () => {
    it('should return true when 2 or more eligible contestants', () => {
      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Test', slides: [] },
          wins: 5,
          eliminated: false,
          controlledSquares: ['0-0'],
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Test', slides: [] },
          wins: 3,
          eliminated: false,
          controlledSquares: ['1-0'],
        },
      ];

      expect(canStartDuel(contestants)).toBe(true);
    });

    it('should return false when only 1 eligible contestant', () => {
      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Test', slides: [] },
          wins: 5,
          eliminated: false,
          controlledSquares: ['0-0'],
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Test', slides: [] },
          wins: 3,
          eliminated: true,
          controlledSquares: ['1-0'],
        },
      ];

      expect(canStartDuel(contestants)).toBe(false);
    });

    it('should return false when no eligible contestants', () => {
      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Test', slides: [] },
          wins: 5,
          eliminated: true,
          controlledSquares: ['0-0'],
        },
      ];

      expect(canStartDuel(contestants)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(canStartDuel([])).toBe(false);
    });

    it('should return true with exactly 2 eligible contestants', () => {
      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Test', slides: [] },
          wins: 5,
          eliminated: false,
          controlledSquares: ['0-0'],
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Test', slides: [] },
          wins: 3,
          eliminated: false,
          controlledSquares: ['1-0'],
        },
      ];

      expect(canStartDuel(contestants)).toBe(true);
    });

    it('should return true with more than 2 eligible contestants', () => {
      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Test', slides: [] },
          wins: 5,
          eliminated: false,
          controlledSquares: ['0-0'],
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Test', slides: [] },
          wins: 3,
          eliminated: false,
          controlledSquares: ['1-0'],
        },
        {
          id: '3',
          name: 'Carol',
          category: { name: 'Test', slides: [] },
          wins: 2,
          eliminated: false,
          controlledSquares: ['2-0'],
        },
      ];

      expect(canStartDuel(contestants)).toBe(true);
    });
  });

  describe('canContestantsDuel', () => {
    it('should return true when both contestants are eligible and adjacent', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0', '0-1'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['1-0', '1-1'], // Adjacent to Alice (0-0 is next to 1-0)
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(true);
    });

    it('should return false when contestant1 is eliminated', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: true, // Eliminated
        controlledSquares: ['0-0', '0-1'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['1-0', '1-1'],
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(false);
    });

    it('should return false when contestant2 is eliminated', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0', '0-1'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: true, // Eliminated
        controlledSquares: ['1-0', '1-1'],
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(false);
    });

    it('should return false when contestant1 has no territory', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: [], // No territory
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['1-0', '1-1'],
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(false);
    });

    it('should return false when contestant2 has no territory', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0', '0-1'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: [], // No territory
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(false);
    });

    it('should return false when contestants are not adjacent', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0', '0-1'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['3-3', '3-4'], // Far away from Alice
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(false);
    });

    it('should return false when contestants are only diagonally adjacent', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['1-1'], // Diagonal to Alice, not edge-adjacent
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(false);
    });

    it('should return true when contestants have multi-square adjacent territories', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0', '0-1', '0-2', '1-0', '1-1'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['1-2', '1-3', '2-2', '2-3'], // Adjacent to Alice at 1-1 and 0-2
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(true);
    });

    it('should work correctly with other contestants in the list', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0', '0-1'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['1-0', '1-1'],
      };

      const contestant3: Contestant = {
        id: '3',
        name: 'Carol',
        category: { name: 'Test', slides: [] },
        wins: 2,
        eliminated: false,
        controlledSquares: ['2-0', '2-1'],
      };

      const allContestants = [contestant1, contestant2, contestant3];

      // Alice and Bob are adjacent
      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(true);

      // Bob and Carol are adjacent
      expect(canContestantsDuel(contestant2, contestant3, allContestants)).toBe(true);

      // Alice and Carol are not adjacent
      expect(canContestantsDuel(contestant1, contestant3, allContestants)).toBe(false);
    });

    it('should handle vertically adjacent territories', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['0-1'], // Right of Alice
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(true);
    });

    it('should handle horizontally adjacent territories', () => {
      const contestant1: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Test', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0'],
      };

      const contestant2: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Test', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['1-0'], // Below Alice
      };

      const allContestants = [contestant1, contestant2];

      expect(canContestantsDuel(contestant1, contestant2, allContestants)).toBe(true);
    });
  });
});
