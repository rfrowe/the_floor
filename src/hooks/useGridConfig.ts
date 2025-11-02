/**
 * Hook for managing grid configuration with cross-window sync via BroadcastChannel
 */

import { useState, useEffect, useRef } from 'react';
import { loadGridConfig, saveGridConfig, type GridConfig } from '@/storage/gridConfig';
import { createBroadcastSync } from '@/utils/broadcastSync';

const CHANNEL_NAME = 'the_floor_grid_config';

export function useGridConfig(): [GridConfig, (config: GridConfig) => void] {
  const [config, setConfig] = useState<GridConfig>(() => loadGridConfig());
  const broadcastRef = useRef<ReturnType<typeof createBroadcastSync<GridConfig>> | null>(null);

  // Initialize broadcast channel
  useEffect(() => {
    const broadcast = createBroadcastSync<GridConfig>({
      channelName: CHANNEL_NAME,
      onMessage: (newConfig) => {
        setConfig(newConfig);
      },
    });

    broadcastRef.current = broadcast;

    // Fallback to storage events if BroadcastChannel not supported
    if (!broadcast.isSupported) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'the_floor_grid_config' && e.newValue) {
          try {
            const newConfig = JSON.parse(e.newValue) as GridConfig;
            setConfig(newConfig);
          } catch {
            // Invalid config, ignore
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        broadcast.cleanup();
      };
    }

    return () => {
      broadcast.cleanup();
    };
  }, []);

  const updateConfig = (newConfig: GridConfig) => {
    setConfig(newConfig);
    saveGridConfig(newConfig);

    // Broadcast to other windows/tabs
    broadcastRef.current?.send(newConfig);
  };

  return [config, updateConfig];
}
