/**
 * Utility functions for grid operations
 */

import type { Contestant } from '@types';
import { GRID_CONFIG } from '@/config/gridConfig';

/**
 * Parses a square ID string (e.g., "2-5") into row and col numbers
 */
export function parseSquareId(squareId: string): { row: number; col: number } {
  const parts = squareId.split('-');
  const row = parseInt(parts[0] ?? '0', 10);
  const col = parseInt(parts[1] ?? '0', 10);
  return { row, col };
}

/**
 * Gets adjacent square IDs for a given position (up, down, left, right)
 */
export function getAdjacentSquares(
  position: { row: number; col: number },
  gridConfig: { rows: number; cols: number } = GRID_CONFIG
): string[] {
  const { row, col } = position;
  const { rows, cols } = gridConfig;
  const adjacent: string[] = [];

  // Four directions: up, down, left, right
  const directions = [
    { row: row - 1, col }, // Up
    { row: row + 1, col }, // Down
    { row, col: col - 1 }, // Left
    { row, col: col + 1 }, // Right
  ];

  directions.forEach(({ row: r, col: c }) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      adjacent.push(`${String(r)}-${String(c)}`);
    }
  });

  return adjacent;
}

/**
 * Checks if two squares are adjacent to each other
 */
export function areAdjacent(
  pos1: { row: number; col: number },
  pos2: { row: number; col: number }
): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);

  // Adjacent means exactly one square away in one direction (not diagonal)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Initializes contestant positions automatically in sequential order
 * Assigns each contestant a starting position and one square
 */
export function initializeContestantPositions(
  contestants: Contestant[],
  gridConfig: { rows: number; cols: number } = GRID_CONFIG
): Contestant[] {
  const { cols } = gridConfig;
  let squareIndex = 0;

  return contestants.map((contestant) => {
    const row = Math.floor(squareIndex / cols);
    const col = squareIndex % cols;
    squareIndex++;

    return {
      ...contestant,
      gridPosition: { row, col },
      controlledSquares: [`${String(row)}-${String(col)}`], // Initial: one square
    };
  });
}

/**
 * Determines if a contestant's name should be displayed on a specific square
 * For single-square territories, always show. For multi-square territories,
 * show only in the square closest to the centroid.
 */
export function shouldDisplayName(owner: Contestant, row: number, col: number): boolean {
  if (!owner.controlledSquares || owner.controlledSquares.length === 0) {
    return false;
  }

  if (owner.controlledSquares.length === 1) {
    return true; // Always show for single square
  }

  // Calculate centroid of controlled squares
  const positions = owner.controlledSquares.map(parseSquareId);
  const centroidRow = positions.reduce((sum, p) => sum + p.row, 0) / positions.length;
  const centroidCol = positions.reduce((sum, p) => sum + p.col, 0) / positions.length;

  // Calculate distance from current square to centroid
  const distance = Math.sqrt(Math.pow(row - centroidRow, 2) + Math.pow(col - centroidCol, 2));

  // Find minimum distance to centroid among all squares
  const minDistance = Math.min(
    ...positions.map((p) =>
      Math.sqrt(Math.pow(p.row - centroidRow, 2) + Math.pow(p.col - centroidCol, 2))
    )
  );

  // Show name only in the square(s) closest to centroid
  return Math.abs(distance - minDistance) < 0.01; // Use small epsilon for floating point comparison
}

/**
 * Find all contestants that share at least one edge with the given contestant's territory.
 * Diagonal adjacency does not count - must share at least one full edge.
 *
 * This is used for enforcing the game rule that P2 must be adjacent to P1.
 */
export function getAdjacentContestants(
  contestant: Contestant,
  allContestants: Contestant[],
  gridConfig: { rows: number; cols: number } = GRID_CONFIG
): Contestant[] {
  if (!contestant.controlledSquares || contestant.controlledSquares.length === 0) {
    return [];
  }

  const adjacentContestantIds = new Set<string>();

  // For each square controlled by the contestant
  for (const squareId of contestant.controlledSquares) {
    const position = parseSquareId(squareId);
    const adjacentSquares = getAdjacentSquares(position, gridConfig);

    // Check each adjacent square
    for (const adjacentSquareId of adjacentSquares) {
      // Find which contestant owns this adjacent square
      for (const other of allContestants) {
        if (other.id === contestant.id) continue; // Skip self
        if (!other.controlledSquares) continue;

        if (other.controlledSquares.includes(adjacentSquareId)) {
          adjacentContestantIds.add(other.id);
        }
      }
    }
  }

  // Return the actual contestant objects
  return allContestants.filter((c) => adjacentContestantIds.has(c.id));
}
