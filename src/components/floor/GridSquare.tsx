/**
 * GridSquare component - represents a single square on the floor grid
 */

import { memo } from 'react';
import type { Contestant } from '@types';
import { getContestantColor } from '@utils/colorUtils';
import { shouldDisplayName } from '@utils/gridUtils';
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
    const displayName = owner && shouldDisplayName(owner, row, col);

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
        {/* Show sword icon and name together on centroid square only */}
        {displayName && (
          <div className={labelClass}>
            {isSelected && <span className={styles['duel-icon'] ?? ''}>⚔️</span>}
            {owner.name}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Re-render if owner or selection status changes
    return (
      prevProps.owner?.id === nextProps.owner?.id && prevProps.isSelected === nextProps.isSelected
    );
  }
);
