/**
 * Main export point for all type definitions
 * Import types using: import { Contestant, Slide, ... } from '@types'
 */

// Contestant and Category types
export type { Contestant, Category, ContestantInput, ContestantUpdate } from './contestant';

// Slide and CensorBox types
export type { Slide, CensorBox } from './slide';

// Duel types
export type { DuelState, DuelResult, DuelInput } from './duel';

// Game configuration and state types
export type { GameConfig, GameState } from './game';
export { DEFAULT_GAME_CONFIG } from './game';
