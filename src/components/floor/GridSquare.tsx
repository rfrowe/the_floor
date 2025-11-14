/**
 * GridSquare component - represents a single square on the floor grid
 */

import { memo } from 'react';
import type { Contestant } from '@types';
import { getContestantColor } from '@utils/colorUtils';
import { getNameDisplayInfo } from '@utils/gridUtils';
import styles from './GridSquare.module.css';

interface GridSquareProps {
  squareId: string;
  owner?: Contestant;
  row: number;
  col: number;
  isSelected?: boolean; // Highlight if this contestant is selected for duel
  perimeterBorders?: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

/**
 * A single square on the floor grid.
 * Displays the contestant's color and optionally their name.
 * Can highlight selected contestants with a visual indicator.
 * Memoized to prevent unnecessary re-renders.
 */
export const GridSquare = memo(
  function GridSquare({
    squareId,
    owner,
    row,
    col,
    isSelected = false,
    perimeterBorders,
  }: GridSquareProps) {
    const backgroundColor = getContestantColor(owner?.id);
    const nameInfo = owner ? getNameDisplayInfo(owner, row, col) : { shouldDisplay: false };

    const squareClass = styles['grid-square'] ?? '';
    const selectedClass = isSelected ? (styles['selected'] ?? '') : '';
    const labelClass = styles['square-label'] ?? '';

    // Build border style for perimeter highlighting
    // Use box-shadow instead of border to avoid double-borders on shared edges
    const shadows: string[] = [];
    if (perimeterBorders) {
      const borderWidth = '3px';
      const borderColor = 'rgba(255, 255, 255, 1)';

      // Create box-shadow for each perimeter edge
      if (perimeterBorders.top) shadows.push(`inset 0 ${borderWidth} 0 0 ${borderColor}`);
      if (perimeterBorders.right) shadows.push(`inset -${borderWidth} 0 0 0 ${borderColor}`);
      if (perimeterBorders.bottom) shadows.push(`inset 0 -${borderWidth} 0 0 ${borderColor}`);
      if (perimeterBorders.left) shadows.push(`inset ${borderWidth} 0 0 0 ${borderColor}`);
    }

    const borderStyle: React.CSSProperties = {};
    if (shadows.length > 0) {
      borderStyle.boxShadow = shadows.join(', ');
    } else if (!owner) {
      // Add subtle border to empty squares to show grid structure
      borderStyle.border = '1px solid rgba(255, 255, 255, 0.2)';
    }

    return (
      <div
        className={`${squareClass} ${selectedClass}`.trim()}
        style={{ backgroundColor, ...borderStyle }}
        data-owner={owner?.id}
        data-square-id={squareId}
        role="gridcell"
        aria-label={`Square ${String(row)}-${String(col)} owned by ${owner?.name ?? 'empty'}${isSelected ? ' - selected for duel' : ''}`}
      >
        {/* Show sword icon, name, and category on centroid square only */}
        {nameInfo.shouldDisplay && nameInfo.offset && owner && (
          <div
            className={labelClass}
            style={{
              position: 'absolute',
              // Center of square is 50%, add offset to get centroid position
              // Offset range is -0.5 to 0.5, so multiply by 100 to get percentage
              left: `${(50 + nameInfo.offset.x * 100).toFixed(2)}%`,
              top: `${(50 + nameInfo.offset.y * 100).toFixed(2)}%`,
              // Center the text element on that point
              transform: 'translate(-50%, -50%)',
            }}
          >
            {isSelected && <span className={styles['duel-icon'] ?? ''}>⚔️</span>}
            <span>{owner.name}</span>
            <span style={{ fontSize: '0.8em', opacity: 0.9 }}>{owner.category.name}</span>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Re-render if owner, selection status, position, or perimeter borders change
    // Also check controlledSquares length - when territory merges, this changes
    // and affects centroid calculations for ALL squares owned by that contestant
    return (
      prevProps.row === nextProps.row &&
      prevProps.col === nextProps.col &&
      prevProps.owner?.id === nextProps.owner?.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.perimeterBorders?.top === nextProps.perimeterBorders?.top &&
      prevProps.perimeterBorders?.right === nextProps.perimeterBorders?.right &&
      prevProps.perimeterBorders?.bottom === nextProps.perimeterBorders?.bottom &&
      prevProps.perimeterBorders?.left === nextProps.perimeterBorders?.left &&
      prevProps.owner?.controlledSquares?.length === nextProps.owner?.controlledSquares?.length
    );
  }
);
