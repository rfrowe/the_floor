/**
 * Custom hook for managing current duel state with localStorage persistence
 * Stores only references (IDs) in localStorage and hydrates full objects from IndexedDB
 */

import { useState, useEffect, useCallback } from 'react';
import type { DuelState, DuelStateReference, Contestant, StoredCategory } from '@types';
import { getContestantById, getCategoryById } from '@storage/indexedDB';
import { createLogger } from '@/utils/logger';

const log = createLogger('DuelState');

const STORAGE_KEY = 'duel';

/**
 * Converts a full DuelState to a lightweight reference for localStorage
 */
function duelStateToReference(state: DuelState): DuelStateReference {
  return {
    contestant1Id: state.contestant1.id,
    contestant2Id: state.contestant2.id,
    selectedCategoryId: state.selectedCategoryId,
    activePlayer: state.activePlayer,
    timeRemaining1: state.timeRemaining1,
    timeRemaining2: state.timeRemaining2,
    currentSlideIndex: state.currentSlideIndex,
    isSkipAnimationActive: state.isSkipAnimationActive,
    isQuickDuel: state.isQuickDuel ?? false,
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
      log.error('Failed to hydrate duel state: contestants not found in IndexedDB');
      return null;
    }

    // Single, unified hydration path: load the category by ID from the categories store.
    // This supports both normal duels (player categories) and quick duels (any library
    // category), and works cross-window into the Audience View.
    const selectedCategory = await getCategoryById<StoredCategory>(ref.selectedCategoryId);

    if (!selectedCategory) {
      log.error('Failed to hydrate duel state: category not found in IndexedDB');
      return null;
    }

    return {
      contestant1,
      contestant2,
      selectedCategory,
      selectedCategoryId: ref.selectedCategoryId,
      activePlayer: ref.activePlayer,
      timeRemaining1: ref.timeRemaining1,
      timeRemaining2: ref.timeRemaining2,
      currentSlideIndex: ref.currentSlideIndex,
      isSkipAnimationActive: ref.isSkipAnimationActive,
      isQuickDuel: ref.isQuickDuel ?? false,
    };
  } catch (error) {
    log.error('Error hydrating duel state:', error);
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
        log.error('Failed to load duel state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDuelState();

    // Listen for storage changes from other windows (cross-window sync)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue !== null) {
        try {
          const reference = JSON.parse(event.newValue) as DuelStateReference;
          void hydrateReference(reference).then((hydrated) => {
            if (hydrated) {
              setDuelState(hydrated);
            }
          });
        } catch (error) {
          log.error('Failed to sync duel state from storage event:', error);
        }
      } else if (event.key === STORAGE_KEY && event.newValue === null) {
        // Duel was cleared in another window
        setDuelState(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
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
          log.error('Failed to save duel state:', error);
        }

        return newState;
      });
    },
    []
  );

  // Return null while loading to avoid flashing incorrect state
  return [isLoading ? null : duelState, setDuelStateWrapper];
}
