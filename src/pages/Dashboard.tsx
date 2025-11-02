import { useState } from 'react';
import type { Category, Contestant } from '@types';
import { CategoryImporter } from '@components/CategoryImporter';
import { ContestantCard } from '@components/contestant/ContestantCard';
import { Container } from '@components/common/Container';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { Modal } from '@components/common/Modal';
import { createContestantFromCategory } from '@utils/jsonImport';
import { useContestants } from '@hooks/useIndexedDB';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [showImporter, setShowImporter] = useState(false);
  const [contestantToDelete, setContestantToDelete] = useState<Contestant | null>(null);
  const [contestants, { add: addContestant, remove: removeContestant }] = useContestants();

  const handleImport = async (contestantName: string, category: Category) => {
    const newContestant = createContestantFromCategory(category, contestantName);
    try {
      await addContestant(newContestant);
      setShowImporter(false);
      alert(
        `Successfully imported contestant "${contestantName}" with ${String(category.slides.length)} slides!`
      );
    } catch (error) {
      console.error('Failed to import contestant:', error);
      alert(
        `Failed to import contestant: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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

  // Sort contestants: active first, then eliminated
  const sortedContestants = [...contestants].sort((a, b) => {
    if (a.eliminated === b.eliminated) {
      return 0;
    }
    return a.eliminated ? 1 : -1;
  });

  const dashboardClass = styles['dashboard'] ?? '';
  const headerClass = styles['header'] ?? '';
  const titleClass = styles['title'] ?? '';
  const headerActionsClass = styles['header-actions'] ?? '';
  const duelPanelClass = styles['duel-panel'] ?? '';
  const duelPanelContentClass = styles['duel-panel-content'] ?? '';
  const placeholderTextClass = styles['placeholder-text'] ?? '';

  return (
    <Container className={dashboardClass}>
      {/* Header */}
      <header className={headerClass}>
        <h1 className={titleClass}>The Floor</h1>
        <div className={headerActionsClass}>
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
        </div>
      </header>

      {/* Duel Setup Panel - Placeholder for task-12 */}
      <Card className={duelPanelClass}>
        <div className={duelPanelContentClass}>
          <p className={placeholderTextClass}>Duel setup controls will be implemented in task-12</p>
        </div>
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
                <ContestantCard contestant={contestant} />
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => {
                    handleDeleteClick(contestant);
                  }}
                  className={styles['delete-button'] ?? ''}
                >
                  Delete
                </Button>
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
    </Container>
  );
}

export default Dashboard;
