/**
 * Tests for territory consolidation logic
 */

import { describe, it, expect } from 'vitest';
import type { Contestant } from '@types';
import { consolidateTerritories } from './territoryConsolidation';

describe('territoryConsolidation', () => {
  describe('consolidateTerritories', () => {
    it('winner absorbs all loser squares', () => {
      const winner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 2,
        eliminated: false,
        controlledSquares: ['0-0', '0-1'],
      };

      const loser: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 1,
        eliminated: false,
        controlledSquares: ['1-0', '1-1'],
      };

      const allContestants = [winner, loser];
      const result = consolidateTerritories(winner, loser, allContestants);

      const updatedWinner = result.find((c) => c.id === '1');
      const updatedLoser = result.find((c) => c.id === '2');

      expect(updatedWinner?.controlledSquares).toEqual(['0-0', '0-1', '1-0', '1-1']);
      expect(updatedWinner?.wins).toBe(3); // Incremented
      expect(updatedLoser?.controlledSquares).toEqual([]);
      expect(updatedLoser?.eliminated).toBe(true);
    });

    it('loser is marked as eliminated', () => {
      const winner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-0'],
      };

      const loser: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['1-0'],
      };

      const result = consolidateTerritories(winner, loser, [winner, loser]);
      const updatedLoser = result.find((c) => c.id === '2');

      expect(updatedLoser?.eliminated).toBe(true);
      expect(updatedLoser?.controlledSquares).toEqual([]);
    });

    it('winner wins count increments by 1', () => {
      const winner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 5,
        eliminated: false,
        controlledSquares: ['0-0'],
      };

      const loser: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['1-0'],
      };

      const result = consolidateTerritories(winner, loser, [winner, loser]);
      const updatedWinner = result.find((c) => c.id === '1');

      expect(updatedWinner?.wins).toBe(6);
    });

    it('other contestants remain unchanged', () => {
      const winner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 1,
        eliminated: false,
        controlledSquares: ['0-0'],
      };

      const loser: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 1,
        eliminated: false,
        controlledSquares: ['1-0'],
      };

      const other: Contestant = {
        id: '3',
        name: 'Carol',
        category: { name: 'History', slides: [] },
        wins: 2,
        eliminated: false,
        controlledSquares: ['2-0', '2-1'],
      };

      const result = consolidateTerritories(winner, loser, [winner, loser, other]);
      const updatedOther = result.find((c) => c.id === '3');

      expect(updatedOther).toEqual(other); // Unchanged
    });

    it('handles winner with no initial squares', () => {
      const winner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        // controlledSquares omitted (optional)
      };

      const loser: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['1-0'],
      };

      const result = consolidateTerritories(winner, loser, [winner, loser]);
      const updatedWinner = result.find((c) => c.id === '1');

      expect(updatedWinner?.controlledSquares).toEqual(['1-0']);
    });

    it('handles loser with no squares', () => {
      const winner: Contestant = {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-0'],
      };

      const loser: Contestant = {
        id: '2',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
        // controlledSquares omitted (optional)
      };

      const result = consolidateTerritories(winner, loser, [winner, loser]);
      const updatedWinner = result.find((c) => c.id === '1');

      expect(updatedWinner?.controlledSquares).toEqual(['0-0']);
    });

    it('preserves other contestant properties', () => {
      const winner: Contestant = {
        id: '1',
        name: 'Alice',
        category: {
          name: 'Math',
          slides: [{ imageUrl: 'test.jpg', censorBoxes: [], answer: 'Test Answer' }],
        },
        wins: 1,
        eliminated: false,
        controlledSquares: ['0-0'],
      };

      const loser: Contestant = {
        id: '2',
        name: 'Bob',
        category: {
          name: 'Science',
          slides: [{ imageUrl: 'test2.jpg', censorBoxes: [], answer: 'Test Answer 2' }],
        },
        wins: 0,
        eliminated: false,
        controlledSquares: ['1-0'],
      };

      const result = consolidateTerritories(winner, loser, [winner, loser]);
      const updatedWinner = result.find((c) => c.id === '1');
      const updatedLoser = result.find((c) => c.id === '2');

      // Winner properties preserved
      expect(updatedWinner?.name).toBe('Alice');
      expect(updatedWinner?.category.name).toBe('Math');

      // Loser properties preserved (except eliminated and controlledSquares)
      expect(updatedLoser?.name).toBe('Bob');
      expect(updatedLoser?.category.name).toBe('Science');
    });
  });
});
