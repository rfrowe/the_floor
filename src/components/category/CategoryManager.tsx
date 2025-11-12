/**
 * CategoryManager Component
 *
 * Displays all available categories in a list view with management capabilities:
 * - View all categories with slide counts and usage info
 * - Search/filter categories by name
 * - Delete categories (with warning if in use)
 * - View category slides with slide animations
 */

import { useState, useCallback } from 'react';
import type { Contestant, Category } from '@types';
import { Modal } from '@components/common/Modal';
import { ViewStack, type View } from '@components/common/ViewStack';
import { ListContent } from './manager/ListContent';
import { useCategoryMetadata } from '@hooks/useCategoryMetadata';
import { useCategories } from '@hooks/useCategories';
import { useContestants } from '@hooks/useIndexedDB';
import styles from './CategoryManager.module.css';

interface CategoryManagerProps {
  onClose: () => void;
  contestants: Contestant[];
  onImport: (contestants: { name: string; category: Category }[]) => Promise<Array<{ categoryId: string; contestantId?: string }>>;
}

export function CategoryManager({ onClose, contestants, onImport }: CategoryManagerProps) {
  // Use metadata for fast list loading
  const [categoryMetadata, { refresh: refreshMetadata }] = useCategoryMetadata();
  // Keep useCategories for delete operations
  const [, { remove: removeCategory, removeAll: removeAllCategories }] = useCategories();
  const [, { remove: removeContestant }] = useContestants();

  const [deletingAllCategories, setDeletingAllCategories] = useState(false);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    await removeCategory(categoryId);
  }, [removeCategory]);

  const handleDeleteAllCategories = useCallback(() => {
    setDeletingAllCategories(true);
  }, []);

  const handleConfirmDeleteAll = async () => {
    try {
      await removeAllCategories();
      setDeletingAllCategories(false);
    } catch (error) {
      console.error('Failed to delete all categories:', error);
      alert(`Failed to delete all categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const categoryModalClass = styles['category-modal'];

  // Simplified handlers for Command pattern
  const handleImportCategory = useCallback(async (data: { name: string; category: Category }) => {
    const results = await onImport([data]);
    await refreshMetadata();
    return results[0] ?? { categoryId: '' };
  }, [onImport, refreshMetadata]);

  const handleUndoImport = useCallback(async (categoryId: string, contestantId?: string) => {
    await Promise.all([
      removeCategory(categoryId),
      contestantId ? removeContestant(contestantId) : Promise.resolve(),
    ]);
    await refreshMetadata();
  }, [removeCategory, removeContestant, refreshMetadata]);

  const listView = {
    id: 'list',
    title: 'Manage Categories',
    content: (
      <ListContent
        categoryMetadata={categoryMetadata}
        contestants={contestants}
        onDeleteCategory={handleDeleteCategory}
        onDeleteAllCategories={handleDeleteAllCategories}
        onImportCategory={handleImportCategory}
        onUndoImport={handleUndoImport}
      />
    ),
  } satisfies View;

  return (
    <>
      <ViewStack
        isOpen={true}
        onClose={onClose}
        initialView={listView}
        {...(categoryModalClass ? { className: categoryModalClass } : {})}
      />

      {/* Delete all confirmation modal - separate from ViewStack */}
      {deletingAllCategories && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingAllCategories(false)}
          title="Confirm Delete All"
        >
          <div className={styles['delete-confirmation']}>
            <p>
              Are you sure you want to delete all {categoryMetadata.length} categories? This action
              cannot be undone.
            </p>
            <div className={styles['modal-footer']}>
              <button
                onClick={() => setDeletingAllCategories(false)}
                className={styles['modal-button-secondary']}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmDeleteAll()}
                className={styles['modal-button-danger']}
              >
                Delete All
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
