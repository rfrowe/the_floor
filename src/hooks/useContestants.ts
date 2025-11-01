/**
 * Custom hook for managing contestants list with localStorage persistence
 */

import type { Contestant } from '@types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'contestants';

/**
 * Hook for managing the contestants list
 * @returns Tuple of [contestants, setContestants]
 */
export function useContestants(): [
  Contestant[],
  (value: Contestant[] | ((prev: Contestant[]) => Contestant[])) => void,
] {
  return useLocalStorage<Contestant[]>(STORAGE_KEY, []);
}
