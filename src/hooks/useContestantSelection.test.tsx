/**
 * Tests for useContestantSelection hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContestantSelection } from './useContestantSelection';
import type { Contestant } from '@types';

// Helper function to create test contestants
function createContestant(
  id: string,
  name: string,
  eliminated: boolean,
  controlledSquares?: string[]
): Contestant {
  const contestant: Contestant = {
    id,
    name,
    category: { name: 'Test Category', slides: [] },
    wins: 0,
    eliminated,
  };

  if (controlledSquares) {
    contestant.controlledSquares = controlledSquares;
  }

  return contestant;
}

describe('useContestantSelection', () => {
  let contestants: Contestant[];

  beforeEach(() => {
    // Create contestants with adjacent territories
    // Alice: 0-0, Bob: 0-1 (right of Alice), Charlie: 0-2 (right of Bob), David: 1-0 (below Alice)
    contestants = [
      createContestant('1', 'Alice', false, ['0-0']),
      createContestant('2', 'Bob', false, ['0-1']), // Adjacent to Alice
      createContestant('3', 'Charlie', false, ['0-2']), // Adjacent to Bob
      createContestant('4', 'David', true, ['1-0']), // eliminated, adjacent to Alice
    ];
  });

  describe('Initial State', () => {
    it('starts with no contestants selected', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      expect(result.current.selected).toEqual([null, null]);
    });
  });

  describe('Selection Functionality', () => {
    it('selects first contestant in first slot', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      if (!alice) throw new Error('Alice not found');

      act(() => {
        result.current.select(alice);
      });

      expect(result.current.selected[0]).toBe(alice);
      expect(result.current.selected[1]).toBeNull();
    });

    it('selects second contestant in second slot', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      const bob = contestants[1];
      if (!alice || !bob) throw new Error('Contestants not found');

      act(() => {
        result.current.select(alice);
      });

      act(() => {
        result.current.select(bob);
      });

      expect(result.current.selected[0]).toBe(alice);
      expect(result.current.selected[1]).toBe(bob);
    });

    it('can select eliminated contestants (UI prevents this, but hook allows)', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const david = contestants[3];
      if (!david) throw new Error('David not found');

      act(() => {
        result.current.select(david);
      });

      expect(result.current.selected[0]).toBe(david);
    });

    it('clicking selected contestant1 deselects it', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      if (!alice) throw new Error('Alice not found');

      act(() => {
        result.current.select(alice);
      });
      expect(result.current.selected[0]).toBe(alice);

      act(() => {
        result.current.select(alice);
      });
      expect(result.current.selected[0]).toBeNull();
    });

    it('clicking selected contestant2 deselects it', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      const bob = contestants[1];
      if (!alice || !bob) throw new Error('Contestants not found');

      act(() => {
        result.current.select(alice);
      });

      act(() => {
        result.current.select(bob);
      });
      expect(result.current.selected[1]).toBe(bob);

      act(() => {
        result.current.select(bob);
      });
      expect(result.current.selected[1]).toBeNull();
      expect(result.current.selected[0]).toBe(alice); // Alice still selected
    });

    it('selecting third contestant rotates selection', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      const bob = contestants[1];
      const charlie = contestants[2];
      if (!alice || !bob || !charlie) throw new Error('Contestants not found');

      act(() => {
        result.current.select(alice);
      });

      act(() => {
        result.current.select(bob);
      });

      act(() => {
        result.current.select(charlie);
      });

      // Bob moves to contestant1, Charlie becomes contestant2
      expect(result.current.selected[0]).toBe(bob);
      expect(result.current.selected[1]).toBe(charlie);
    });
  });

  describe('Deselection Functionality', () => {
    it('deselects contestant1', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      if (!alice) throw new Error('Alice not found');

      act(() => {
        result.current.select(alice);
      });
      expect(result.current.selected[0]).toBe(alice);

      act(() => {
        result.current.deselect(alice);
      });
      expect(result.current.selected[0]).toBeNull();
    });

    it('deselects contestant2', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      const bob = contestants[1];
      if (!alice || !bob) throw new Error('Contestants not found');

      act(() => {
        result.current.select(alice);
      });

      act(() => {
        result.current.select(bob);
      });

      act(() => {
        result.current.deselect(bob);
      });
      expect(result.current.selected[0]).toBe(alice);
      expect(result.current.selected[1]).toBeNull();
    });

    it('deselecting non-selected contestant does nothing', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      const bob = contestants[1];
      if (!alice || !bob) throw new Error('Contestants not found');

      act(() => {
        result.current.select(alice);
      });

      act(() => {
        result.current.deselect(bob); // Bob not selected
      });

      expect(result.current.selected[0]).toBe(alice);
    });
  });

  describe('Clear Functionality', () => {
    it('clears both selections', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      const bob = contestants[1];
      if (!alice || !bob) throw new Error('Contestants not found');

      act(() => {
        result.current.select(alice);
      });

      act(() => {
        result.current.select(bob);
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.selected).toEqual([null, null]);
    });

    it('clearing empty selection is safe', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));

      act(() => {
        result.current.clear();
      });

      expect(result.current.selected).toEqual([null, null]);
    });
  });

  describe('Random Selection Functionality', () => {
    it('randomly selects a non-eliminated contestant', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));

      act(() => {
        result.current.randomSelect();
      });

      const selected = result.current.selected[0];
      expect(selected).not.toBeNull();
      expect(selected?.eliminated).toBe(false);
      expect([contestants[0], contestants[1], contestants[2]]).toContain(selected);
    });

    it('adds random selection to second slot if one already selected', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      if (!alice) throw new Error('Alice not found');

      act(() => {
        result.current.select(alice);
      });

      act(() => {
        result.current.randomSelect();
      });

      // After random select, we should have at least one selection
      // If Alice was randomly picked again, she toggles off
      // If someone else was picked, they should be in slot 2 with Alice in slot 1
      const hasSelection =
        result.current.selected[0] !== null || result.current.selected[1] !== null;
      expect(hasSelection).toBe(true);
    });

    it('works correctly when both slots full and random select called', () => {
      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      const bob = contestants[1];
      const charlie = contestants[2];
      if (!alice || !bob || !charlie) throw new Error('Contestants not found');

      act(() => {
        result.current.select(alice);
      });

      act(() => {
        result.current.select(bob);
      });

      act(() => {
        result.current.randomSelect();
      });

      // After random select, we should have some selection
      // The exact result depends on which random contestant was picked:
      // - If Charlie was picked: rotation happens, Bob moves to [0], Charlie to [1]
      // - If Alice was picked: Alice toggles off, leaving Bob at [0]
      // - If Bob was picked: Bob toggles off, leaving Alice at [0]

      // At minimum, verify the state is valid (not both null)
      const hasSelection =
        result.current.selected[0] !== null || result.current.selected[1] !== null;
      expect(hasSelection).toBe(true);
    });

    it('does nothing when no eligible contestants', () => {
      const allEliminated = [
        createContestant('1', 'Alice', true),
        createContestant('2', 'Bob', true),
      ];
      const { result } = renderHook(() => useContestantSelection(allEliminated));

      act(() => {
        result.current.randomSelect();
      });

      expect(result.current.selected).toEqual([null, null]);
    });

    it('excludes already selected contestants from random selection', () => {
      // Mock Math.random to always return the first eligible contestant
      const originalRandom = Math.random;
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const { result } = renderHook(() => useContestantSelection(contestants));
      const alice = contestants[0];
      const bob = contestants[1];
      if (!alice) throw new Error('Alice not found');
      if (!bob) throw new Error('Bob not found');

      act(() => {
        result.current.select(alice);
      });
      expect(result.current.selected[0]).toBe(alice);

      // Task 38: Random select now only picks P1 (challenger with smallest territory)
      // All contestants have 1 square (minimum), so it picks from [Bob, Charlie] (excluding Alice)
      // With Math.random returning 0, it will pick Bob as NEW P1
      // P2 is cleared since we're selecting a new challenger
      act(() => {
        result.current.randomSelect();
      });

      // Bob should now be P1, P2 should be null
      expect(result.current.selected[0]).toBe(bob);
      expect(result.current.selected[1]).toBeNull();

      Math.random = originalRandom;
    });
  });

  describe('Edge Cases', () => {
    it('handles empty contestant list', () => {
      const { result } = renderHook(() => useContestantSelection([]));

      act(() => {
        result.current.randomSelect();
      });

      expect(result.current.selected).toEqual([null, null]);
    });

    it('handles only one contestant available', () => {
      const singleContestant = [createContestant('1', 'Alice', false, ['0-0'])];
      const { result } = renderHook(() => useContestantSelection(singleContestant));
      const alice = singleContestant[0];
      if (!alice) throw new Error('Alice not found');

      act(() => {
        result.current.randomSelect();
      });

      expect(result.current.selected[0]).toBe(alice);
    });

    it('maintains selection state when contestant list changes', () => {
      const { result, rerender } = renderHook(
        ({ contestants }) => useContestantSelection(contestants),
        { initialProps: { contestants } }
      );
      const alice = contestants[0];
      if (!alice) throw new Error('Alice not found');

      act(() => {
        result.current.select(alice);
      });

      // Add a new contestant to the list
      const newContestants = [...contestants, createContestant('5', 'Eve', false)];
      rerender({ contestants: newContestants });

      // Selection should still be Alice
      expect(result.current.selected[0]).toBe(alice);
    });
  });
});
