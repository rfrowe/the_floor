/**
 * Storage utilities for calculating category storage capacity
 */

import type { StoredCategory } from '@types';

/**
 * Calculate the approximate size of a stored category in bytes
 * Estimates based on JSON serialization size
 */
export function calculateCategorySize(category: StoredCategory): number {
  try {
    // Serialize the category to JSON to get approximate storage size
    const json = JSON.stringify(category);
    // Convert to bytes (each character is roughly 2 bytes in UTF-16)
    return new Blob([json]).size;
  } catch (error) {
    console.error('Error calculating category size:', error);
    return 0;
  }
}

/**
 * Calculate total storage used by all categories
 */
export function calculateTotalStorageUsed(categories: StoredCategory[]): number {
  return categories.reduce((total, category) => total + calculateCategorySize(category), 0);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const sizeUnit = sizes[i];
  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  if (sizeUnit === undefined) {
    return `${String(formattedValue)} Bytes`;
  }
  return `${String(formattedValue)} ${sizeUnit}`;
}

/**
 * Calculate storage usage percentage
 * IndexedDB typically has a quota based on available disk space
 * We'll estimate a conservative quota for display purposes
 */
export function calculateStoragePercentage(usedBytes: number): number {
  // Estimate a conservative quota of 500 MB for display purposes
  // Actual IndexedDB quota varies by browser and available disk space
  const estimatedQuota = 500 * 1024 * 1024; // 500 MB in bytes
  return Math.min((usedBytes / estimatedQuota) * 100, 100);
}
