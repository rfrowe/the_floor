/**
 * localStorage abstraction layer with error handling and type safety
 * Provides a clean API over browser's localStorage with fallback to in-memory storage
 */

import { createLogger } from '@/utils/logger';

const log = createLogger('LocalStorage');
const STORAGE_PREFIX = 'the-floor:';

/**
 * In-memory fallback storage when localStorage is unavailable
 */
const memoryStorage = new Map<string, string>();

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = `${STORAGE_PREFIX}__test__`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the full storage key with prefix
 */
function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Get an item from storage with type safety and default value fallback
 * @param key - Storage key (without prefix)
 * @param defaultValue - Value to return if key doesn't exist or parsing fails
 * @returns Parsed value or default value
 */
export function getItem<T>(key: string, defaultValue: T): T {
  const fullKey = getStorageKey(key);

  try {
    if (isLocalStorageAvailable()) {
      const item = localStorage.getItem(fullKey);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } else {
      // Use in-memory fallback
      const item = memoryStorage.get(fullKey);
      if (item === undefined) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    }
  } catch (error) {
    log.warn(`Error reading storage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Set an item in storage with automatic JSON serialization
 * @param key - Storage key (without prefix)
 * @param value - Value to store (will be JSON serialized)
 */
export function setItem<T>(key: string, value: T): void {
  const fullKey = getStorageKey(key);

  try {
    const serialized = JSON.stringify(value);

    if (isLocalStorageAvailable()) {
      localStorage.setItem(fullKey, serialized);
    } else {
      // Use in-memory fallback
      memoryStorage.set(fullKey, serialized);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      log.error('Storage quota exceeded. Consider clearing old data.');
    } else {
      log.error(`Error setting storage key "${key}":`, error);
    }
    throw error;
  }
}

/**
 * Remove an item from storage
 * @param key - Storage key (without prefix)
 */
export function removeItem(key: string): void {
  const fullKey = getStorageKey(key);

  try {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(fullKey);
    } else {
      memoryStorage.delete(fullKey);
    }
  } catch (error) {
    log.warn(`Error removing storage key "${key}":`, error);
  }
}

/**
 * Clear all items with our prefix from storage
 */
export function clear(): void {
  try {
    if (isLocalStorageAvailable()) {
      // Only remove keys with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });
    } else {
      // Clear in-memory storage
      const keysToRemove: string[] = [];
      memoryStorage.forEach((_, key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach((key) => {
        memoryStorage.delete(key);
      });
    }
  } catch (error) {
    log.error('Error clearing storage:', error);
  }
}
