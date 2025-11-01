/**
 * Game configuration and state type definitions
 * Based on SPEC.md section 4.6
 */

import type { Contestant } from './contestant';
import type { DuelState } from './duel';

/**
 * Configuration settings for the game.
 */
export interface GameConfig {
  /** Time limit per player in seconds (default: 30) */
  timePerPlayer: number;

  /** Time penalty in seconds when a player skips (default: 3) */
  skipPenaltySeconds: number;
}

/**
 * Overall game state including all contestants, configuration, and current duel.
 */
export interface GameState {
  /** All contestants in the game */
  contestants: Contestant[];

  /** Game configuration settings */
  config: GameConfig;

  /** Current active duel, or null if no duel is in progress */
  currentDuel: DuelState | null;
}

/**
 * Default game configuration values
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  timePerPlayer: 30,
  skipPenaltySeconds: 3,
};
