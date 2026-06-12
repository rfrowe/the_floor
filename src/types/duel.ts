/**
 * Duel state type definitions
 * Based on SPEC.md section 4.5
 */

import type { Contestant, Category } from './contestant';

/**
 * Represents the current state of an active duel between two contestants.
 */
export interface DuelState {
  /** First contestant in the duel */
  contestant1: Contestant;

  /** Second contestant in the duel */
  contestant2: Contestant;

  /** Which player currently has control (1 or 2) */
  activePlayer: 1 | 2;

  /** Time remaining for contestant 1 (in seconds) */
  timeRemaining1: number;

  /** Time remaining for contestant 2 (in seconds) */
  timeRemaining2: number;

  /** Index of the current slide being displayed */
  currentSlideIndex: number;

  /** The category whose slides are being used in this duel */
  selectedCategory: Category;

  /**
   * ID of the selected category in the categories store.
   * Used to rehydrate the full category (slides) from IndexedDB, including
   * cross-window into the Audience View. Always set when a duel starts.
   */
  selectedCategoryId: string;

  /**
   * Whether the skip answer animation is currently playing.
   * When true, the answer is displayed on the audience view for 3 seconds.
   */
  isSkipAnimationActive: boolean;

  /**
   * Whether this is a "quick duel" (exhibition match).
   * Quick duels only increment the winner's win count — no territory transfer,
   * no elimination, and no category-ownership change. Defaults to false/undefined
   * for normal duels.
   */
  isQuickDuel?: boolean;
}

/**
 * Helper type for the result of a completed duel
 */
export interface DuelResult {
  /** The contestant who won the duel */
  winner: Contestant;

  /** The contestant who lost the duel */
  loser: Contestant;

  /** The category that the winner inherits from the loser */
  inheritedCategory: Category;
}

/**
 * Helper type for creating a new duel
 */
export type DuelInput = Pick<DuelState, 'contestant1' | 'contestant2' | 'selectedCategory'>;

/**
 * Lightweight reference to a duel state for localStorage storage.
 * Stores only IDs instead of full contestant/category objects to avoid quota issues.
 * Full objects are rehydrated from IndexedDB when reading.
 */
export interface DuelStateReference {
  /** ID of first contestant (to look up in IndexedDB) */
  contestant1Id: string;

  /** ID of second contestant (to look up in IndexedDB) */
  contestant2Id: string;

  /** ID of the category being used in this duel (looked up in the categories store) */
  selectedCategoryId: string;

  /** Which player currently has control (1 or 2) */
  activePlayer: 1 | 2;

  /** Time remaining for contestant 1 (in seconds) */
  timeRemaining1: number;

  /** Time remaining for contestant 2 (in seconds) */
  timeRemaining2: number;

  /** Index of the current slide being displayed */
  currentSlideIndex: number;

  /** Whether the skip answer animation is currently playing */
  isSkipAnimationActive: boolean;

  /** Whether this is a "quick duel" (exhibition match) — see DuelState.isQuickDuel */
  isQuickDuel?: boolean;
}
