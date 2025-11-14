/**
 * SampleCategoryBrowser Component
 *
 * Browse and select sample categories to load into the importer.
 */

import { useState, useEffect } from 'react';
import { getSampleCategories, type SampleCategoryMeta } from '@utils/sampleCategories';
import { useViewStack, type View } from '@components/common/ViewStack';
import { IndividualPreview } from './manager/IndividualPreview';
import { useViewStateSet } from '@hooks/useViewState';
import { createLogger } from '@/utils/logger';
import styles from '../CategoryImporter.module.css';

const log = createLogger('SampleBrowser');

interface SampleCategoryBrowserProps {
  initialContestantName?: string;
  onBack?: () => void;
  initialSelections?: Set<string>; // Initialize with these selections
  onSelectionsChange?: (selections: Set<string>) => void; // Notify parent of changes
}

export function SampleCategoryBrowser({
  initialContestantName,
  initialSelections,
  onSelectionsChange,
}: SampleCategoryBrowserProps) {
  const { commitAndPushView } = useViewStack();
  const [sampleCategories, setSampleCategories] = useState<SampleCategoryMeta[]>([]);

  // Use helper hook for automatic state persistence
  const [selectedSamples, setSelectedSamples] = useViewStateSet<string>(
    initialSelections ?? new Set<string>(),
    'selectedSamples'
  );

  // Load sample categories on mount
  useEffect(() => {
    try {
      const samples = getSampleCategories();
      setSampleCategories(samples);
    } catch (error) {
      log.error('Failed to load sample categories', error);
    }
  }, []);

  const toggleSampleSelection = (filename: string) => {
    const next = new Set(selectedSamples);
    if (next.has(filename)) {
      next.delete(filename);
    } else {
      next.add(filename);
    }
    setSelectedSamples(next);
    // Still notify parent if needed for other purposes
    onSelectionsChange?.(next);
  };

  const handleLoadSelectedSamples = () => {
    if (selectedSamples.size === 0) {
      return;
    }

    const filenames = Array.from(selectedSamples);
    const [firstFile, ...remainingFiles] = filenames;

    if (!firstFile) return;

    // Create first individual preview - it will manage its own state
    interface PreviewState {
      contestantName?: string;
      categoryName?: string;
    }

    const firstPreviewView: View<PreviewState, { imported?: number; message?: string }> = {
      id: `preview-${firstFile}-1`,
      title:
        filenames.length === 1 ? 'Preview Category' : `Preview 1 of ${String(filenames.length)}`,
      content: (
        <IndividualPreview
          key={`${firstFile}-1`}
          currentFile={{ filename: firstFile }}
          remainingFiles={remainingFiles.map((f) => ({ filename: f }))}
          source="samples"
          initialContestantName={initialContestantName}
          categoryNumber={1}
          totalCategories={filenames.length}
        />
      ),
      onResult: (result) => {
        if (result.imported) {
          log.success(
            result.message ?? `Imported ${String(result.imported)} categories from samples`
          );
        }
      },
    };

    void commitAndPushView(firstPreviewView);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: 0,
        flex: 1,
      }}
    >
      <div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          Select one or more categories to load. {sampleCategories.length} available.
        </p>
      </div>
      <div
        className={styles['sample-grid-expanded'] ?? styles['sample-grid'] ?? ''}
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
      >
        {sampleCategories.map((sample) => {
          const isSelected = selectedSamples.has(sample.filename);
          return (
            <button
              key={sample.filename}
              type="button"
              onClick={() => {
                toggleSampleSelection(sample.filename);
              }}
              className={`hover-lift ${styles['sample-category-button'] ?? ''} ${
                isSelected ? (styles['selected'] ?? '') : ''
              }`.trim()}
              aria-pressed={isSelected}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{sample.name}</span>
              <span
                className={styles['checkmark'] ?? ''}
                style={{ visibility: isSelected ? 'visible' : 'hidden' }}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
      <div className={styles['actions'] ?? ''}>
        <button
          type="button"
          onClick={handleLoadSelectedSamples}
          disabled={selectedSamples.size === 0}
          className={styles['import-button'] ?? ''}
        >
          {selectedSamples.size === 0
            ? 'Select categories to load'
            : `Load ${String(selectedSamples.size)} ${selectedSamples.size === 1 ? 'Category' : 'Categories'}`}
        </button>
      </div>
    </div>
  );
}
