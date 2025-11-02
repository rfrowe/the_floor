/**
 * React hook for managing IndexedDB state with contestants
 * Provides a useState-like interface with automatic IndexedDB persistence
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllContestants,
  addContestant,
  updateContestant,
  deleteContestant,
} from '@storage/indexedDB';
import type { Contestant } from '@types';

/**
 * Custom hook for managing contestants with IndexedDB persistence
 * @returns Tuple of [contestants, operations]
 */
export function useContestants(): [
  Contestant[],
  {
    add: (contestant: Contestant) => Promise<void>;
    update: (contestant: Contestant) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
  },
] {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load contestants from IndexedDB on mount
  useEffect(() => {
    let mounted = true;

    const loadContestants = async () => {
      try {
        const loaded = await getAllContestants<Contestant>();
        if (mounted) {
          setContestants(loaded);
        }
      } catch (error) {
        console.error('Error loading contestants:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContestants();

    return () => {
      mounted = false;
    };
  }, []);

  // Add a new contestant
  const add = useCallback(async (contestant: Contestant) => {
    try {
      await addContestant(contestant);
      setContestants((prev) => [...prev, contestant]);
    } catch (error) {
      console.error('Error adding contestant:', error);
      throw error;
    }
  }, []);

  // Update an existing contestant
  const update = useCallback(async (contestant: Contestant) => {
    try {
      await updateContestant(contestant);
      setContestants((prev) => prev.map((c) => (c.id === contestant.id ? contestant : c)));
    } catch (error) {
      console.error('Error updating contestant:', error);
      throw error;
    }
  }, []);

  // Remove a contestant
  const remove = useCallback(async (id: string) => {
    try {
      await deleteContestant(id);
      setContestants((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Error removing contestant:', error);
      throw error;
    }
  }, []);

  // Refresh contestants from IndexedDB
  const refresh = useCallback(async () => {
    try {
      const loaded = await getAllContestants<Contestant>();
      setContestants(loaded);
    } catch (error) {
      console.error('Error loading contestants:', error);
    }
  }, []);

  // Return empty array while loading to avoid flicker
  if (isLoading) {
    return [[], { add, update, remove, refresh }];
  }

  return [contestants, { add, update, remove, refresh }];
}
