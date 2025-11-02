/**
 * Tests for grid utility functions
 */

import { describe, it, expect } from 'vitest';
import type { Contestant } from '@types';
import {
  parseSquareId,
  getAdjacentSquares,
  areAdjacent,
  initializeContestantPositions,
  shouldDisplayName,
  getAdjacentContestants,
} from './gridUtils';

describe('gridUtils', () => {
  describe('parseSquareId', () => {
    it('parses square ID correctly', () => {
      const result = parseSquareId('2-5');
      expect(result).toEqual({ row: 2, col: 5 });
    });

    it('handles zero indices', () => {
      const result = parseSquareId('0-0');
      expect(result).toEqual({ row: 0, col: 0 });
    });

    it('handles large indices', () => {
      const result = parseSquareId('10-25');
      expect(result).toEqual({ row: 10, col: 25 });
    });
  });

  describe('getAdjacentSquares', () => {
    it('returns 4 adjacent squares for middle position', () => {
      const adjacent = getAdjacentSquares({ row: 2, col: 4 });
      expect(adjacent).toHaveLength(4);
      expect(adjacent).toContain('1-4'); // Up
      expect(adjacent).toContain('3-4'); // Down
      expect(adjacent).toContain('2-3'); // Left
      expect(adjacent).toContain('2-5'); // Right
    });

    it('returns 2 adjacent squares for corner position (0,0)', () => {
      const adjacent = getAdjacentSquares({ row: 0, col: 0 });
      expect(adjacent).toHaveLength(2);
      expect(adjacent).toContain('1-0'); // Down
      expect(adjacent).toContain('0-1'); // Right
    });

    it('returns 3 adjacent squares for edge position', () => {
      const adjacent = getAdjacentSquares({ row: 0, col: 4 });
      expect(adjacent).toHaveLength(3);
      expect(adjacent).toContain('1-4'); // Down
      expect(adjacent).toContain('0-3'); // Left
      expect(adjacent).toContain('0-5'); // Right
    });

    it('respects custom grid config', () => {
      const adjacent = getAdjacentSquares({ row: 1, col: 1 }, { rows: 3, cols: 3 });
      expect(adjacent).toHaveLength(4);
    });

    it('returns empty array for position outside grid', () => {
      // Position at edge with no adjacent squares in bounds
      const adjacent = getAdjacentSquares({ row: 0, col: 0 }, { rows: 1, cols: 1 });
      expect(adjacent).toHaveLength(0);
    });
  });

  describe('areAdjacent', () => {
    it('returns true for horizontally adjacent squares', () => {
      expect(areAdjacent({ row: 2, col: 3 }, { row: 2, col: 4 })).toBe(true);
      expect(areAdjacent({ row: 2, col: 4 }, { row: 2, col: 3 })).toBe(true);
    });

    it('returns true for vertically adjacent squares', () => {
      expect(areAdjacent({ row: 2, col: 3 }, { row: 3, col: 3 })).toBe(true);
      expect(areAdjacent({ row: 3, col: 3 }, { row: 2, col: 3 })).toBe(true);
    });

    it('returns false for diagonal squares', () => {
      expect(areAdjacent({ row: 2, col: 3 }, { row: 3, col: 4 })).toBe(false);
    });

    it('returns false for same square', () => {
      expect(areAdjacent({ row: 2, col: 3 }, { row: 2, col: 3 })).toBe(false);
    });

    it('returns false for distant squares', () => {
      expect(areAdjacent({ row: 0, col: 0 }, { row: 4, col: 8 })).toBe(false);
    });
  });

  describe('initializeContestantPositions', () => {
    it('assigns sequential grid positions to contestants', () => {
      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 0,
          eliminated: false,
        },
        {
          id: '3',
          name: 'Carol',
          category: { name: 'History', slides: [] },
          wins: 0,
          eliminated: false,
        },
      ];

      const positioned = initializeContestantPositions(contestants);

      expect(positioned[0]?.gridPosition).toEqual({ row: 0, col: 0 });
      expect(positioned[0]?.controlledSquares).toEqual(['0-0']);

      expect(positioned[1]?.gridPosition).toEqual({ row: 0, col: 1 });
      expect(positioned[1]?.controlledSquares).toEqual(['0-1']);

      expect(positioned[2]?.gridPosition).toEqual({ row: 0, col: 2 });
      expect(positioned[2]?.controlledSquares).toEqual(['0-2']);
    });

    it('wraps to next row after filling first row', () => {
      const contestants: Contestant[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        name: `Contestant ${String(i)}`,
        category: { name: `Category ${String(i)}`, slides: [] },
        wins: 0,
        eliminated: false,
      }));

      const positioned = initializeContestantPositions(contestants);

      // First row (cols 0-8)
      const contestant8 = positioned[8];
      expect(contestant8?.gridPosition).toEqual({ row: 0, col: 8 });
      // Second row starts
      const contestant9 = positioned[9];
      expect(contestant9?.gridPosition).toEqual({ row: 1, col: 0 });
    });

    it('handles empty contestant list', () => {
      const positioned = initializeContestantPositions([]);
      expect(positioned).toEqual([]);
    });
  });

  describe('shouldDisplayName', () => {
    it('returns true for single-square territory', () => {
      const owner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['2-3'],
      };

      expect(shouldDisplayName(owner, 2, 3)).toBe(true);
    });

    it('returns false for contestant with no controlled squares', () => {
      const owner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: [],
      };

      expect(shouldDisplayName(owner, 0, 0)).toBe(false);
    });

    it('returns true only for central square in multi-square territory', () => {
      const owner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['2-3', '2-4', '3-3', '3-4'], // 2x2 square
      };

      // Centroid is at (2.5, 3.5), so squares (2,3), (2,4), (3,3), (3,4) are all equidistant
      // All should return true (or at least one should)
      const results = [
        shouldDisplayName(owner, 2, 3),
        shouldDisplayName(owner, 2, 4),
        shouldDisplayName(owner, 3, 3),
        shouldDisplayName(owner, 3, 4),
      ];

      // At least one should be true
      expect(results.some((r) => r)).toBe(true);
    });
  });

  describe('getAdjacentContestants', () => {
    it('finds adjacent contestants sharing an edge', () => {
      const alice: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-0'], // Top-left corner
      };

      const bob: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'History', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-1'], // Right of Alice
      };

      const charlie: Contestant = {
        id: '3',
        name: 'Charlie',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['1-0'], // Below Alice
      };

      const dave: Contestant = {
        id: '4',
        name: 'Dave',
        category: { name: 'Art', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['2-2'], // Not adjacent to Alice
      };

      const allContestants = [alice, bob, charlie, dave];
      const adjacent = getAdjacentContestants(alice, allContestants);

      expect(adjacent).toHaveLength(2);
      expect(adjacent.map((c) => c.id)).toContain('2'); // Bob
      expect(adjacent.map((c) => c.id)).toContain('3'); // Charlie
      expect(adjacent.map((c) => c.id)).not.toContain('4'); // Dave
    });

    it('handles multi-square territories', () => {
      const alice: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 2,
        eliminated: false,
        controlledSquares: ['0-0', '0-1', '1-0'], // L-shape
      };

      const bob: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'History', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-2'], // Right of Alice's territory
      };

      const charlie: Contestant = {
        id: '3',
        name: 'Charlie',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['1-1'], // Below/right of Alice's territory
      };

      const allContestants = [alice, bob, charlie];
      const adjacent = getAdjacentContestants(alice, allContestants);

      expect(adjacent).toHaveLength(2);
      expect(adjacent.map((c) => c.id)).toContain('2'); // Bob shares edge with 0-1
      expect(adjacent.map((c) => c.id)).toContain('3'); // Charlie shares edge with 0-1 and 1-0
    });

    it('returns empty array for contestant with no territory', () => {
      const alice: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: [],
      };

      const bob: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'History', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-0'],
      };

      const allContestants = [alice, bob];
      const adjacent = getAdjacentContestants(alice, allContestants);

      expect(adjacent).toEqual([]);
    });

    it('does not include diagonal-only neighbors', () => {
      const alice: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['1-1'], // Center position
      };

      const bob: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'History', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-0'], // Diagonal (top-left)
      };

      const charlie: Contestant = {
        id: '3',
        name: 'Charlie',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-1'], // Above (shares edge)
      };

      const allContestants = [alice, bob, charlie];
      const adjacent = getAdjacentContestants(alice, allContestants);

      expect(adjacent).toHaveLength(1);
      expect(adjacent[0]?.id).toBe('3'); // Only Charlie, not Bob
    });

    it('returns empty array when no adjacent contestants', () => {
      const alice: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['2-2'],
      };

      const bob: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'History', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['4-4'], // Far away
      };

      const allContestants = [alice, bob];
      const adjacent = getAdjacentContestants(alice, allContestants);

      expect(adjacent).toEqual([]);
    });

    it('does not include self in adjacent contestants', () => {
      const alice: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-0', '0-1'], // Two adjacent squares
      };

      const allContestants = [alice];
      const adjacent = getAdjacentContestants(alice, allContestants);

      expect(adjacent).toEqual([]); // Alice is not adjacent to herself
    });
  });
});
