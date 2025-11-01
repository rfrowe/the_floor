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
   * Whether the skip answer animation is currently playing.
   * When true, the answer is displayed on the audience view for 3 seconds.
   */
  isSkipAnimationActive: boolean;
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
