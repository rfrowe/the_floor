/**
 * Contestant and Category type definitions
 * Based on SPEC.md section 4.1 and 4.2
 *
 * IMPORTANT: Keep in sync with Python types in scripts/parse_pptx.py
 */

import type { Slide } from './slide';

/**
 * Represents a category (topic) with a collection of slides for gameplay.
 *
 * SYNC WITH: scripts/parse_pptx.py - Category dataclass
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
  /** Unique identifier for IndexedDB storage */
  id: string;

  /** Full name of the contestant */
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
export type ContestantInput = Omit<Contestant, 'id' | 'wins' | 'eliminated'>;

/**
 * Helper type for partial contestant updates
 */
export type ContestantUpdate = Partial<Omit<Contestant, 'id' | 'name'>>;
