/**
 * GridConfigurator component
 * Allows game master to configure grid dimensions and rearrange contestants
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGridConfig } from '@hooks/useGridConfig';
import type { Contestant } from '@types';
import { Button } from '@components/common/Button';
import { getContestantColor } from '@utils/colorUtils';
import { createLogger } from '@utils/logger';
import styles from './GridConfigurator.module.css';

const log = createLogger('GridConfigurator');

interface GridConfiguratorProps {
  contestants: Contestant[];
  onUpdateContestants: (contestants: Contestant[]) => Promise<void>;
  /** Optional: provide [gridConfig, setGridConfig] tuple for demo mode (bypasses useGridConfig hook) */
  gridConfigState?: [
    { rows: number; cols: number },
    (config: { rows: number; cols: number }) => void,
  ];
}

export function GridConfigurator({
  contestants,
  onUpdateContestants,
  gridConfigState,
}: GridConfiguratorProps) {
  const hookGridConfigState = useGridConfig();
  const [gridConfig, setGridConfig] = gridConfigState ?? hookGridConfigState;
  const [tempRows, setTempRows] = useState(gridConfig.rows);
  const [tempCols, setTempCols] = useState(gridConfig.cols);
  const [draggedContestant, setDraggedContestant] = useState<Contestant | null>(null);
  const [isEditingGrid, setIsEditingGrid] = useState(false);
  const [touchTarget, setTouchTarget] = useState<{ row: number; col: number } | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);

  // Sync temp dimensions when gridConfig changes externally (e.g., from demo controls)
  useEffect(() => {
    setTempRows(gridConfig.rows);
    setTempCols(gridConfig.cols);
  }, [gridConfig.rows, gridConfig.cols]);

  // Define handleDrop early so it can be used in useEffect
  const handleDrop = useCallback(
    async (row: number, col: number) => {
      if (!draggedContestant) return;

      const squareId = `${String(row)}-${String(col)}`;

      // Check if square is already occupied - silently ignore if it is
      const occupiedBy = contestants.find(
        (c) => c.controlledSquares?.includes(squareId) && c.id !== draggedContestant.id
      );

      if (occupiedBy) {
        setDraggedContestant(null);
        return;
      }

      // Update contestant position
      const updatedContestants = contestants.map((c) => {
        if (c.id === draggedContestant.id) {
          return {
            ...c,
            gridPosition: { row, col },
            controlledSquares: [squareId],
          };
        }
        return c;
      });

      await onUpdateContestants(updatedContestants);
      setDraggedContestant(null);
    },
    [draggedContestant, contestants, onUpdateContestants]
  );

  // Set up document-level touch event listeners (non-passive)
  useEffect(() => {
    if (!draggedContestant) return;

    log.debug('[Touch] Setting up document listeners');

    const handleDocumentTouchMove = (e: TouchEvent) => {
      log.debug('[Touch] Document move');
      e.preventDefault();

      const touch = e.touches[0];
      if (!touch) return;

      log.debug('[Touch] Move at:', { x: touch.clientX, y: touch.clientY });

      // Update touch position for visual feedback
      setTouchPosition({ x: touch.clientX, y: touch.clientY });

      // Find which grid square is under the touch
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      log.debug('[Touch] Element under finger:', element?.className);

      const square = element?.closest('[data-grid-square]');
      log.debug('[Touch] Closest square:', square ? 'found' : 'not found');

      if (square) {
        const row = parseInt(square.getAttribute('data-row') ?? '-1', 10);
        const col = parseInt(square.getAttribute('data-col') ?? '-1', 10);
        log.debug('[Touch] Target square:', { row, col });
        if (row >= 0 && col >= 0) {
          setTouchTarget({ row, col });
        }
      } else {
        setTouchTarget(null);
      }
    };

    const handleDocumentTouchEnd = () => {
      log.debug('[Touch] Document end', {
        draggedContestant: draggedContestant.name,
        touchTarget,
      });

      if (touchTarget) {
        log.debug('[Touch] Dropping at:', { row: touchTarget.row, col: touchTarget.col });
        void handleDrop(touchTarget.row, touchTarget.col);
      }

      log.debug('[Touch] Cleaning up');
      setDraggedContestant(null);
      setTouchTarget(null);
      setTouchPosition(null);
    };

    // Add non-passive listeners
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', handleDocumentTouchEnd);

    return () => {
      log.debug('[Touch] Removing document listeners');
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, [draggedContestant, touchTarget, handleDrop]);

  // Auto-collapse when all active contestants are positioned
  // Exclude eliminated contestants from positioning
  const unpositionedContestants = contestants.filter(
    (c) => (!c.controlledSquares || c.controlledSquares.length === 0) && !c.eliminated
  );
  const activeContestants = contestants.filter((c) => !c.eliminated);
  const allContestantsPositioned =
    activeContestants.length > 0 && unpositionedContestants.length === 0;

  const [isExpanded, setIsExpanded] = useState(!allContestantsPositioned);

  // Create grid state for drag-and-drop
  const gridState = useMemo(() => {
    const grid: (Contestant | null)[][] = Array.from({ length: gridConfig.rows }, () =>
      Array.from({ length: gridConfig.cols }, () => null)
    );

    // Place contestants in their positions
    contestants.forEach((contestant) => {
      if (contestant.controlledSquares) {
        contestant.controlledSquares.forEach((squareId) => {
          const [rowStr, colStr] = squareId.split('-');
          const row = parseInt(rowStr ?? '0', 10);
          const col = parseInt(colStr ?? '0', 10);
          if (row < gridConfig.rows && col < gridConfig.cols) {
            const gridRow = grid[row];
            if (gridRow) {
              gridRow[col] = contestant;
            }
          }
        });
      }
    });

    return grid;
  }, [contestants, gridConfig]);

  const handleApplyDimensions = () => {
    const totalSquares = tempRows * tempCols;
    const positionedContestants = contestants.filter(
      (c) => c.controlledSquares && c.controlledSquares.length > 0
    ).length;

    if (totalSquares < positionedContestants) {
      alert(
        `Grid too small! You have ${String(positionedContestants)} contestants positioned, but the new grid only has ${String(totalSquares)} squares. Please increase dimensions or remove some contestants first.`
      );
      return;
    }

    setGridConfig({ rows: tempRows, cols: tempCols });
    setIsEditingGrid(false);

    // Remove contestants that are now outside the grid
    const updatedContestants = contestants.map((c) => {
      if (!c.controlledSquares) return c;

      const validSquares = c.controlledSquares.filter((squareId) => {
        const [rowStr, colStr] = squareId.split('-');
        const row = parseInt(rowStr ?? '0', 10);
        const col = parseInt(colStr ?? '0', 10);
        return row < tempRows && col < tempCols;
      });

      if (validSquares.length > 0) {
        return {
          ...c,
          controlledSquares: validSquares,
        };
      }

      // Remove grid properties by creating new object without them
      const { controlledSquares: _, gridPosition: __, ...rest } = c;
      return rest;
    });

    void onUpdateContestants(updatedContestants);
  };

  const handleDragStart = (contestant: Contestant) => {
    setDraggedContestant(contestant);
  };

  const handleTouchStart = (contestant: Contestant, e: React.TouchEvent) => {
    if (!canRemoveFromGrid(contestant)) {
      log.debug('[Touch] Cannot drag - contestant has won territory');
      return;
    }
    log.debug('[Touch] Start dragging:', contestant.name);

    const touch = e.touches[0];
    if (touch) {
      setTouchPosition({ x: touch.clientX, y: touch.clientY });
    }

    setDraggedContestant(contestant);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveFromGrid = async (contestant: Contestant) => {
    // Prevent removing contestants who have won (expanded territory)
    if (contestant.controlledSquares && contestant.controlledSquares.length > 1) {
      return;
    }

    const updatedContestants = contestants.map((c) => {
      if (c.id === contestant.id) {
        // Remove grid properties by creating new object without them
        const { controlledSquares: _, gridPosition: __, ...rest } = c;
        return rest;
      }
      return c;
    });

    await onUpdateContestants(updatedContestants);
  };

  // Check if contestant can be removed (has not won any duels)
  const canRemoveFromGrid = (contestant: Contestant): boolean => {
    return !contestant.controlledSquares || contestant.controlledSquares.length <= 1;
  };

  // Calculate optimal grid dimensions for K contestants
  // Minimizes waste (N*M - K) first, then minimizes aspect difference |N - M|
  const calculateOptimalDimensions = (k: number): { rows: number; cols: number } => {
    if (k === 0) return { rows: 1, cols: 1 };

    // Iterate in order of increasing waste (0, 1, 2, ...)
    // For each waste level, find factorization with minimum |N - M|
    const maxWaste = Math.min(k, 20); // Reasonable upper bound

    for (let waste = 0; waste <= maxWaste; waste++) {
      const product = k + waste;
      const sqrtProduct = Math.floor(Math.sqrt(product));

      // Iterate from sqrt down to 1 to find most square-ish factorization
      // First exact divisor found will have minimum |N - M|
      for (let rows = sqrtProduct; rows >= 1; rows--) {
        if (product % rows === 0) {
          const cols = product / rows;
          // Return immediately - this is optimal for current waste level
          return { rows, cols };
        }
      }
    }

    // Fallback (should never reach here)
    return { rows: 1, cols: k };
  };

  // Place contestants in a random contiguous block
  const placeContestantsContiguously = (
    contestants: Contestant[],
    rows: number,
    cols: number
  ): Contestant[] => {
    const eligibleContestants = contestants.filter((c) => !c.eliminated);

    if (eligibleContestants.length === 0) return contestants;

    // Create list of all squares
    const allSquares: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        allSquares.push(`${String(r)}-${String(c)}`);
      }
    }

    // Shuffle squares randomly
    const shuffled = [...allSquares].sort(() => Math.random() - 0.5);

    // Take first K squares for contiguous block
    const selectedSquares = shuffled.slice(0, eligibleContestants.length);

    // Create mapping of contestant ID to square assignment
    const squareAssignments = new Map<string, string>();
    eligibleContestants.forEach((c, index) => {
      const square = selectedSquares[index];
      if (square) {
        squareAssignments.set(c.id, square);
      }
    });

    // Assign squares to contestants in a single pass
    return contestants.map((c) => {
      if (c.eliminated) return c;

      const square = squareAssignments.get(c.id);
      if (!square) {
        // Remove from grid
        const { controlledSquares: _, gridPosition: __, ...rest } = c;
        return rest;
      }

      const [rowStr, colStr] = square.split('-');
      const row = parseInt(rowStr ?? '0', 10);
      const col = parseInt(colStr ?? '0', 10);

      return {
        ...c,
        gridPosition: { row, col },
        controlledSquares: [square],
      };
    });
  };

  const handleAutoLayout = async () => {
    // Calculate optimal dimensions
    const eligibleCount = activeContestants.length;
    const { rows, cols } = calculateOptimalDimensions(eligibleCount);

    // Apply new dimensions
    setGridConfig({ rows, cols });
    setTempRows(rows);
    setTempCols(cols);

    // Place contestants
    const updatedContestants = placeContestantsContiguously(contestants, rows, cols);
    await onUpdateContestants(updatedContestants);
  };

  // Check if auto layout is enabled
  const canAutoLayout = useMemo(() => {
    // Need at least one eligible contestant
    if (activeContestants.length === 0) return false;

    // All positioned contestants must have exactly 1 square
    const positionedContestants = activeContestants.filter(
      (c) => c.controlledSquares && c.controlledSquares.length > 0
    );

    return positionedContestants.every((c) => c.controlledSquares?.length === 1);
  }, [activeContestants]);

  const containerClass = styles['container'] ?? '';
  const headerClass = styles['header'] ?? '';
  const toggleButtonClass = styles['toggle-button'] ?? '';
  const sectionClass = styles['section'] ?? '';
  const titleClass = styles['title'] ?? '';
  const dimensionsFormClass = styles['dimensions-form'] ?? '';
  const inputGroupClass = styles['input-group'] ?? '';
  const labelClass = styles['label'] ?? '';
  const inputClass = styles['input'] ?? '';
  const buttonGroupClass = styles['button-group'] ?? '';
  const gridViewClass = styles['grid-view'] ?? '';
  const gridClass = styles['grid'] ?? '';
  const squareClass = styles['square'] ?? '';
  const emptySquareClass = styles['empty-square'] ?? '';
  const contestantSquareClass = styles['contestant-square'] ?? '';
  const contestantNameClass = styles['contestant-name'] ?? '';
  const removeButtonClass = styles['remove-button'] ?? '';
  const unpositionedListClass = styles['unpositioned-list'] ?? '';
  const contestantItemClass = styles['contestant-item'] ?? '';

  return (
    <div className={containerClass}>
      {/* Collapsible Header */}
      <div className={headerClass}>
        <h2>Grid Configuration</h2>
        <button
          type="button"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
          className={toggleButtonClass}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Dimension Configuration */}
          <div className={sectionClass}>
            <h3 className={titleClass}>Grid Dimensions</h3>
            <div className={dimensionsFormClass}>
              <div className={inputGroupClass}>
                <label className={labelClass}>
                  Rows:
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tempRows}
                    onChange={(e) => {
                      setTempRows(parseInt(e.target.value, 10) || 1);
                    }}
                    className={inputClass}
                    disabled={!isEditingGrid}
                  />
                </label>
              </div>
              <div className={inputGroupClass}>
                <label className={labelClass}>
                  Columns:
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tempCols}
                    onChange={(e) => {
                      setTempCols(parseInt(e.target.value, 10) || 1);
                    }}
                    className={inputClass}
                    disabled={!isEditingGrid}
                  />
                </label>
              </div>
              <div className={buttonGroupClass}>
                {!isEditingGrid ? (
                  <>
                    <Button
                      onClick={() => {
                        setIsEditingGrid(true);
                      }}
                      variant="secondary"
                      size="small"
                    >
                      Edit Dimensions
                    </Button>
                    <Button
                      onClick={() => {
                        void handleAutoLayout();
                      }}
                      variant="secondary"
                      size="small"
                      disabled={!canAutoLayout}
                      title={
                        !canAutoLayout
                          ? 'Disabled: Remove expanded territories first'
                          : 'Automatically resize grid and place all contestants'
                      }
                    >
                      Auto Layout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleApplyDimensions} size="small">
                      Apply
                    </Button>
                    <Button
                      onClick={() => {
                        setTempRows(gridConfig.rows);
                        setTempCols(gridConfig.cols);
                        setIsEditingGrid(false);
                      }}
                      variant="secondary"
                      size="small"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
            <p>
              Current: {gridConfig.rows} rows × {gridConfig.cols} cols ={' '}
              {gridConfig.rows * gridConfig.cols} squares
            </p>
          </div>

          {/* Grid Preview with Drag & Drop */}
          <div className={sectionClass}>
            <h3 className={titleClass}>Contestant Positions (Drag & Drop)</h3>
            <div className={gridViewClass}>
              <div
                className={gridClass}
                style={{
                  gridTemplateRows: `repeat(${String(gridConfig.rows)}, 1fr)`,
                  gridTemplateColumns: `repeat(${String(gridConfig.cols)}, 1fr)`,
                }}
              >
                {gridState.map((row, rowIndex) =>
                  row.map((contestant, colIndex) => (
                    <div
                      key={`${String(rowIndex)}-${String(colIndex)}`}
                      className={`${squareClass} ${contestant ? contestantSquareClass : emptySquareClass} ${
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        touchTarget?.row === rowIndex && touchTarget?.col === colIndex
                          ? (styles['touch-target'] ?? '')
                          : ''
                      }`.trim()}
                      style={{
                        backgroundColor: contestant ? getContestantColor(contestant.id) : undefined,
                      }}
                      data-grid-square="true"
                      data-row={rowIndex}
                      data-col={colIndex}
                      onDragOver={handleDragOver}
                      onDrop={() => {
                        void handleDrop(rowIndex, colIndex);
                      }}
                    >
                      {contestant && (
                        <div
                          draggable={canRemoveFromGrid(contestant)}
                          onDragStart={() => {
                            if (canRemoveFromGrid(contestant)) {
                              handleDragStart(contestant);
                            }
                          }}
                          onTouchStart={(e) => {
                            handleTouchStart(contestant, e);
                          }}
                          className={`${contestantNameClass} ${
                            draggedContestant?.id === contestant.id
                              ? (styles['dragging'] ?? '')
                              : ''
                          }`.trim()}
                          style={{
                            cursor: canRemoveFromGrid(contestant) ? 'grab' : 'default',
                          }}
                        >
                          {contestant.name}
                          <button
                            onClick={() => {
                              void handleRemoveFromGrid(contestant);
                            }}
                            className={`${removeButtonClass} ${
                              !canRemoveFromGrid(contestant)
                                ? (styles['remove-button-disabled'] ?? '')
                                : ''
                            }`.trim()}
                            title={
                              canRemoveFromGrid(contestant)
                                ? 'Remove from grid'
                                : 'Cannot remove - contestant has won territory'
                            }
                            disabled={!canRemoveFromGrid(contestant)}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Unpositioned Contestants */}
          {unpositionedContestants.length > 0 && (
            <div className={sectionClass}>
              <h3 className={titleClass}>Unpositioned Contestants</h3>
              <p>Drag these contestants onto the grid to position them:</p>
              <div className={unpositionedListClass}>
                {unpositionedContestants.map((contestant) => (
                  <div
                    key={contestant.id}
                    className={`${contestantItemClass} ${
                      draggedContestant?.id === contestant.id ? (styles['dragging'] ?? '') : ''
                    }`.trim()}
                    draggable
                    onDragStart={() => {
                      handleDragStart(contestant);
                    }}
                    onTouchStart={(e) => {
                      handleTouchStart(contestant, e);
                    }}
                    style={{
                      backgroundColor: getContestantColor(contestant.id),
                      color: 'white',
                      cursor: 'grab',
                    }}
                  >
                    {contestant.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating touch drag preview */}
      {draggedContestant && touchPosition && (
        <div
          style={{
            position: 'fixed',
            left: touchPosition.x,
            top: touchPosition.y,
            transform: 'translate(-50%, -50%)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            backgroundColor: getContestantColor(draggedContestant.id),
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.8,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            textShadow:
              '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6), 1px 1px 2px rgba(0, 0, 0, 0.9), -1px -1px 2px rgba(0, 0, 0, 0.9)',
          }}
        >
          {draggedContestant.name}
        </div>
      )}
    </div>
  );
}
