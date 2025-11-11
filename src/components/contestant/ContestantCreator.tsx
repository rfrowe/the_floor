/**
 * ContestantCreator Component
 *
 * Modal for creating a new contestant by:
 * 1. Entering a contestant name
 * 2. Selecting from existing categories
 * 3. Optionally importing a new category
 */

import { useState } from 'react';
import type { StoredCategory, Category } from '@types';
import { Modal } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { CategoryImporter } from '@components/CategoryImporter';
import styles from './ContestantCreator.module.css';

type ViewMode = 'create' | 'import';

interface ContestantCreatorProps {
  onClose: () => void;
  onCreate: (name: string, categoryId: string) => Promise<void>;
  onImport: (contestants: { name: string; category: Category }[]) => void | Promise<void>;
  categories: StoredCategory[];
}

export function ContestantCreator({
  onClose,
  onCreate,
  onImport,
  categories,
}: ContestantCreatorProps) {
  const [contestantName, setContestantName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    // Wait for animation before calling parent's onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleCreate = async () => {
    if (!contestantName.trim() || !selectedCategoryId) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreate(contestantName.trim(), selectedCategoryId);
      handleClose();
    } catch (error) {
      console.error('Failed to create contestant:', error);
      alert(
        `Failed to create contestant: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsCreating(false);
    }
  };

  const canCreate = contestantName.trim() && selectedCategoryId;

  const handleGoToImport = () => {
    setViewMode('import');
  };

  const handleBackToCreate = () => {
    setViewMode('create');
  };

  const currentTitle = viewMode === 'create' ? 'Add Contestant' : 'Import Category';

  const currentContent =
    viewMode === 'create' ? (
      <>
        <div className={styles['form-group']}>
          <label htmlFor="contestant-name">Contestant Name:</label>
          <input
            id="contestant-name"
            type="text"
            value={contestantName}
            onChange={(e) => {
              setContestantName(e.target.value);
            }}
            placeholder="Enter contestant name"
            className={styles['input']}
          />
        </div>

        <div className={styles['form-group']}>
          <label htmlFor="category-select">Category:</label>
          {categories.length === 0 ? (
            <div className={styles['no-categories']}>
              <p>No categories available. Import a category first.</p>
              <Button variant="primary" onClick={handleGoToImport}>
                Import Category
              </Button>
            </div>
          ) : (
            <>
              <select
                id="category-select"
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                }}
                className={styles['select']}
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.slides.length} slides)
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={handleGoToImport}
                className={styles['import-button-inline'] ?? ''}
              >
                Or Import New Category
              </Button>
            </>
          )}
        </div>

        {/* Footer buttons as part of view */}
        <div className={styles['footer-actions']}>
          <Button
            variant="primary"
            onClick={() => {
              void handleCreate();
            }}
            disabled={!canCreate || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Contestant'}
          </Button>
        </div>
      </>
    ) : (
      <CategoryImporter
        onImport={(data) => {
          void onImport(data);
          handleBackToCreate();
        }}
        onCancel={handleBackToCreate}
        initialContestantName={contestantName}
      />
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentTitle}
      {...(viewMode === 'import' ? { onBack: handleBackToCreate } : {})}
    >
      {currentContent}
    </Modal>
  );
}
