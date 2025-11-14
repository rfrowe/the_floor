/**
 * Storage utilities for calculating category storage capacity
 */

import sizeof from 'object-sizeof';
import { createLogger } from './logger';
import type { Category } from '@types';

const logger = createLogger('StorageUtils');

/**
 * Calculate the actual in-memory size of a category object in bytes
 * Uses recursive traversal to measure all fields
 */
export function calculateCategorySize(category: Category): number {
  try {
    return sizeof(category);
  } catch (error) {
    logger.error('Error calculating category size:', error);
    return 0;
  }
}

/**
 * Calculate total storage used by categories based on their stored sizeInBytes
 */
export function calculateTotalStorageUsed(categories: { sizeInBytes?: number }[]): number {
  return categories.reduce((total, category) => total + (category.sizeInBytes ?? 0), 0);
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
