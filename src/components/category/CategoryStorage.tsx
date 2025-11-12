/**
 * CategoryStorage Component
 *
 * Displays current category storage capacity and provides action to delete all categories
 */

import { formatBytes, calculateStoragePercentage, calculateTotalStorageUsed } from '@utils/storageUtils';
import styles from './CategoryStorage.module.css';

interface CategoryStorageProps {
  categories: { id: string; slideCount: number; sizeInBytes?: number }[];
  onDeleteAll: () => void;
}

export function CategoryStorage({ categories, onDeleteAll }: CategoryStorageProps) {
  const categoryCount = categories.length;
  const totalSlides = categories.reduce((sum, cat) => sum + cat.slideCount, 0);

  // Calculate total storage from in-memory category sizes
  const totalStorageUsed = calculateTotalStorageUsed(categories);

  const containerClass = styles['storage-container'] ?? '';
  const headerClass = styles['storage-header'] ?? '';
  const titleClass = styles['storage-title'] ?? '';
  const capacityClass = styles['capacity-display'] ?? '';
  const barContainerClass = styles['bar-container'] ?? '';
  const barFillClass = styles['bar-fill'] ?? '';
  const sizeTextClass = styles['size-text'] ?? '';
  const deleteButtonClass = styles['delete-all-button'] ?? '';

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <h3 className={titleClass}>Storage Capacity</h3>
        <button
          type="button"
          onClick={onDeleteAll}
          className={deleteButtonClass}
          aria-label="Delete all categories"
        >
          Delete All
        </button>
      </div>

      <div className={capacityClass}>
        <div className={barContainerClass}>
          <div
            className={barFillClass}
            style={{ width: `${String(calculateStoragePercentage(totalStorageUsed))}%` }}
            aria-label={`Storage usage: ${calculateStoragePercentage(totalStorageUsed).toFixed(1)}%`}
          />
        </div>
        <p className={sizeTextClass}>
          {formatBytes(totalStorageUsed)} used
          {categoryCount > 0 &&
            ` • ${String(categoryCount)} ${categoryCount === 1 ? 'category' : 'categories'} • ${String(totalSlides)} slides`}
        </p>
      </div>
    </div>
  );
}
