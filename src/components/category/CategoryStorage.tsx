/**
 * CategoryStorage Component
 *
 * Displays current category storage capacity and provides action to delete all categories
 */

import type { StoredCategory } from '@types';
import {
  calculateTotalStorageUsed,
  formatBytes,
  calculateStoragePercentage,
} from '@utils/storageUtils';
import styles from './CategoryStorage.module.css';

interface CategoryStorageProps {
  categories: StoredCategory[];
  onDeleteAll: () => void;
}

export function CategoryStorage({ categories, onDeleteAll }: CategoryStorageProps) {
  const totalBytes = calculateTotalStorageUsed(categories);
  const formattedSize = formatBytes(totalBytes);
  const percentage = calculateStoragePercentage(totalBytes);

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
            style={{ width: `${String(percentage)}%` }}
            aria-label={`Storage usage: ${percentage.toFixed(1)}%`}
          />
        </div>
        <p className={sizeTextClass}>{formattedSize} used</p>
      </div>
    </div>
  );
}
