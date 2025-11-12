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
 * Represents a category as stored in IndexedDB with metadata.
 * Categories are stored separately and referenced by contestants.
 */
export interface StoredCategory extends Category {
  /** Unique identifier for IndexedDB storage */
  id: string;

  /** Timestamp when category was created */
  createdAt: string;

  /** Data URL of first slide for thumbnail display */
  thumbnailUrl: string;

  /** Approximate size in bytes (calculated from JSON stringification) */
  sizeInBytes?: number;
}

/**
 * Lightweight reference to a category for display in lists/dropdowns.
 * Used to show category options without loading full slide data.
 */
export interface CategoryReference {
  id: string;
  name: string;
  slideCount: number;
  thumbnailUrl: string;
  createdAt: string;
  sizeInBytes?: number;
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

  /** Optional reference to a stored category ID for category manager feature */
  categoryId?: string;

  /** Number of duels won by this contestant */
  wins: number;

  /** Whether this contestant has been eliminated from the game */
  eliminated: boolean;

  /** Starting position on the grid (for grid view floor display) */
  gridPosition?: { row: number; col: number };

  /** Array of square IDs controlled by this contestant (for grid view floor display) */
  controlledSquares?: string[];
}

/**
 * Helper type for creating a new contestant
 */
export type ContestantInput = Omit<Contestant, 'id' | 'wins' | 'eliminated'>;

/**
 * Helper type for partial contestant updates
 */
export type ContestantUpdate = Partial<Omit<Contestant, 'id' | 'name'>>;
