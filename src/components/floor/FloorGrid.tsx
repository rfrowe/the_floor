/**
 * FloorGrid component - displays the game floor as a grid of contestant territories
 */

import type { Contestant } from '@types';
import { useGridConfig } from '@hooks/useGridConfig';
import { GridSquare } from './GridSquare';
import styles from './FloorGrid.module.css';

interface FloorGridProps {
  contestants: Contestant[];
  selectedContestantIds?: string[]; // IDs of contestants selected for duel
}

/**
 * Displays the game floor as a grid showing contestant territories.
 * Each contestant controls one or more squares, which are visually distinct.
 * Replaces the waiting view on the Audience display when no duel is active.
 * Optionally highlights selected contestants (for duel preview).
 */
export function FloorGrid({ contestants, selectedContestantIds = [] }: FloorGridProps) {
  const [gridConfig] = useGridConfig();
  const { rows, cols } = gridConfig;

  // Calculate aspect ratio dynamically based on grid dimensions
  const aspectRatio = cols / rows;

  // Create map of square ID to contestant owner
  // Recalculated on every render to ensure borders update after territory changes
  const squareOwnership = new Map<string, Contestant>();
  contestants.forEach((contestant) => {
    contestant.controlledSquares?.forEach((squareId) => {
      squareOwnership.set(squareId, contestant);
    });
  });

  const containerClass = styles['container'] ?? '';
  const floorGridClass = styles['floor-grid'] ?? '';
  const gridRowClass = styles['grid-row'] ?? '';

  return (
    <div className={containerClass}>
      <div
        className={floorGridClass}
        role="grid"
        aria-label="The Floor game board"
        style={{
          maxWidth: `calc(100vh * ${String(aspectRatio)})`,
          maxHeight: `calc(100vw / ${String(aspectRatio)})`,
        }}
      >
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className={gridRowClass} role="row">
            {Array.from({ length: cols }).map((_, col) => {
              const squareId = `${String(row)}-${String(col)}`;
              const owner = squareOwnership.get(squareId);
              const isSelected = owner ? selectedContestantIds.includes(owner.id) : false;

              // Calculate which borders are on the perimeter
              let perimeterBorders = { top: false, right: false, bottom: false, left: false };
              if (owner) {
                const checkAdjacent = (r: number, c: number): boolean => {
                  // Check if position is out of bounds first
                  if (r < 0 || r >= rows || c < 0 || c >= cols) {
                    return true; // Edge of grid is perimeter
                  }
                  const adjId = `${String(r)}-${String(c)}`;
                  const adjOwner = squareOwnership.get(adjId);
                  // True if different owner or empty (undefined)
                  return adjOwner?.id !== owner.id;
                };

                perimeterBorders = {
                  top: checkAdjacent(row - 1, col),
                  right: checkAdjacent(row, col + 1),
                  bottom: checkAdjacent(row + 1, col),
                  left: checkAdjacent(row, col - 1),
                };
              }

              return owner ? (
                <GridSquare
                  key={squareId}
                  squareId={squareId}
                  owner={owner}
                  row={row}
                  col={col}
                  isSelected={isSelected}
                  perimeterBorders={perimeterBorders}
                />
              ) : (
                <GridSquare key={squareId} squareId={squareId} row={row} col={col} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
