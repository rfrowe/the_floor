/**
 * IndividualPreview Component
 *
 * Shows preview of a single category with the ability to navigate to the next.
 * Maintains the one-by-one preview UX while using cleaner architecture.
 */

import { useState, useEffect, useMemo } from 'react';
import type { Category } from '@types';
import { SlideList } from '@components/slide/SlideList';
import { calculateCategorySize } from '@utils/storageUtils';
import { useViewStack, type View } from '@components/common/ViewStack';
import { fetchSampleCategory } from '@utils/sampleCategories';
import { useViewState } from '@hooks/useViewState';
import { AddCategoryCommand } from './commands/AddCategoryCommand';
import { AddContestantCommand } from './commands/AddContestantCommand';
import type { Command } from '@components/common/Command';
import { createLogger } from '@/utils/logger';
import styles from '../../CategoryImporter.module.css';

const log = createLogger('IndividualPreview');

interface PreviewFile {
  filename: string;
  category?: Category;
}

export interface PreviewState extends Record<string, unknown> {
  contestantName: string;
  categoryName: string;
}

interface IndividualPreviewProps {
  // Current file to preview
  currentFile: PreviewFile;
  // Remaining files to preview after this one
  remainingFiles: PreviewFile[];
  // Source of files
  source: 'upload' | 'samples';
  // Pre-populated contestant name (only for first in batch from Add Contestant)
  initialContestantName?: string | undefined;
  // Metadata for display
  categoryNumber?: number;
  totalCategories?: number;
}

