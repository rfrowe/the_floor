/**
 * Custom hook for managing current duel state with localStorage persistence
 * Stores only references (IDs) in localStorage and hydrates full objects from IndexedDB
 */

import { useState, useEffect, useCallback } from 'react';
import type { DuelState, DuelStateReference, Contestant } from '@types';
import { getContestantById } from '@storage/indexedDB';

const STORAGE_KEY = 'duel';

/**
 * Converts a full DuelState to a lightweight reference for localStorage
 */
function duelStateToReference(state: DuelState): DuelStateReference {
  return {
    contestant1Id: state.contestant1.id,
    contestant2Id: state.contestant2.id,
    selectedCategoryName: state.selectedCategory.name,
    activePlayer: state.activePlayer,
    timeRemaining1: state.timeRemaining1,
    timeRemaining2: state.timeRemaining2,
    currentSlideIndex: state.currentSlideIndex,
    isSkipAnimationActive: state.isSkipAnimationActive,
  };
}

/**
 * Hydrates a DuelStateReference back to a full DuelState by loading from IndexedDB
 */
async function hydrateReference(ref: DuelStateReference): Promise<DuelState | null> {
  try {
    const contestant1 = await getContestantById<Contestant>(ref.contestant1Id);
    const contestant2 = await getContestantById<Contestant>(ref.contestant2Id);

    if (!contestant1 || !contestant2) {
      console.error('Failed to hydrate duel state: contestants not found in IndexedDB');
      return null;
    }

    // Find the selected category from one of the contestants
    const selectedCategory =
      contestant1.category.name === ref.selectedCategoryName
        ? contestant1.category
        : contestant2.category;

    return {
      contestant1,
      contestant2,
      selectedCategory,
      activePlayer: ref.activePlayer,
      timeRemaining1: ref.timeRemaining1,
      timeRemaining2: ref.timeRemaining2,
      currentSlideIndex: ref.currentSlideIndex,
      isSkipAnimationActive: ref.isSkipAnimationActive,
    };
  } catch (error) {
    console.error('Error hydrating duel state:', error);
    return null;
  }
}

/**
 * Hook for managing the current duel state
 * Stores references in localStorage and hydrates full objects from IndexedDB
 * @returns Tuple of [duelState, setDuelState]
 */
export function useDuelState(): [
  DuelState | null,
  (value: DuelState | null | ((prev: DuelState | null) => DuelState | null)) => void,
] {
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load and hydrate on mount
  useEffect(() => {
    const loadDuelState = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const reference = JSON.parse(stored) as DuelStateReference;
          const hydrated = await hydrateReference(reference);
          setDuelState(hydrated);
        }
      } catch (error) {
        console.error('Failed to load duel state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDuelState();
  }, []);

  // Setter that handles both DuelState and updater functions
  const setDuelStateWrapper = useCallback(
    (value: DuelState | null | ((prev: DuelState | null) => DuelState | null)) => {
      setDuelState((prev) => {
        const newState = typeof value === 'function' ? value(prev) : value;

        // Save reference to localStorage
        try {
          if (newState === null) {
            localStorage.removeItem(STORAGE_KEY);
          } else {
            const reference = duelStateToReference(newState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reference));
          }
        } catch (error) {
          console.error('Failed to save duel state:', error);
        }

        return newState;
      });
    },
    []
  );

  // Return null while loading to avoid flashing incorrect state
  return [isLoading ? null : duelState, setDuelStateWrapper];
}
