/**
 * GridConfigurator component
 * Allows game master to configure grid dimensions and rearrange contestants
 */

import { useState, useMemo } from 'react';
import { useGridConfig } from '@hooks/useGridConfig';
import type { Contestant } from '@types';
import { Button } from '@components/common/Button';
import { getContestantColor } from '@utils/colorUtils';
import styles from './GridConfigurator.module.css';

interface GridConfiguratorProps {
  contestants: Contestant[];
  onUpdateContestants: (contestants: Contestant[]) => Promise<void>;
}

export function GridConfigurator({ contestants, onUpdateContestants }: GridConfiguratorProps) {
  const [gridConfig, setGridConfig] = useGridConfig();
  const [tempRows, setTempRows] = useState(gridConfig.rows);
  const [tempCols, setTempCols] = useState(gridConfig.cols);
  const [draggedContestant, setDraggedContestant] = useState<Contestant | null>(null);
  const [isEditingGrid, setIsEditingGrid] = useState(false);

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
    // Validate
    if (tempRows < 1 || tempRows > 20 || tempCols < 1 || tempCols > 20) {
      alert('Grid dimensions must be between 1 and 20');
      return;
    }

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
    alert('Grid dimensions updated! Contestants outside the new grid have been removed.');

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (row: number, col: number) => {
    if (!draggedContestant) return;

    const squareId = `${String(row)}-${String(col)}`;

    // Check if square is already occupied
    const occupiedBy = contestants.find(
      (c) => c.controlledSquares?.includes(squareId) && c.id !== draggedContestant.id
    );

    if (occupiedBy) {
      alert(`Square is occupied by ${occupiedBy.name}. Please choose an empty square.`);
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
  };

  const handleRemoveFromGrid = async (contestant: Contestant) => {
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
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
          className={toggleButtonClass}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
        </Button>
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
                  <Button
                    onClick={() => {
                      setIsEditingGrid(true);
                    }}
                    variant="secondary"
                    size="small"
                  >
                    Edit Dimensions
                  </Button>
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
                      className={`${squareClass} ${contestant ? contestantSquareClass : emptySquareClass}`.trim()}
                      style={{
                        backgroundColor: contestant ? getContestantColor(contestant.id) : undefined,
                      }}
                      onDragOver={handleDragOver}
                      onDrop={() => {
                        void handleDrop(rowIndex, colIndex);
                      }}
                    >
                      {contestant && (
                        <div
                          draggable
                          onDragStart={() => {
                            handleDragStart(contestant);
                          }}
                          className={contestantNameClass}
                        >
                          {contestant.name}
                          <button
                            onClick={() => {
                              void handleRemoveFromGrid(contestant);
                            }}
                            className={removeButtonClass}
                            title="Remove from grid"
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
                    className={contestantItemClass}
                    draggable
                    onDragStart={() => {
                      handleDragStart(contestant);
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
    </div>
  );
}
