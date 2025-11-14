/**
 * Tests for grid utility functions
 */

import { describe, it, expect, vi } from 'vitest';
import type { Contestant } from '@types';
import {
  parseSquareId,
  getAdjacentSquares,
  areAdjacent,
  initializeContestantPositions,
  getAdjacentContestants,
  getNameDisplayInfo,
  isTerritoryContiguous,
  validateTerritoryContiguity,
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

      expect(getNameDisplayInfo(owner, 2, 3).shouldDisplay).toBe(true);
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

      expect(getNameDisplayInfo(owner, 0, 0).shouldDisplay).toBe(false);
    });

    it('returns true only for one square in multi-square territory', () => {
      const owner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['2-3', '2-4', '3-3', '3-4'], // 2x2 square
      };

      // Centroid: average of centers (2.5,3.5), (2.5,4.5), (3.5,3.5), (3.5,4.5)
      // Row: (2.5+2.5+3.5+3.5)/4 = 12/4 = 3.0
      // Col: (3.5+4.5+3.5+4.5)/4 = 16/4 = 4.0
      // Centroid at (3.0, 4.0) falls in square (3, 4)
      const results = [
        getNameDisplayInfo(owner, 2, 3).shouldDisplay,
        getNameDisplayInfo(owner, 2, 4).shouldDisplay,
        getNameDisplayInfo(owner, 3, 3).shouldDisplay,
        getNameDisplayInfo(owner, 3, 4).shouldDisplay,
      ];

      // Exactly one should be true
      expect(results.filter((r) => r)).toHaveLength(1);
      expect(getNameDisplayInfo(owner, 3, 4).shouldDisplay).toBe(true);
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

  describe('getNameDisplayInfo', () => {
    describe('single square territory', () => {
      it('displays at center with no offset', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
          controlledSquares: ['2-3'],
        };

        const info = getNameDisplayInfo(owner, 2, 3);
        expect(info.shouldDisplay).toBe(true);
        expect(info.offset).toEqual({ x: 0, y: 0 });

        // Other squares should not display
        expect(getNameDisplayInfo(owner, 2, 4).shouldDisplay).toBe(false);
        expect(getNameDisplayInfo(owner, 3, 3).shouldDisplay).toBe(false);
      });
    });

    describe('2x2 square territory', () => {
      it('displays in square containing centroid with offset', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 3,
          eliminated: false,
          controlledSquares: ['2-2', '2-3', '3-2', '3-3'], // 2x2 square
        };

        // Centroid calculation: avg of (row+0.5, col+0.5) for each square
        // = ((2.5+2.5+3.5+3.5)/4, (2.5+3.5+2.5+3.5)/4) = (3.0, 3.0)
        // So centroid is in square (3, 3)
        // Offset: x = 3.0 - 3 - 0.5 = -0.5, y = 3.0 - 3 - 0.5 = -0.5
        const info = getNameDisplayInfo(owner, 3, 3);
        expect(info.shouldDisplay).toBe(true);
        expect(info.offset).toBeDefined();
        if (!info.offset) throw new Error('Test error: offset should be defined');
        expect(info.offset.x).toBeCloseTo(-0.5, 2);
        expect(info.offset.y).toBeCloseTo(-0.5, 2);

        // Only one square should display
        const displayingSquares = [
          getNameDisplayInfo(owner, 2, 2),
          getNameDisplayInfo(owner, 2, 3),
          getNameDisplayInfo(owner, 3, 2),
          getNameDisplayInfo(owner, 3, 3),
        ].filter((info) => info.shouldDisplay);

        expect(displayingSquares).toHaveLength(1);
      });
    });

    describe('pentagon (plus shape)', () => {
      it('displays at exact centroid in center square', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 4,
          eliminated: false,
          // Plus/cross shape:
          //     [1]
          //  [0][1][2]
          //     [1]
          controlledSquares: ['0-1', '1-0', '1-1', '1-2', '2-1'],
        };

        // Centroid: row = (0+1+1+1+2)/5 = 5/5 = 1
        //           col = (1+0+1+2+1)/5 = 5/5 = 1
        // Centroid at (1, 1) - the center square
        const info = getNameDisplayInfo(owner, 1, 1);
        expect(info.shouldDisplay).toBe(true);
        expect(info.offset).toEqual({ x: 0, y: 0 });

        // Other squares should not display
        expect(getNameDisplayInfo(owner, 0, 1).shouldDisplay).toBe(false);
        expect(getNameDisplayInfo(owner, 1, 0).shouldDisplay).toBe(false);
        expect(getNameDisplayInfo(owner, 1, 2).shouldDisplay).toBe(false);
        expect(getNameDisplayInfo(owner, 2, 1).shouldDisplay).toBe(false);
      });
    });

    describe('pentagon (asymmetric L-shape)', () => {
      it('displays with offset when centroid is off-center', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 4,
          eliminated: false,
          // L-shape pentagon:
          //  [0][0]
          //  [1][1]
          //     [2]
          controlledSquares: ['0-0', '0-1', '1-0', '1-1', '2-1'],
        };

        // Centroid: avg of (row+0.5, col+0.5) for each square
        // row = (0.5+0.5+1.5+1.5+2.5)/5 = 6.5/5 = 1.3
        // col = (0.5+1.5+0.5+1.5+1.5)/5 = 5.5/5 = 1.1
        // Centroid at (1.3, 1.1) falls in square (1, 1)
        // Offset from (1,1) center: x = 1.1 - 1 - 0.5 = -0.4, y = 1.3 - 1 - 0.5 = -0.2
        const info = getNameDisplayInfo(owner, 1, 1);
        expect(info.shouldDisplay).toBe(true);
        expect(info.offset).toBeDefined();
        if (!info.offset) throw new Error('Test error: offset should be defined');
        expect(info.offset.x).toBeCloseTo(-0.4, 2);
        expect(info.offset.y).toBeCloseTo(-0.2, 2);

        // Only this square should display
        const controlledSquares = owner.controlledSquares;
        if (!controlledSquares) throw new Error('Test error: controlledSquares should be defined');
        const displayingSquares = controlledSquares
          .map((sq) => {
            const { row, col } = parseSquareId(sq);
            return getNameDisplayInfo(owner, row, col);
          })
          .filter((info) => info.shouldDisplay);

        expect(displayingSquares).toHaveLength(1);
      });
    });

    describe('concave shape (centroid outside territory)', () => {
      it('falls back to closest square when centroid is outside', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 5,
          eliminated: false,
          // Two vertical bars with gap:
          //  [0]   [2]
          //  [1]   [2]
          //  [2]   [2]
          controlledSquares: ['0-0', '1-0', '2-0', '0-2', '1-2', '2-2'],
        };

        // Centroid: row = (0+1+2+0+1+2)/6 = 6/6 = 1
        //           col = (0+0+0+2+2+2)/6 = 6/6 = 1
        // Centroid at (1, 1) is NOT owned (it's the gap)
        // Should fall back to one of the closest squares

        // Exactly one square should display
        const controlledSquares = owner.controlledSquares;
        if (!controlledSquares) throw new Error('Test error: controlledSquares should be defined');
        const displayingSquares = controlledSquares
          .map((sq) => {
            const { row, col } = parseSquareId(sq);
            return getNameDisplayInfo(owner, row, col);
          })
          .filter((info) => info.shouldDisplay);

        expect(displayingSquares).toHaveLength(1);

        // The displaying square should have no offset (fallback mode)
        const displayInfo = displayingSquares[0];
        expect(displayInfo?.offset).toEqual({ x: 0, y: 0 });
      });
    });

    describe('horizontal line', () => {
      it('displays at centroid with horizontal offset', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 2,
          eliminated: false,
          controlledSquares: ['1-0', '1-1', '1-2'], // Horizontal line
        };

        // Centroid: row = (1+1+1)/3 = 1, col = (0+1+2)/3 = 1
        // Centroid at (1, 1) - the center square
        const info = getNameDisplayInfo(owner, 1, 1);
        expect(info.shouldDisplay).toBe(true);
        expect(info.offset).toEqual({ x: 0, y: 0 });

        // Only center square displays
        expect(getNameDisplayInfo(owner, 1, 0).shouldDisplay).toBe(false);
        expect(getNameDisplayInfo(owner, 1, 2).shouldDisplay).toBe(false);
      });
    });

    describe('vertical line', () => {
      it('displays at centroid with vertical offset', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 2,
          eliminated: false,
          controlledSquares: ['0-2', '1-2', '2-2'], // Vertical line
        };

        // Centroid: row = (0+1+2)/3 = 1, col = (2+2+2)/3 = 2
        // Centroid at (1, 2) - the center square
        const info = getNameDisplayInfo(owner, 1, 2);
        expect(info.shouldDisplay).toBe(true);
        expect(info.offset).toEqual({ x: 0, y: 0 });

        // Only center square displays
        expect(getNameDisplayInfo(owner, 0, 2).shouldDisplay).toBe(false);
        expect(getNameDisplayInfo(owner, 2, 2).shouldDisplay).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('returns false for empty controlled squares', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
          controlledSquares: [],
        };

        const info = getNameDisplayInfo(owner, 0, 0);
        expect(info.shouldDisplay).toBe(false);
        expect(info.offset).toBeUndefined();
      });

      it('returns false for undefined controlled squares', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
        };

        const info = getNameDisplayInfo(owner, 0, 0);
        expect(info.shouldDisplay).toBe(false);
      });

      it('handles fractional centroid within owned square', () => {
        const owner: Contestant = {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 1,
          eliminated: false,
          controlledSquares: ['0-0', '0-1'], // Two squares side by side
        };

        // Centroid: avg of (row+0.5, col+0.5) = ((0.5+0.5)/2, (0.5+1.5)/2) = (0.5, 1.0)
        // Centroid at (0.5, 1.0) falls in square (0, 1)
        // Offset: x = 1.0 - 1 - 0.5 = -0.5, y = 0.5 - 0 - 0.5 = 0
        const info = getNameDisplayInfo(owner, 0, 1);
        expect(info.shouldDisplay).toBe(true);
        if (!info.offset) throw new Error('Test error: offset should be defined');
        expect(info.offset.x).toBeCloseTo(-0.5, 2);
        expect(info.offset.y).toBeCloseTo(0, 2);
      });
    });

    describe('consistency', () => {
      it('always displays in exactly one square for any territory', () => {
        const testCases = [
          ['0-0'], // Single
          ['0-0', '0-1'], // Pair
          ['0-0', '0-1', '1-0'], // L-shape
          ['0-0', '0-1', '1-0', '1-1'], // 2x2
          ['0-1', '1-0', '1-1', '1-2', '2-1'], // Plus
          ['0-0', '0-1', '0-2', '1-0', '1-2', '2-0', '2-2'], // Ring (concave)
        ];

        testCases.forEach((squares, idx) => {
          const owner: Contestant = {
            id: String(idx),
            name: `Test ${String(idx)}`,
            category: { name: 'Test', slides: [] },
            wins: squares.length - 1,
            eliminated: false,
            controlledSquares: squares,
          };

          const displayingSquares = squares
            .map((sq) => {
              const { row, col } = parseSquareId(sq);
              return getNameDisplayInfo(owner, row, col);
            })
            .filter((info) => info.shouldDisplay);

          expect(displayingSquares).toHaveLength(1);
          expect(displayingSquares[0]?.offset).toBeDefined();
        });
      });
    });
  });

  describe('isTerritoryContiguous', () => {
    it('returns true for single square', () => {
      expect(isTerritoryContiguous(['2-3'])).toBe(true);
    });

    it('returns true for empty territory', () => {
      expect(isTerritoryContiguous([])).toBe(true);
    });

    it('returns true for horizontal line', () => {
      expect(isTerritoryContiguous(['1-0', '1-1', '1-2'])).toBe(true);
    });

    it('returns true for vertical line', () => {
      expect(isTerritoryContiguous(['0-2', '1-2', '2-2'])).toBe(true);
    });

    it('returns true for L-shape', () => {
      expect(isTerritoryContiguous(['0-0', '0-1', '1-0'])).toBe(true);
    });

    it('returns true for 2x2 square', () => {
      expect(isTerritoryContiguous(['2-2', '2-3', '3-2', '3-3'])).toBe(true);
    });

    it('returns true for plus/cross shape', () => {
      expect(isTerritoryContiguous(['0-1', '1-0', '1-1', '1-2', '2-1'])).toBe(true);
    });

    it('returns true for U-shape (concave but contiguous)', () => {
      expect(
        isTerritoryContiguous([
          '0-0',
          '0-1',
          '0-2',
          '0-3',
          '0-4',
          '1-0',
          '1-4',
          '2-0',
          '2-1',
          '2-2',
          '2-3',
          '2-4',
        ])
      ).toBe(true);
    });

    it('returns false for non-contiguous territory (two separate groups)', () => {
      // Two separate blocks with gap
      expect(isTerritoryContiguous(['0-0', '0-1', '3-3', '3-4'])).toBe(false);
    });

    it('returns false for horizontal gap', () => {
      expect(isTerritoryContiguous(['1-0', '1-2'])).toBe(false); // Gap at 1-1
    });

    it('returns false for vertical gap', () => {
      expect(isTerritoryContiguous(['0-1', '2-1'])).toBe(false); // Gap at 1-1
    });

    it('returns false for diagonal-only connection', () => {
      // These are diagonal neighbors, not orthogonally adjacent
      expect(isTerritoryContiguous(['0-0', '1-1'])).toBe(false);
    });
  });

  describe('validateTerritoryContiguity', () => {
    it('returns true and logs success for all valid territories', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        /* mock implementation */
      });

      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 2,
          eliminated: false,
          controlledSquares: ['0-0', '0-1', '1-0'], // L-shape
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 3,
          eliminated: false,
          controlledSquares: ['2-2', '2-3', '3-2', '3-3'], // 2x2
        },
      ];

      const result = validateTerritoryContiguity(contestants);

      expect(result).toBe(true);
      // Logger formats output, so check it was called and message contains validation text
      expect(consoleSpy).toHaveBeenCalled();
      const hasValidationMessage = consoleSpy.mock.calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Territory Validation'))
      );
      expect(hasValidationMessage).toBe(true);

      consoleSpy.mockRestore();
    });

    it('returns false and logs error for non-contiguous territory', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        /* mock implementation */
      });

      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 2,
          eliminated: false,
          controlledSquares: ['0-0', '0-1', '1-0'], // Valid L-shape
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 3,
          eliminated: false,
          controlledSquares: ['2-2', '4-4'], // Non-contiguous!
        },
      ];

      const result = validateTerritoryContiguity(contestants);

      expect(result).toBe(false);
      // Logger formats error output, check it was called and contains error info
      expect(consoleErrorSpy).toHaveBeenCalled();
      const hasErrorMessage = consoleErrorSpy.mock.calls.some((call) =>
        call.some(
          (arg) => typeof arg === 'string' && arg.includes('NON-CONTIGUOUS') && arg.includes('Bob')
        )
      );
      expect(hasErrorMessage).toBe(true);

      consoleErrorSpy.mockRestore();
    });

    it('skips contestants with no territory', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        /* mock implementation */
      });

      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
          controlledSquares: [], // No territory
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 1,
          eliminated: false,
          controlledSquares: ['0-0'],
        },
      ];

      const result = validateTerritoryContiguity(contestants);

      expect(result).toBe(true);
      // Logger formats output, check it was called and contains validation text
      expect(consoleSpy).toHaveBeenCalled();
      const hasValidationMessage = consoleSpy.mock.calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Territory Validation'))
      );
      expect(hasValidationMessage).toBe(true);

      consoleSpy.mockRestore();
    });

    it('detects multiple non-contiguous territories', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        /* mock implementation */
      });

      const contestants: Contestant[] = [
        {
          id: '1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 2,
          eliminated: false,
          controlledSquares: ['0-0', '2-2'], // Gap
        },
        {
          id: '2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 3,
          eliminated: false,
          controlledSquares: ['1-1', '3-3'], // Gap
        },
      ];

      const result = validateTerritoryContiguity(contestants);

      expect(result).toBe(false);
      // Logger may call console.error multiple times (once per error, plus once for data)
      expect(consoleErrorSpy).toHaveBeenCalled();
      // Check both contestants are mentioned in error output
      const allCalls = consoleErrorSpy.mock.calls.flat().join(' ');
      expect(allCalls).toContain('Alice');
      expect(allCalls).toContain('Bob');

      consoleErrorSpy.mockRestore();
    });
  });
});
