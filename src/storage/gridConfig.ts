/**
 * Grid configuration storage
 * Stores the game floor grid dimensions in localStorage
 */

import { createLogger } from '@/utils/logger';

const GRID_CONFIG_KEY = 'the_floor_grid_config';
const log = createLogger('GridConfig');

export interface GridConfig {
  rows: number;
  cols: number;
}

const DEFAULT_GRID_CONFIG: GridConfig = {
  rows: 5,
  cols: 9,
};

/**
 * Load grid configuration from localStorage
 */
export function loadGridConfig(): GridConfig {
  try {
    const stored = localStorage.getItem(GRID_CONFIG_KEY);
    if (!stored) {
      return DEFAULT_GRID_CONFIG;
    }

    const parsed = JSON.parse(stored) as GridConfig;

    // Validate
    if (
      typeof parsed.rows === 'number' &&
      typeof parsed.cols === 'number' &&
      parsed.rows > 0 &&
      parsed.cols > 0 &&
      parsed.rows <= 20 &&
      parsed.cols <= 20
    ) {
      return parsed;
    }

    return DEFAULT_GRID_CONFIG;
  } catch {
    return DEFAULT_GRID_CONFIG;
  }
}

/**
 * Save grid configuration to localStorage
 */
export function saveGridConfig(config: GridConfig): void {
  try {
    localStorage.setItem(GRID_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    log.error('Failed to save grid config:', error);
  }
}

/**
 * Get total number of squares for a grid configuration
 */
export function getTotalSquares(config: GridConfig): number {
  return config.rows * config.cols;
}