export function IndividualPreview({
  currentFile,
  remainingFiles,
  source,
  initialContestantName = '',
  categoryNumber = 1,
  totalCategories = 1,
}: IndividualPreviewProps) {
  const { commitAndPushView, commitAndReturn, popView } = useViewStack();

  // Regular component state (not persisted)
  const [category, setCategory] = useState<Category | null>(currentFile.category ?? null);
  const [isLoading, setIsLoading] = useState(!currentFile.category);
  const [error, setError] = useState<string | null>(null);
  const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(null);
  const [nextCategory, setNextCategory] = useState<Category | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Persisted state using object mode for related values
  const [persistedState, setPersistedState] = useViewState<PreviewState>({
    contestantName: initialContestantName,
    categoryName: '',
  });

  // Convenience accessors
  const editedContestantName = persistedState.contestantName;
  const editedCategoryName = persistedState.categoryName;
  const setEditedContestantName = (name: string) => {
    setPersistedState((prev) => ({ ...prev, contestantName: name }));
  };
  const setEditedCategoryName = (name: string) => {
    setPersistedState((prev) => ({ ...prev, categoryName: name }));
  };

  // Load current category if not provided
  useEffect(() => {
    // If category is provided in props, use it directly
    if (currentFile.category) {
      log.debug(
        `Category #${String(categoryNumber)} (${currentFile.filename}): Using pre-loaded data`
      );
      setCategory(currentFile.category);
      // Only set category name if it's empty (not yet set or restored)
      if (!editedCategoryName) {
        setEditedCategoryName(currentFile.category.name);
      }
      setIsLoading(false);
    } else if (currentFile.filename) {
      // Otherwise load it
      setIsLoading(true);

      const loadCategory = async () => {
        const startTime = performance.now();
        try {
          const result = await fetchSampleCategory(currentFile.filename);
          const duration = Math.round(performance.now() - startTime);
          log.asyncComplete(`Fetched ${currentFile.filename}`, duration);
          setCategory(result.category);
          // Only set category name if it's empty (not yet set or restored)
          if (!editedCategoryName) {
            setEditedCategoryName(result.category.name);
          }
        } catch (err) {
          log.error(`Failed to load ${currentFile.filename}`, err);
          setError(err instanceof Error ? err.message : 'Failed to load category');
        } finally {
          setIsLoading(false);
        }
      };

      void loadCategory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile.filename, currentFile.category, categoryNumber]);

  // Pre-load next category in background for smooth transition
  useEffect(() => {
    if (remainingFiles.length > 0 && source === 'samples') {
      const nextFile = remainingFiles[0];
      if (nextFile && !nextFile.category) {
        let cancelled = false;

        void fetchSampleCategory(nextFile.filename)
          .then(({ category: nextCat }) => {
            if (!cancelled) {
              log.debug(`Pre-loaded: ${nextFile.filename}`);
              setNextCategory(nextCat);
            }
          })
          .catch((err: unknown) => {
            log.error(`Pre-load failed for ${nextFile.filename}`, err);
          });

        return () => {
          cancelled = true;
        };
      }
    }
    return undefined;
  }, [remainingFiles, source, categoryNumber]);

  const categoryMemorySize = useMemo(
    () => (category ? calculateCategorySize(category) : 0),
    [category]
  );

  const handleImportAndNext = async () => {
    if (!category || !editedCategoryName.trim()) return;

    setIsImporting(true);
    try {
      const commands: Command[] = [];

      // Create category command with current values
      const categoryCommand = new AddCategoryCommand({
        name: editedCategoryName,
        slides: category.slides,
        createdAt: new Date().toISOString(),
        thumbnailUrl: category.slides[0]?.imageUrl ?? '',
        sizeInBytes: calculateCategorySize(category),
      });
      commands.push(categoryCommand);

      // Optionally add contestant
      if (editedContestantName.trim()) {
        const contestantCommand = new AddContestantCommand(
          {
            name: editedContestantName,
            category: { ...category, name: editedCategoryName },
            wins: 0,
            eliminated: false,
          },
          categoryCommand
        );
        commands.push(contestantCommand);
      }

      if (remainingFiles.length > 0) {
        // More files to process
        const [nextFile, ...restFiles] = remainingFiles;
        if (nextFile) {
          // Prepare the next category data - only use pre-loaded if it matches
          const usePreloaded =
            nextCategory && remainingFiles[0] && nextFile.filename === remainingFiles[0].filename;

          const nextFileWithCategory: PreviewFile = usePreloaded
            ? { filename: nextFile.filename, category: nextCategory }
            : { filename: nextFile.filename };

          const nextView: View<PreviewState> = {
            id: `preview-${nextFile.filename}-${String(categoryNumber + 1)}`,
            title: `Preview ${String(categoryNumber + 1)} of ${String(totalCategories)}`,
            content: (
              <IndividualPreview
                key={`${nextFile.filename}-${String(categoryNumber + 1)}`}
                currentFile={nextFileWithCategory}
                remainingFiles={restFiles}
                source={source}
                initialContestantName=""
                categoryNumber={categoryNumber + 1}
                totalCategories={totalCategories}
              />
            ),
          };

          await commitAndPushView(nextView, { commands });
        }
      } else {
        // Last file - commit and return to bookmark
        await commitAndReturn({ commands });
      }
    } catch (err) {
      log.error('Import failed', err);
    } finally {
      setIsImporting(false);
    }
  };

  const toggleSlideExpanded = (slideIndex: number) => {
    setExpandedSlideIndex((prev) => (prev === slideIndex ? null : slideIndex));
  };

  const handleSlideAnswerChange = (_slideIndex: number, _newAnswer: string) => {
    // Could implement answer editing here if needed
  };

  if (isLoading) {
    return <div className={styles['loading'] ?? ''}>Loading category...</div>;
  }

  if (error) {
    return (
      <div className={styles['error'] ?? ''}>
        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</p>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Unable to Load Category
        </p>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>{currentFile.filename}</p>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          The category could not be loaded. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => {
            popView();
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!category) {
    return <div className={styles['error'] ?? ''}>No category data available</div>;
  }

  const categoryImporterClass = styles['category-importer'] ?? '';
  const fileInfoClass = styles['file-info'] ?? '';
  const fileNameClass = styles['file-name'] ?? '';

  return (
    <div className={categoryImporterClass}>
      {/* File info header */}
      <div className={fileInfoClass}>
        <div>
          <div className={fileNameClass}>
            {source === 'samples' ? '📦' : '📄'} {currentFile.filename}
            <span className={styles['file-size'] ?? ''}>
              {(() => {
                const sizeInMB = categoryMemorySize / (1024 * 1024);
                return sizeInMB < 1
                  ? `${(categoryMemorySize / 1024).toFixed(1)} KB`
                  : `${sizeInMB.toFixed(1)} MB`;
              })()}
            </span>
            {source === 'samples' && <span className={styles['sample-badge'] ?? ''}>Sample</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleImportAndNext();
          }}
          disabled={!editedCategoryName.trim() || isImporting}
          className={styles['import-button-inline'] ?? ''}
        >
          {isImporting
            ? 'Importing...'
            : remainingFiles.length > 0
              ? 'Import & Next'
              : 'Import & Finish'}
        </button>
      </div>

      {/* Preview section */}
      <div className={styles['preview-section'] ?? ''}>
        <h3>Preview</h3>

        <div className={styles['form-group'] ?? ''}>
          <label htmlFor="contestant-name-input">
            Contestant Name{' '}
            <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>(optional)</span>
            :
          </label>
          <input
            id="contestant-name-input"
            type="text"
            value={editedContestantName}
            onChange={(e) => {
              setEditedContestantName(e.target.value);
            }}
            placeholder="Leave empty to import category only"
          />
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              margin: '0.25rem 0 0 0',
            }}
          >
            {editedContestantName.trim()
              ? `A contestant named "${editedContestantName}" will be created with this category.`
              : 'Only the category will be imported.'}
          </p>
        </div>

        <div className={styles['form-group'] ?? ''}>
          <label htmlFor="category-name-input">Category Name:</label>
          <input
            id="category-name-input"
            type="text"
            value={editedCategoryName}
            onChange={(e) => {
              setEditedCategoryName(e.target.value);
            }}
            placeholder="Enter category name"
            required
          />
        </div>

        <div className={styles['slides-summary'] ?? ''}>
          <SlideList
            slides={category.slides}
            expandedSlideIndex={expandedSlideIndex}
            onToggleExpand={toggleSlideExpanded}
            onAnswerChange={handleSlideAnswerChange}
            mode="edit"
          />
        </div>
      </div>
    </div>
  );
}
