/**
 * GridInitializer component - Initializes contestant positions on the grid
 */

import { useState } from 'react';
import type { Contestant } from '@types';
import { initializeContestantPositions } from '@utils/gridUtils';
import { Button } from '@components/common/Button';
import styles from './GridInitializer.module.css';

interface GridInitializerProps {
  contestants: Contestant[];
  onUpdate: (contestants: Contestant[]) => Promise<void>;
}

/**
 * Component for initializing grid positions for contestants.
 * Provides an "Auto-Position" button to automatically assign grid positions.
 */
export function GridInitializer({ contestants, onUpdate }: GridInitializerProps) {
  const [isPositioning, setIsPositioning] = useState(false);

  const handleAutoPosition = async () => {
    setIsPositioning(true);
    try {
      const positioned = initializeContestantPositions(contestants);
      await onUpdate(positioned);
    } catch (error) {
      console.error('Failed to position contestants:', error);
      alert(
        `Failed to position contestants: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsPositioning(false);
    }
  };

  const positionedCount = contestants.filter(
    (c) => c.controlledSquares && c.controlledSquares.length > 0
  ).length;

  const allPositioned = positionedCount === contestants.length && contestants.length > 0;

  const containerClass = styles['grid-initializer'] ?? '';
  const headerClass = styles['header'] ?? '';
  const statusClass = styles['status'] ?? '';
  const statusGoodClass = styles['status-good'] ?? '';
  const statusWarningClass = styles['status-warning'] ?? '';

  const statusClassFinal = allPositioned ? statusGoodClass : statusWarningClass;

  return (
    <div className={containerClass}>
      <h3 className={headerClass}>Grid Positioning</h3>
      <div className={`${statusClass} ${statusClassFinal}`.trim()}>
        <strong>Status:</strong> {positionedCount} / {contestants.length} positioned
        {allPositioned && ' ✓'}
      </div>
      <p>
        {allPositioned
          ? 'All contestants are positioned on the grid. The Audience View will show the floor grid when no duel is active.'
          : 'Click Auto-Position to assign grid positions to all contestants. This enables the grid view on the Audience display.'}
      </p>
      <Button
        variant="secondary"
        onClick={() => {
          void handleAutoPosition();
        }}
        disabled={isPositioning || contestants.length === 0}
      >
        {isPositioning ? 'Positioning...' : 'Auto-Position Contestants'}
      </Button>
    </div>
  );
}
