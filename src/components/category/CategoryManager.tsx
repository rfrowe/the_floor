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
import type { Contestant } from '@types';
import { Modal } from '@components/common/Modal';
import { ViewStack, type View } from '@components/common/ViewStack';
import { ListContent } from './manager/ListContent';
import { useCategoryMetadata } from '@hooks/useCategoryMetadata';
import { useCategories } from '@hooks/useCategories';
import styles from './CategoryManager.module.css';

interface CategoryManagerProps {
  onClose: () => void;
  contestants: Contestant[];
}

export function CategoryManager({ onClose, contestants }: CategoryManagerProps) {
  // Use metadata for fast list loading
  const [categoryMetadata] = useCategoryMetadata();
  // Keep useCategories for delete operations
  const [, { removeAll: removeAllCategories }] = useCategories();

  const [deletingAllCategories, setDeletingAllCategories] = useState(false);


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

  const listView = {
    id: 'list',
    title: 'Manage Categories',
    content: (
      <ListContent
        categoryMetadata={categoryMetadata}
        contestants={contestants}
        onDeleteAllCategories={handleDeleteAllCategories}
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

      {/* Delete all confirmation modal - separate from ViewStack (allowed exception) */}
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
