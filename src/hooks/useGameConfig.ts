/**
 * Custom hook for managing game configuration with localStorage persistence
 */

import { DEFAULT_GAME_CONFIG, type GameConfig } from '@types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'config';

/**
 * Hook for managing game configuration
 * @returns Tuple of [config, setConfig]
 */
export function useGameConfig(): [
  GameConfig,
  (value: GameConfig | ((prev: GameConfig) => GameConfig)) => void,
] {
  return useLocalStorage<GameConfig>(STORAGE_KEY, DEFAULT_GAME_CONFIG);
}
