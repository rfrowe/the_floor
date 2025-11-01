/**
 * Custom hook for managing current duel state with localStorage persistence
 */

import type { DuelState } from '@types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'duel';

/**
 * Hook for managing the current duel state
 * @returns Tuple of [duelState, setDuelState]
 */
export function useDuelState(): [
  DuelState | null,
  (value: DuelState | null | ((prev: DuelState | null) => DuelState | null)) => void,
] {
  return useLocalStorage<DuelState | null>(STORAGE_KEY, null);
}
