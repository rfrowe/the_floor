import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import type { Category, Contestant, StoredCategory } from '@types';
import { CategoryImporter } from '@components/CategoryImporter';
import { CategoryManager } from '@components/category/CategoryManager';
import { ContestantCard } from '@components/contestant/ContestantCard';
import { ContestantCreator } from '@components/contestant/ContestantCreator';
import { DuelSetup, type DuelConfig, type DuelSetupHandle } from '@components/duel/DuelSetup';
import { GridConfigurator } from '@components/dashboard/GridConfigurator';
import { Container } from '@components/common/Container';
import { Button } from '@components/common/Button';
import { LinkButton } from '@components/common/LinkButton';
import { Card } from '@components/common/Card';
import { Modal } from '@components/common/Modal';
import { ThemeToggle } from '@components/common/ThemeToggle';
import { createContestantFromCategory } from '@utils/jsonImport';
import { resetAppState } from '@utils/resetApp';
import { calculateCategorySize } from '@utils/storageUtils';
import { useContestants } from '@hooks/useIndexedDB';
import { useCategories } from '@hooks/useCategories';
import { useContestantSelection } from '@hooks/useContestantSelection';
import { useDuelState } from '@hooks/useDuelState';
import styles from './Dashboard.module.css';

function Dashboard() {
  const navigate = useNavigate();
  const [showImporter, setShowImporter] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAddContestant, setShowAddContestant] = useState(false);
  const [contestantToDelete, setContestantToDelete] = useState<Contestant | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [
    contestants,
    {
      addBulk: addContestantsBulk,
      remove: removeContestant,
      update: updateContestant,
      updateBulk: updateContestantsBulk,
    },
  ] = useContestants();
  const [categories, { addBulk: addCategoriesBulk }] = useCategories();
  const {
    selected,
    select,
    clear: clearSelection,
    randomSelect,
    canSelectAsP2,
  } = useContestantSelection(contestants);
  const [selectedContestant1, selectedContestant2] = selected;
  const duelSetupRef = useRef<DuelSetupHandle>(null);
  const [duelState] = useDuelState();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const handleImport = async (
    contestants: { name: string; category: Category }[]
  ): Promise<{ categoryId: string; contestantId?: string }[]> => {
    // Prevent multiple simultaneous imports
    if (isImporting) {
      return [];
    }

    setIsImporting(true);

    try {
      // Prepare all categories and contestants for bulk import
      const categoriesToAdd: StoredCategory[] = [];
      const contestantsToAdd: Contestant[] = [];
      const importResults: { categoryId: string; contestantId?: string }[] = [];

      for (const { name, category } of contestants) {
        const categoryId = nanoid();

        const firstSlide = category.slides[0];
        const thumbnailUrl = firstSlide?.imageUrl ?? '';

        // Calculate actual in-memory size
        const sizeInBytes = calculateCategorySize(category);

        const storedCategory: StoredCategory = {
          id: categoryId,
          name: category.name,
          slides: category.slides,
          createdAt: new Date().toISOString(),
          thumbnailUrl,
          sizeInBytes,
        };

        categoriesToAdd.push(storedCategory);

        // Only create contestant if name is provided
        if (name.trim()) {
          const newContestant = createContestantFromCategory(category, name);
          newContestant.categoryId = categoryId;
          contestantsToAdd.push(newContestant);
          importResults.push({ categoryId, contestantId: newContestant.id });
        } else {
          importResults.push({ categoryId });
        }
      }

      // Bulk add categories and contestants in parallel using hooks (updates UI)
      await Promise.all([
        categoriesToAdd.length > 0 ? addCategoriesBulk(categoriesToAdd) : Promise.resolve(),
        contestantsToAdd.length > 0 ? addContestantsBulk(contestantsToAdd) : Promise.resolve(),
      ]);

      setShowImporter(false);
      return importResults;
    } catch (error) {
      console.error('Failed to import:', error);
      alert(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setShowImporter(false);
  };

  const handleCreateContestant = (_contestants: Contestant[]) => {
    // Contestants already created by ContestantCreator
    // Just close the modal
    setShowAddContestant(false);
  };

  const handleDeleteClick = (contestant: Contestant) => {
    setContestantToDelete(contestant);
  };

  const handleConfirmDelete = async () => {
    if (contestantToDelete) {
      try {
        await removeContestant(contestantToDelete.id);
        setContestantToDelete(null);
      } catch (error) {
        console.error('Failed to delete contestant:', error);
        alert(
          `Failed to delete contestant: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };

  const handleCancelDelete = () => {
    setContestantToDelete(null);
  };

  const handleResumeDuel = () => {
    void navigate('/master');
  };

  const handleContestantClick = (contestant: Contestant) => {
    // Selection is handled by the select function from useContestantSelection
    // Disabled contestants won't be clickable due to the disabled prop
    select(contestant);
  };

  const isContestantDisabled = (contestant: Contestant): boolean => {
    // Disable contestants who are not on the board (no controlled squares)
    if (!contestant.controlledSquares || contestant.controlledSquares.length === 0) {
      return true;
    }

    // Never disable already selected contestants (so they can be deselected)
    if (selectedContestant1?.id === contestant.id || selectedContestant2?.id === contestant.id) {
      return false;
    }

    // If both P1 and P2 are selected, disable all other contestants
    if (selectedContestant1 && selectedContestant2) {
      return true;
    }

    // If selecting P2 (P1 already selected, P2 not yet), disable non-adjacent contestants
    if (selectedContestant1 && !selectedContestant2) {
      return !canSelectAsP2(contestant);
    }
    return false;
  };

  const handleClearDuelSelection = () => {
    clearSelection();
  };

  const handleStartDuel = (_duelConfig: DuelConfig) => {
    // DuelSetup component handles navigation and state saving
    // Clear selections after starting
    clearSelection();
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    try {
      await resetAppState();
      setShowResetConfirm(false);
      // Trigger redirect to same route to force remount and ensure clean state
      setShouldRedirect(true);
    } catch (error) {
      console.error('Failed to reset app:', error);
      alert(
        `Failed to reset application: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  const handleUpdateContestants = async (updatedContestants: Contestant[]) => {
    // Filter to only contestants that actually changed
    const changedContestants = updatedContestants.filter((updated) => {
      const original = contestants.find((c) => c.id === updated.id);
      return JSON.stringify(original) !== JSON.stringify(updated);
    });

    // Bulk update all changed contestants in a single transaction
    if (changedContestants.length > 0) {
      await updateContestantsBulk(changedContestants);
    }
  };

  const isContestantSelected = (contestant: Contestant): boolean => {
    return selectedContestant1?.id === contestant.id || selectedContestant2?.id === contestant.id;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        if (selectedContestant1 || selectedContestant2) {
          e.preventDefault();
          clearSelection();
        }
      }

      // Space: Start duel if ready
      if (e.key === ' ') {
        if (selectedContestant1 && selectedContestant2 && duelSetupRef.current) {
          e.preventDefault();
          duelSetupRef.current.startDuel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedContestant1, selectedContestant2, clearSelection]);

  // Sort contestants: active first, then eliminated, alphabetically within each group
  const sortedContestants = [...contestants].sort((a, b) => {
    // First, sort by eliminated status (active first)
    if (a.eliminated !== b.eliminated) {
      return a.eliminated ? 1 : -1;
    }
    // Within same status, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  // Find the maximum number of wins (for crown indicator)
  const maxWins = contestants.length > 0 ? Math.max(...contestants.map((c) => c.wins)) : 0;
  const hasTopWins = (contestant: Contestant) => contestant.wins > 0 && contestant.wins === maxWins;

  // Check if there are any contestants on the grid (for enabling Random Select)
  const hasContestantsOnGrid = contestants.some(
    (c) => !c.eliminated && c.controlledSquares && c.controlledSquares.length > 0
  );

  // Handle redirect triggered by app reset
  if (shouldRedirect) {
    return <Navigate to="/" replace state={{ key: Date.now() }} />;
  }

  const dashboardClass = styles['dashboard'] ?? '';
  const headerClass = styles['header'] ?? '';
  const titleClass = styles['title'] ?? '';
  const headerActionsClass = styles['header-actions'] ?? '';
  const duelPanelClass = styles['duel-panel'] ?? '';

  return (
    <Container className={dashboardClass}>
      {/* Header */}
      <header className={headerClass}>
        <h1 className={titleClass}>The Floor</h1>
        <div className={headerActionsClass}>
          <ThemeToggle />
          {duelState && (
            <Button variant="primary" onClick={handleResumeDuel}>
              Resume Duel
            </Button>
          )}
          <LinkButton to="/audience" variant="secondary" target="_blank" rel="noopener noreferrer">
            Open Audience View
          </LinkButton>
          <Button
            variant="secondary"
            onClick={() => {
              setShowCategoryManager(true);
            }}
            title="Manage categories"
          >
            Manage Categories
          </Button>
          <Button variant="danger" onClick={handleResetClick} title="Reset all application data">
            Reset App
          </Button>
        </div>
      </header>

      {/* Duel Setup Panel */}
      <Card className={duelPanelClass}>
        <DuelSetup
          ref={duelSetupRef}
          contestant1={selectedContestant1}
          contestant2={selectedContestant2}
          onClear={handleClearDuelSelection}
          onStartDuel={handleStartDuel}
          onRandomSelect={randomSelect}
          canRandomSelect={hasContestantsOnGrid}
        />
      </Card>

      {/* Grid Configuration Panel with Drag & Drop */}
      {contestants.length > 0 && (
        <Card>
          <GridConfigurator
            contestants={contestants}
            onUpdateContestants={handleUpdateContestants}
          />
        </Card>
      )}

      {/* Contestants Section */}
      <section className={styles['contestants-section'] ?? ''}>
        <div className={styles['section-header'] ?? ''}>
          <h2>Contestants ({contestants.length})</h2>
        </div>

        {/* Contestants Grid - always show even when empty */}
        <div
          className={`${styles['contestants-grid'] ?? ''} ${selectedContestant2 ? (styles['has-p2'] ?? '') : ''}`.trim()}
        >
          {sortedContestants.map((contestant) => {
            const wrapperClass = styles['contestant-card-wrapper'] ?? '';
            const duelP1Class =
              selectedContestant1?.id === contestant.id ? (styles['duel-p1'] ?? '') : '';
            const duelP2Class =
              selectedContestant2?.id === contestant.id ? (styles['duel-p2'] ?? '') : '';
            const eliminatedWrapperClass = contestant.eliminated
              ? (styles['eliminated-wrapper'] ?? '')
              : '';

            const selectionPos =
              selectedContestant1?.id === contestant.id
                ? 'P1'
                : selectedContestant2?.id === contestant.id
                  ? 'P2'
                  : undefined;

            return (
              <div
                key={contestant.id}
                className={`${wrapperClass} ${duelP1Class} ${duelP2Class} ${eliminatedWrapperClass}`.trim()}
              >
                <ContestantCard
                  contestant={contestant}
                  isSelected={isContestantSelected(contestant)}
                  {...(selectionPos ? { selectionPosition: selectionPos } : {})}
                  onClick={handleContestantClick}
                  hasTopWins={hasTopWins(contestant)}
                  disabled={isContestantDisabled(contestant)}
                />
                <div className={styles['action-buttons'] ?? ''}>
                  {contestant.eliminated ? (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        void updateContestant({ ...contestant, eliminated: false });
                      }}
                      className={styles['revive-button'] ?? ''}
                      title="Revive contestant"
                    >
                      🍄
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => {
                        const { gridPosition: _gridPosition, ...contestantWithoutPosition } =
                          contestant;
                        void updateContestant({
                          ...contestantWithoutPosition,
                          eliminated: true,
                          controlledSquares: [],
                        });
                      }}
                      className={styles['eliminate-button'] ?? ''}
                      title="Eliminate contestant"
                    >
                      ☠️
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => {
                      handleDeleteClick(contestant);
                    }}
                    className={styles['delete-button'] ?? ''}
                    title="Delete contestant permanently"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add Contestant card */}
          <div className={styles['contestant-card-wrapper'] ?? ''}>
            <div
              className={styles['add-contestant-card'] ?? ''}
              onClick={() => {
                setShowAddContestant(true);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowAddContestant(true);
                }
              }}
              aria-label="Add new contestant"
            >
              <div className={styles['add-icon'] ?? ''}>+</div>
              <div className={styles['add-label'] ?? ''}>Add Contestant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Import Modal */}
      {showImporter && (
        <Modal isOpen={showImporter} onClose={handleCancel} title="Import Category">
          <CategoryImporter onImport={handleImport} onCancel={handleCancel} />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={contestantToDelete !== null}
        onClose={handleCancelDelete}
        title="Delete Contestant"
        footer={
          <div className={styles['modal-footer'] ?? ''}>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                void handleConfirmDelete();
              }}
              data-testid="confirm-delete-button"
            >
              Delete
            </Button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete{' '}
          <strong>{contestantToDelete?.name ?? 'this contestant'}</strong>?
        </p>
        <p>This action cannot be undone.</p>
      </Modal>

      {/* Reset App Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={handleCancelReset}
        title="Reset Application"
        footer={
          <div className={styles['modal-footer'] ?? ''}>
            <Button variant="secondary" onClick={handleCancelReset}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                void handleConfirmReset();
              }}
              data-testid="confirm-reset-button"
            >
              Reset Everything
            </Button>
          </div>
        }
      >
        <p>
          <strong>Warning:</strong> This will permanently delete ALL application data:
        </p>
        <ul>
          <li>All contestants and their categories</li>
          <li>Active duel state</li>
          <li>Game configuration</li>
        </ul>
        <p>
          <strong>This action cannot be undone.</strong>
        </p>
      </Modal>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          onClose={() => {
            setShowCategoryManager(false);
          }}
          contestants={contestants}
        />
      )}

      {/* Add Contestant Modal */}
      {showAddContestant && (
        <ContestantCreator
          onClose={() => {
            setShowAddContestant(false);
          }}
          onCreate={handleCreateContestant}
          categories={categories}
        />
      )}
    </Container>
  );
}

export default Dashboard;
