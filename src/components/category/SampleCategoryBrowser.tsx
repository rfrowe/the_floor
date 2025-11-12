/**
 * SampleCategoryBrowser Component
 *
 * Browse and select sample categories to load into the importer.
 */

import { useState, useEffect } from 'react';
import type { Category } from '@types';
import {
  getSampleCategories,
  fetchSampleCategory,
  type SampleCategoryMeta,
} from '@utils/sampleCategories';
import styles from '../CategoryImporter.module.css';

interface SampleCategoryBrowserProps {
  onLoadCategories: (
    categories: { name: string; category: Category }[],
    selections: Set<string> // Pass back current selections
  ) => void | Promise<void>;
  initialContestantName?: string;
  onBack?: () => void;
  initialSelections?: Set<string>; // Initialize with these selections
}

export function SampleCategoryBrowser({
  onLoadCategories,
  initialContestantName,
  initialSelections,
}: SampleCategoryBrowserProps) {
  const [sampleCategories, setSampleCategories] = useState<SampleCategoryMeta[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<Set<string>>(
    initialSelections ?? new Set()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load sample categories on mount
  useEffect(() => {
    try {
      const samples = getSampleCategories();
      setSampleCategories(samples);
    } catch (error) {
      console.error('Failed to load sample categories:', error);
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
  };

  const handleLoadSelectedSamples = async () => {
    if (selectedSamples.size === 0) {
      return;
    }

    setIsLoading(true);
    const filenames = Array.from(selectedSamples);

    try {
      // Load all selected categories
      const categoryPromises = filenames.map(async (filename) => {
        try {
          const { category } = await fetchSampleCategory(filename);
          return {
            name: initialContestantName ?? '',
            category,
          };
        } catch (error) {
          console.error(`Failed to load ${filename}:`, error);
          return null;
        }
      });

      const results = await Promise.all(categoryPromises);
      const loadedCategories = results.filter(
        (c): c is { name: string; category: Category } => c !== null
      );

      if (loadedCategories.length > 0) {
        await onLoadCategories(loadedCategories, selectedSamples);
      }
    } catch (error) {
      console.error('Failed to load sample categories:', error);
    } finally {
      setIsLoading(false);
    }
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
            >
              {isSelected && <span className={styles['checkmark'] ?? ''}>✓</span>}
              {sample.name}
            </button>
          );
        })}
      </div>
      <div className={styles['actions'] ?? ''}>
        <button
          type="button"
          onClick={() => {
            void handleLoadSelectedSamples();
          }}
          disabled={selectedSamples.size === 0 || isLoading}
          className={styles['import-button'] ?? ''}
        >
          {isLoading
            ? 'Loading...'
            : selectedSamples.size === 0
              ? 'Select categories to load'
              : `Load ${String(selectedSamples.size)} ${selectedSamples.size === 1 ? 'Category' : 'Categories'}`}
        </button>
      </div>
    </div>
  );
}
