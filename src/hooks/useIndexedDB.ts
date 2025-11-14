/**
 * React hook for managing IndexedDB state with contestants
 * Provides a useState-like interface with automatic IndexedDB persistence
 * Syncs changes across windows/tabs using BroadcastChannel
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAllContestants,
  addContestant,
  addContestants,
  updateContestant,
  updateContestantsBulk,
  deleteContestant,
} from '@storage/indexedDB';
import type { Contestant } from '@types';
import { createBroadcastSync } from '@/utils/broadcastSync';
import { createLogger } from '@/utils/logger';

const CHANNEL_NAME = 'the_floor_contestants';
const log = createLogger('useContestants');

/**
 * Custom hook for managing contestants with IndexedDB persistence
 * @returns Tuple of [contestants, operations]
 */
export function useContestants(): [
  Contestant[],
  {
    add: (contestant: Contestant) => Promise<void>;
    addBulk: (contestants: Contestant[]) => Promise<void>;
    update: (contestant: Contestant) => Promise<void>;
    updateBulk: (contestants: Contestant[]) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
  },
] {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const broadcastRef = useRef<ReturnType<typeof createBroadcastSync<'reload'>> | null>(null);

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
        log.error('Error loading contestants', error);
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

  // Listen for contestant changes from other windows/tabs via BroadcastChannel
  useEffect(() => {
    const broadcast = createBroadcastSync<'reload'>({
      channelName: CHANNEL_NAME,
      onMessage: () => {
        // Reload contestants from IndexedDB when changes broadcast from other windows
        void (async () => {
          try {
            const loaded = await getAllContestants<Contestant>();
            setContestants(loaded);
          } catch (error) {
            log.error('Error reloading contestants', error);
          }
        })();
      },
    });

    broadcastRef.current = broadcast;

    return () => {
      broadcast.cleanup();
    };
  }, []);

  // Add a new contestant
  const add = useCallback(async (contestant: Contestant) => {
    try {
      await addContestant(contestant);
      setContestants((prev) => [...prev, contestant]);
    } catch (error) {
      log.error('Error adding contestant', error);
      throw error;
    }
  }, []);

  // Bulk add multiple contestants
  const addBulk = useCallback(async (newContestants: Contestant[]) => {
    try {
      await addContestants(newContestants);
      setContestants((prev) => [...prev, ...newContestants]);
    } catch (error) {
      log.error('Error bulk adding contestants', error);
      throw error;
    }
  }, []);

  // Update an existing contestant
  const update = useCallback(async (contestant: Contestant) => {
    try {
      await updateContestant(contestant);
      setContestants((prev) => prev.map((c) => (c.id === contestant.id ? contestant : c)));
    } catch (error) {
      log.error('Error updating contestant', error);
      throw error;
    }
  }, []);

  // Bulk update multiple contestants in a single transaction
  const updateBulk = useCallback(async (updatedContestants: Contestant[]) => {
    try {
      await updateContestantsBulk(updatedContestants);

      // Create a map for fast lookup
      const updatedMap = new Map(updatedContestants.map((c) => [c.id, c]));

      // Single setState call with all updates
      setContestants((prev) => prev.map((c) => updatedMap.get(c.id) ?? c));
    } catch (error) {
      log.error('Error bulk updating contestants', error);
      throw error;
    }
  }, []);

  // Remove a contestant
  const remove = useCallback(async (id: string) => {
    try {
      await deleteContestant(id);
      setContestants((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      log.error('Error removing contestant', error);
      throw error;
    }
  }, []);

  // Refresh contestants from IndexedDB
  const refresh = useCallback(async () => {
    try {
      const loaded = await getAllContestants<Contestant>();
      setContestants(loaded);
    } catch (error) {
      log.error('Error loading contestants', error);
    }
  }, []);

  // Return empty array while loading to avoid flicker
  if (isLoading) {
    return [[], { add, addBulk, update, updateBulk, remove, refresh }];
  }

  return [contestants, { add, addBulk, update, updateBulk, remove, refresh }];
}
