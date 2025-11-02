/**
 * Configuration for the grid view floor display
 * Defines the dimensions of the game floor grid
 */

import { loadGridConfig } from '@/storage/gridConfig';

// Export a function to get the current grid config
export function getGridConfig() {
  const config = loadGridConfig();
  return {
    rows: config.rows,
    cols: config.cols,
    totalSquares: config.rows * config.cols,
  };
}

// For backwards compatibility and tests, export the default config
export const GRID_CONFIG = {
  rows: 5,
  cols: 9,
  totalSquares: 45,
} as const;
