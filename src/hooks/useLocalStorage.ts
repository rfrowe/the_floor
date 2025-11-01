/**
 * Generic React hook for managing localStorage state
 * Provides a useState-like interface with automatic persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '@/storage/localStorage';

/**
 * Custom hook for managing state with localStorage persistence
 * @param key - Storage key (without prefix)
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [value, setValue] similar to useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with value from localStorage or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getItem(key, initialValue);
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prevValue) => {
        // Allow value to be a function (like useState)
        const valueToStore = value instanceof Function ? value(prevValue) : value;

        try {
          // Update localStorage
          setItem(key, valueToStore);
        } catch (error) {
          console.error(`Error setting localStorage key "${key}":`, error);
        }

        return valueToStore;
      });
    },
    [key]
  );

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === `the-floor:${key}` && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue) as T;
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}
