/**
 * ContestantCreator Component
 *
 * Modal for creating a new contestant by:
 * 1. Entering a contestant name
 * 2. Selecting from existing categories
 * 3. Optionally importing a new category
 */

import { useState, useEffect } from 'react';
import type { StoredCategory, Category } from '@types';
import { Modal } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { CategoryImporter } from '@components/CategoryImporter';
import { SampleCategoryBrowser } from '@components/category/SampleCategoryBrowser';
import {
  getSampleCategories,
  fetchSampleCategory,
  type SampleCategoryMeta,
} from '@utils/sampleCategories';
import styles from './ContestantCreator.module.css';
import modalStyles from '@components/common/Modal.module.css';

type ViewMode = 'create' | 'import' | 'samples';

interface ContestantCreatorProps {
  onClose: () => void;
  onCreate: (name: string, categoryId: string) => Promise<void>;
  onImport: (contestants: { name: string; category: Category }[]) => void | Promise<void> | Promise<string[]> | Promise<Array<{ categoryId: string; contestantId?: string }>>;
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
  const [sampleCategories, setSampleCategories] = useState<SampleCategoryMeta[]>([]);
  const [preloadedCategories, setPreloadedCategories] = useState<
    { name: string; category: Category }[] | null
  >(null);

  // Load sample categories on mount
  useEffect(() => {
    try {
      const samples = getSampleCategories();
      setSampleCategories(samples);
    } catch (error) {
      console.error('Failed to load sample categories:', error);
    }
  }, []);

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
      // Check if this is a sample category (starts with "sample:")
      if (selectedCategoryId.startsWith('sample:')) {
        const filename = selectedCategoryId.substring(7); // Remove "sample:" prefix
        const { category } = await fetchSampleCategory(filename);

        // Import the sample category along with the contestant
        await onImport([{ name: contestantName.trim(), category }]);
        handleClose();
      } else {
        // Regular category from IndexedDB
        await onCreate(contestantName.trim(), selectedCategoryId);
        handleClose();
      }
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

  const handleGoToSamples = () => {
    setViewMode('samples');
  };

  const handleBackToCreate = () => {
    setViewMode('create');
  };

  const handleBackToImport = () => {
    setViewMode('import');
  };

  const currentTitle =
    viewMode === 'create'
      ? 'Add Contestant'
      : viewMode === 'samples'
        ? 'Sample Categories'
        : 'Import Category';

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
          <select
            id="category-select"
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
            }}
            className={styles['select']}
          >
            <option value="">Select a category...</option>
            {categories.length > 0 && (
              <optgroup label="Your Categories">
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.slides.length} slides)
                  </option>
                ))}
              </optgroup>
            )}
            {sampleCategories.length > 0 && (
              <optgroup label="Sample Categories (Demo Data)">
                {sampleCategories.map((sample) => (
                  <option key={`sample-${sample.filename}`} value={`sample:${sample.filename}`}>
                    {sample.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <Button
            variant="secondary"
            onClick={handleGoToImport}
            className={styles['import-button-inline'] ?? ''}
          >
            Or Import New Category
          </Button>
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
    ) : viewMode === 'samples' ? (
      <SampleCategoryBrowser
        onLoadCategories={(categories) => {
          // Store the loaded categories and go to import view to preview them
          setPreloadedCategories(categories);
          setViewMode('import');
        }}
        initialContestantName={contestantName}
      />
    ) : (
      <CategoryImporter
        onImport={(data) => {
          void onImport(data);
          handleBackToCreate();
          setPreloadedCategories(null);
        }}
        onCancel={() => {
          handleBackToCreate();
          setPreloadedCategories(null);
        }}
        initialContestantName={contestantName}
        onBrowseSamples={handleGoToSamples}
        preloadedCategories={preloadedCategories}
      />
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentTitle}
      className={viewMode === 'import' || viewMode === 'samples' ? (modalStyles['modal-wide'] ?? '') : ''}
      {...(viewMode === 'import' ? { onBack: handleBackToCreate } : viewMode === 'samples' ? { onBack: handleBackToImport } : {})}
    >
      {currentContent}
    </Modal>
  );
}
