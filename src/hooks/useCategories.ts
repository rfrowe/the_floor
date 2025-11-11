/**
 * React hook for managing IndexedDB state with categories
 * Provides a useState-like interface with automatic IndexedDB persistence
 * Syncs changes across windows/tabs using BroadcastChannel
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAllCategories,
  addCategory,
  addCategories,
  updateCategory,
  deleteCategory,
  clearAllCategories,
} from '@storage/indexedDB';
import type { StoredCategory } from '@types';
import { createBroadcastSync } from '@/utils/broadcastSync';

const CHANNEL_NAME = 'the_floor_categories';

/**
 * Custom hook for managing categories with IndexedDB persistence
 * @returns Tuple of [categories, operations]
 */
export function useCategories(): [
  StoredCategory[],
  {
    add: (category: StoredCategory) => Promise<void>;
    addBulk: (categories: StoredCategory[]) => Promise<void>;
    update: (category: StoredCategory) => Promise<void>;
    remove: (id: string) => Promise<void>;
    removeAll: () => Promise<void>;
    refresh: () => Promise<void>;
  },
] {
  const [categories, setCategories] = useState<StoredCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const broadcastRef = useRef<ReturnType<typeof createBroadcastSync<'reload'>> | null>(null);

  // Load categories from IndexedDB on mount
  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const loaded = await getAllCategories<StoredCategory>();
        if (mounted) {
          setCategories(loaded);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for category changes from other windows/tabs via BroadcastChannel
  useEffect(() => {
    const broadcast = createBroadcastSync<'reload'>({
      channelName: CHANNEL_NAME,
      onMessage: () => {
        // Reload categories from IndexedDB when changes broadcast from other windows
        void (async () => {
          try {
            const loaded = await getAllCategories<StoredCategory>();
            setCategories(loaded);
          } catch (error) {
            console.error('Error reloading categories:', error);
          }
        })();
      },
    });

    broadcastRef.current = broadcast;

    return () => {
      broadcast.cleanup();
    };
  }, []);

  // Add a new category
  const add = useCallback(async (category: StoredCategory) => {
    try {
      await addCategory(category);
      setCategories((prev) => [...prev, category]);
      // Broadcast change to other windows/tabs
      broadcastRef.current?.send('reload');
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }, []);

  // Bulk add multiple categories
  const addBulk = useCallback(async (newCategories: StoredCategory[]) => {
    try {
      await addCategories(newCategories);
      setCategories((prev) => [...prev, ...newCategories]);
      // Broadcast change to other windows/tabs
      broadcastRef.current?.send('reload');
    } catch (error) {
      console.error('Error bulk adding categories:', error);
      throw error;
    }
  }, []);

  // Update an existing category
  const update = useCallback(async (category: StoredCategory) => {
    try {
      await updateCategory(category);
      setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));

      // Small delay to ensure IndexedDB transaction is fully committed before broadcasting
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Broadcast change to other windows/tabs
      broadcastRef.current?.send('reload');
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }, []);

  // Remove a category
  const remove = useCallback(async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      // Broadcast change to other windows/tabs
      broadcastRef.current?.send('reload');
    } catch (error) {
      console.error('Error removing category:', error);
      throw error;
    }
  }, []);

  // Remove all categories
  const removeAll = useCallback(async () => {
    try {
      await clearAllCategories();
      setCategories([]);
      // Broadcast change to other windows/tabs
      broadcastRef.current?.send('reload');
    } catch (error) {
      console.error('Error removing all categories:', error);
      throw error;
    }
  }, []);

  // Refresh categories from IndexedDB
  const refresh = useCallback(async () => {
    try {
      const loaded = await getAllCategories<StoredCategory>();
      setCategories(loaded);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  // Return empty array while loading to avoid flicker
  if (isLoading) {
    return [[], { add, addBulk, update, remove, removeAll, refresh }];
  }

  return [categories, { add, addBulk, update, remove, removeAll, refresh }];
}
