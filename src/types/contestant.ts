/**
 * Contestant and Category type definitions
 * Based on SPEC.md section 4.1 and 4.2
 */

import type { Slide } from './slide';

/**
 * Represents a category (topic) with a collection of slides for gameplay.
 */
export interface Category {
  name: string;
  slides: Slide[];
}

/**
 * Represents a game show contestant who owns one category.
 * When a contestant wins a duel, they inherit the loser's category
 * (not the one that was played in the duel).
 */
export interface Contestant {
  /** Full name of the contestant (used as unique identifier) */
  name: string;

  /** The category currently owned by this contestant */
  category: Category;

  /** Number of duels won by this contestant */
  wins: number;

  /** Whether this contestant has been eliminated from the game */
  eliminated: boolean;
}

/**
 * Helper type for creating a new contestant
 */
export type ContestantInput = Omit<Contestant, 'wins' | 'eliminated'>;

/**
 * Helper type for partial contestant updates
 */
export type ContestantUpdate = Partial<Omit<Contestant, 'name'>>;
