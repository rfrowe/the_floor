/**
 * React hook for loading lightweight category metadata
 * Much faster than useCategories for displaying lists
 */

import { useState, useEffect, useCallback } from 'react';
import { getAllCategoryMetadata } from '@storage/indexedDB';
import { createBroadcastSync } from '@/utils/broadcastSync';

const CHANNEL_NAME = 'the_floor_categories';

export interface CategoryMetadata {
  id: string;
  name: string;
  slideCount: number;
  thumbnailUrl: string;
  createdAt: string;
}

/**
 * Hook for loading category metadata without full slide data
 * Use this for category lists, dropdowns, and overview displays
 */
export function useCategoryMetadata(): [
  CategoryMetadata[],
  { refresh: () => Promise<void> },
] {
  const [metadata, setMetadata] = useState<CategoryMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetadata = useCallback(async () => {
    try {
      const loaded = await getAllCategoryMetadata();
      setMetadata(loaded);
    } catch (error) {
      console.error('Error loading category metadata:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  // Listen for changes from other windows
  useEffect(() => {
    const broadcast = createBroadcastSync<'reload'>({
      channelName: CHANNEL_NAME,
      onMessage: () => {
        void loadMetadata();
      },
    });

    return () => {
      broadcast.cleanup();
    };
  }, [loadMetadata]);

  if (isLoading) {
    return [[], { refresh: loadMetadata }];
  }

  return [metadata, { refresh: loadMetadata }];
}
