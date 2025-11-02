/**
 * React hook for managing IndexedDB state with contestants
 * Provides a useState-like interface with automatic IndexedDB persistence
 * Syncs changes across windows/tabs using BroadcastChannel
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAllContestants,
  addContestant,
  updateContestant,
  deleteContestant,
} from '@storage/indexedDB';
import type { Contestant } from '@types';
import { createBroadcastSync } from '@/utils/broadcastSync';

const CHANNEL_NAME = 'the_floor_contestants';

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
            console.error('Error reloading contestants:', error);
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
      // Broadcast change to other windows/tabs
      broadcastRef.current?.send('reload');
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

      // Small delay to ensure IndexedDB transaction is fully committed before broadcasting
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Broadcast change to other windows/tabs
      broadcastRef.current?.send('reload');
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
      // Broadcast change to other windows/tabs
      broadcastRef.current?.send('reload');
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
