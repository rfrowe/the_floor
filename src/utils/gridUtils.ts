/**
 * Utility functions for grid operations
 */

import type { Contestant } from '@types';
import { GRID_CONFIG } from '@/config/gridConfig';
import { createLogger } from '@/utils/logger';

const log = createLogger('GridUtils');

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
 * Gets information about where to display a contestant's name
 * Returns whether to display in the given square and the offset from center
 */
export function getNameDisplayInfo(
  owner: Contestant,
  row: number,
  col: number
): { shouldDisplay: boolean; offset?: { x: number; y: number } } {
  if (!owner.controlledSquares || owner.controlledSquares.length === 0) {
    return { shouldDisplay: false };
  }

  if (owner.controlledSquares.length === 1) {
    const squareId = owner.controlledSquares[0];
    if (!squareId) return { shouldDisplay: false };
    const pos = parseSquareId(squareId);
    if (pos.row === row && pos.col === col) {
      return { shouldDisplay: true, offset: { x: 0, y: 0 } }; // Centered in single square
    }
    return { shouldDisplay: false };
  }

  // Calculate centroid of controlled squares
  // Centroid = average of the CENTER of each square (not the square index)
  // Square (row, col) has center at (row + 0.5, col + 0.5)
  const positions = owner.controlledSquares.map(parseSquareId);
  const centroidRow = positions.reduce((sum, p) => sum + p.row + 0.5, 0) / positions.length;
  const centroidCol = positions.reduce((sum, p) => sum + p.col + 0.5, 0) / positions.length;

  // Determine which square contains the centroid
  const centroidSquareRow = Math.floor(centroidRow);
  const centroidSquareCol = Math.floor(centroidCol);

  // Check if the centroid square is actually owned by this contestant
  const centroidSquareId = `${String(centroidSquareRow)}-${String(centroidSquareCol)}`;
  const centroidInTerritory = owner.controlledSquares.includes(centroidSquareId);

  // If centroid is in territory, use it; otherwise fall back to closest square
  let displayRow: number;
  let displayCol: number;
  let offsetX: number;
  let offsetY: number;

  if (centroidInTerritory) {
    displayRow = centroidSquareRow;
    displayCol = centroidSquareCol;
    // Calculate offset within the square (0 to 1, where 0.5 is center)
    offsetX = centroidCol - centroidSquareCol - 0.5;
    offsetY = centroidRow - centroidSquareRow - 0.5;
  } else {
    // Fall back to closest square to centroid
    const firstPos = positions[0];
    if (!firstPos) {
      return { shouldDisplay: false, offset: { x: 0, y: 0 } };
    }
    let closestSquare = firstPos;
    let minDistance = Infinity;

    for (const pos of positions) {
      const distance = Math.sqrt(
        Math.pow(pos.row - centroidRow, 2) + Math.pow(pos.col - centroidCol, 2)
      );

      if (
        distance < minDistance ||
        (Math.abs(distance - minDistance) < 0.01 &&
          (pos.row < closestSquare.row ||
            (pos.row === closestSquare.row && pos.col < closestSquare.col)))
      ) {
        minDistance = distance;
        closestSquare = pos;
      }
    }

    displayRow = closestSquare.row;
    displayCol = closestSquare.col;
    offsetX = 0;
    offsetY = 0;
  }

  // Return info for this square
  if (row === displayRow && col === displayCol) {
    return {
      shouldDisplay: true,
      offset: { x: offsetX, y: offsetY },
    };
  }

  return { shouldDisplay: false };
}

/**
 * Determines if a contestant's name should be displayed on a specific square
 * For single-square territories, always show. For multi-square territories,
 * show only in the square containing (or closest to) the centroid.
 * @deprecated Use getNameDisplayInfo for more precise positioning
 */
export function shouldDisplayName(owner: Contestant, row: number, col: number): boolean {
  return getNameDisplayInfo(owner, row, col).shouldDisplay;
}

/**
 * Checks if a territory (set of squares) is contiguous.
 * A territory is contiguous if you can reach any square from any other square
 * by moving through adjacent (non-diagonal) squares within the territory.
 */
export function isTerritoryContiguous(squares: string[]): boolean {
  if (squares.length <= 1) return true;

  // Build adjacency map
  const squareSet = new Set(squares);
  const visited = new Set<string>();
  const firstSquare = squares[0];
  if (!firstSquare) return true; // Empty territory is technically contiguous

  const queue: string[] = [firstSquare];
  visited.add(firstSquare);

  // BFS to find all reachable squares
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const { row, col } = parseSquareId(current);

    // Check all 4 adjacent squares
    const adjacent = [
      `${String(row - 1)}-${String(col)}`, // Up
      `${String(row + 1)}-${String(col)}`, // Down
      `${String(row)}-${String(col - 1)}`, // Left
      `${String(row)}-${String(col + 1)}`, // Right
    ];

    for (const adjSquare of adjacent) {
      if (squareSet.has(adjSquare) && !visited.has(adjSquare)) {
        visited.add(adjSquare);
        queue.push(adjSquare);
      }
    }
  }

  // Territory is contiguous if we visited all squares
  return visited.size === squares.length;
}

/**
 * Validates all contestants have contiguous territories.
 * Logs errors for any non-contiguous territories found.
 * Returns true if all territories are valid, false otherwise.
 */
export function validateTerritoryContiguity(contestants: Contestant[]): boolean {
  let allValid = true;

  for (const contestant of contestants) {
    if (!contestant.controlledSquares || contestant.controlledSquares.length === 0) {
      continue; // Skip contestants with no territory
    }

    if (!isTerritoryContiguous(contestant.controlledSquares)) {
      log.error(
        `❌ Territory Validation Error: Contestant "${contestant.name}" (ID: ${contestant.id}) has NON-CONTIGUOUS territory!`,
        {
          contestant: contestant.name,
          id: contestant.id,
          squares: contestant.controlledSquares,
          squareCount: contestant.controlledSquares.length,
        }
      );
      allValid = false;
    }
  }

  if (allValid) {
    log.debug(
      `✅ Territory Validation: All ${String(contestants.length)} contestant territories are contiguous`
    );
  }

  return allValid;
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
