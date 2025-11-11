/**
 * CategoryStorage Component
 *
 * Displays current category storage capacity and provides action to delete all categories
 */

import { formatBytes, calculateStoragePercentage } from '@utils/storageUtils';
import styles from './CategoryStorage.module.css';

interface CategoryStorageProps {
  categories: Array<{ id: string; slideCount: number }>;
  onDeleteAll: () => void;
}

export function CategoryStorage({ categories, onDeleteAll }: CategoryStorageProps) {
  // Approximate storage based on category count (rough estimate)
  // Each slide ~50-200KB, so we'll estimate ~100KB per slide average
  const estimatedBytes = categories.reduce((sum, cat) => sum + cat.slideCount * 100 * 1024, 0);
  const formattedSize = formatBytes(estimatedBytes);
  const percentage = calculateStoragePercentage(estimatedBytes);

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
