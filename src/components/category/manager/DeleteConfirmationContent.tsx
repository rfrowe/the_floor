/**
 * DeleteConfirmationContent Component
 *
 * Confirmation dialog for deleting a category.
 * Uses ViewStack for navigation and hooks for operations.
 * No callbacks - fully self-contained.
 */

import { useViewStack } from '@components/common/ViewStack';
import { useCategories } from '@hooks/useCategories';
import styles from '../CategoryManager.module.css';

interface DeleteConfirmationContentProps {
  categoryId: string;
  categoryName: string;
}

export function DeleteConfirmationContent({
  categoryId,
  categoryName,
}: DeleteConfirmationContentProps) {
  const { popView } = useViewStack();
  const [, { remove: removeCategory }] = useCategories();

  const handleConfirm = async () => {
    try {
      await removeCategory(categoryId);
      popView(); // Close confirmation view after delete
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(
        `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleCancel = () => {
    popView(); // Just close the view
  };

  return (
    <div className={styles['delete-confirmation']}>
      <p>Are you sure you want to delete the category &quot;{categoryName}&quot;?</p>
      <div className={styles['modal-footer']}>
        <button onClick={handleCancel} className={styles['modal-button-secondary']}>
          Cancel
        </button>
        <button onClick={() => void handleConfirm()} className={styles['modal-button-danger']}>
          Delete
        </button>
      </div>
    </div>
  );
}
