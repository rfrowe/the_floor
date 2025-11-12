/**
 * CreateContent Component
 *
 * Main form for creating a contestant with existing or imported category.
 * Uses ViewStack for navigation and hooks for data operations.
 */

import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type { StoredCategory, Contestant } from '@types';
import { Button } from '@components/common/Button';
import { useViewStack } from '@components/common/ViewStack';
import { useContestants } from '@hooks/useIndexedDB';
import { useCategories } from '@hooks/useCategories';
import {
  getSampleCategories,
  fetchSampleCategory,
  type SampleCategoryMeta,
} from '@utils/sampleCategories';
import { ImportContent } from '@components/category/manager/ImportContent';
import styles from '../ContestantCreator.module.css';

interface CreateContentProps {
  categories: StoredCategory[];
  contestantName: string;
  selectedCategoryId: string;
  onStateChange: (state: { contestantName: string; selectedCategoryId: string }) => void;
}

export function CreateContent({
  categories,
  contestantName: propsContestantName,
  selectedCategoryId: propsSelectedCategoryId,
  onStateChange,
}: CreateContentProps) {
  const { pushView, popView } = useViewStack();
  const [, { add: addContestant }] = useContestants();
  const [, { add: addCategory }] = useCategories();

  const [contestantName, setContestantName] = useState(propsContestantName);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(propsSelectedCategoryId);
  const [isCreating, setIsCreating] = useState(false);
  const [sampleCategories, setSampleCategories] = useState<SampleCategoryMeta[]>([]);

  // Load sample categories on mount
  useEffect(() => {
    try {
      const samples = getSampleCategories();
      setSampleCategories(samples);
    } catch (error) {
      console.error('Failed to load sample categories:', error);
    }
  }, []);

  // Sync with props when they change (important for back navigation)
  useEffect(() => {
    setContestantName(propsContestantName);
  }, [propsContestantName]);

  useEffect(() => {
    setSelectedCategoryId(propsSelectedCategoryId);
  }, [propsSelectedCategoryId]);

  // Notify parent of state changes (controlled component pattern)
  useEffect(() => {
    if (contestantName !== propsContestantName || selectedCategoryId !== propsSelectedCategoryId) {
      onStateChange({ contestantName, selectedCategoryId });
    }
  }, [
    contestantName,
    selectedCategoryId,
    propsContestantName,
    propsSelectedCategoryId,
    onStateChange,
  ]);

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

        // Import the sample category with contestant
        const categoryId = nanoid();
        const storedCategory: StoredCategory = {
          id: categoryId,
          name: category.name,
          slides: category.slides,
          createdAt: new Date().toISOString(),
          thumbnailUrl: category.slides[0]?.imageUrl ?? '',
        };
        await addCategory(storedCategory);

        const contestantId = nanoid();
        const newContestant: Contestant = {
          id: contestantId,
          name: contestantName.trim(),
          categoryId,
          category: storedCategory,
          wins: 0,
          eliminated: false,
        };
        await addContestant(newContestant);

        // Close modal and return created contestant
        popView({ created: [newContestant] });
      } else {
        // Regular category from IndexedDB - create contestant directly
        const category = categories.find((c) => c.id === selectedCategoryId);
        if (!category) {
          throw new Error('Category not found');
        }

        const newContestant: Contestant = {
          id: nanoid(),
          name: contestantName.trim(),
          categoryId: selectedCategoryId,
          category,
          wins: 0,
          eliminated: false,
        };
        await addContestant(newContestant);

        // Close modal and return created contestant
        popView({ created: [newContestant] });
      }
    } catch (error) {
      console.error('Failed to create contestant:', error);
      alert(
        `Failed to create contestant: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsCreating(false);
    }
  };

  const handleImportClick = () => {
    // State already managed by parent, just push
    pushView({
      id: 'import',
      title: 'Import Category',
      content: <ImportContent initialContestantName={contestantName} />,
    });
  };

  const canCreate = contestantName.trim() && selectedCategoryId;

  return (
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
          onClick={handleImportClick}
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
  );
}
