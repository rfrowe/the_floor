import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category, Contestant } from '@types';
import { CategoryImporter } from '@components/CategoryImporter';
import { ContestantCard } from '@components/contestant/ContestantCard';
import { DuelSetup, type DuelConfig, type DuelSetupHandle } from '@components/duel/DuelSetup';
import { Container } from '@components/common/Container';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { Modal } from '@components/common/Modal';
import { ThemeToggle } from '@components/common/ThemeToggle';
import { createContestantFromCategory } from '@utils/jsonImport';
import { resetAppState } from '@utils/resetApp';
import { useContestants } from '@hooks/useIndexedDB';
import { useContestantSelection } from '@hooks/useContestantSelection';
import { useDuelState } from '@hooks/useDuelState';
import styles from './Dashboard.module.css';

function Dashboard() {
  const navigate = useNavigate();
  const [showImporter, setShowImporter] = useState(false);
  const [contestantToDelete, setContestantToDelete] = useState<Contestant | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [contestants, { add: addContestant, remove: removeContestant, update: updateContestant }] =
    useContestants();
  const {
    selected,
    select,
    clear: clearSelection,
    randomSelect,
  } = useContestantSelection(contestants);
  const [selectedContestant1, selectedContestant2] = selected;
  const duelSetupRef = useRef<DuelSetupHandle>(null);
  const [duelState] = useDuelState();

  const handleImport = async (contestants: { name: string; category: Category }[]) => {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const { name, category } of contestants) {
      const newContestant = createContestantFromCategory(category, name);
      try {
        await addContestant(newContestant);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to import contestant "${name}":`, error);
        errors.push(`${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setShowImporter(false);

    // Show summary
    if (successCount > 0 && failCount === 0) {
      alert(
        `Successfully imported ${String(successCount)} contestant${successCount !== 1 ? 's' : ''}!`
      );
    } else if (successCount > 0 && failCount > 0) {
      alert(
        `Imported ${String(successCount)} contestant${successCount !== 1 ? 's' : ''}, but ${String(failCount)} failed:\n${errors.join('\n')}`
      );
    } else {
      alert(`Failed to import all contestants:\n${errors.join('\n')}`);
    }
  };

  const handleCancel = () => {
    setShowImporter(false);
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

  const handleOpenAudienceView = () => {
    window.open('/audience', '_blank', 'noopener,noreferrer');
  };

  const handleResumeDuel = () => {
    void navigate('/master');
  };

  const handleContestantClick = (contestant: Contestant) => {
    select(contestant);
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
      // Force refresh to reload empty state
      window.location.reload();
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
          <Button variant="secondary" onClick={handleOpenAudienceView}>
            Open Audience View
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowImporter(true);
            }}
          >
            Import Contestant
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
        />
      </Card>

      {/* Contestants Section */}
      <section className={styles['contestants-section'] ?? ''}>
        <div className={styles['section-header'] ?? ''}>
          <h2>Contestants ({contestants.length})</h2>
        </div>

        {contestants.length === 0 ? (
          // Empty State
          <Card className={styles['empty-state'] ?? ''}>
            <div className={styles['empty-state-content'] ?? ''}>
              <h3>No Contestants Yet</h3>
              <p>Get started by importing contestant data from a PPTX file.</p>
              <Button
                variant="primary"
                size="large"
                onClick={() => {
                  setShowImporter(true);
                }}
              >
                Import Your First Contestant
              </Button>
            </div>
          </Card>
        ) : (
          // Contestants Grid
          <div className={styles['contestants-grid'] ?? ''}>
            {sortedContestants.map((contestant) => (
              <div key={contestant.id} className={styles['contestant-card-wrapper'] ?? ''}>
                <ContestantCard
                  contestant={contestant}
                  isSelected={isContestantSelected(contestant)}
                  onClick={handleContestantClick}
                  hasTopWins={hasTopWins(contestant)}
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
                        void updateContestant({ ...contestant, eliminated: true });
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
            ))}
          </div>
        )}
      </section>

      {/* Import Modal */}
      {showImporter && (
        <Modal isOpen={showImporter} onClose={handleCancel} title="Import Contestant">
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
    </Container>
  );
}

export default Dashboard;
