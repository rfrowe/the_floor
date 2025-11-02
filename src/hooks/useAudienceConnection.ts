/**
 * useAudienceConnection Hook
 *
 * Detects whether an Audience View is connected and active.
 * Used by Master View to prevent starting duels without an audience.
 *
 * Based on Task 28.1 requirements.
 */

import { useState, useEffect } from 'react';
import timerSyncService from '@services/timerSync';

export interface AudienceConnectionReturn {
  /** Whether an Audience View is currently connected */
  isConnected: boolean;

  /** Wait for an audience to connect (returns true if connected within timeout) */
  waitForAudience: (timeoutMs: number) => Promise<boolean>;
}

/**
 * Hook for detecting Audience View connection status
 * Used by Master View to ensure fair gameplay
 */
export function useAudienceConnection(): AudienceConnectionReturn {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check initial connection state
    setIsConnected(timerSyncService.isAudienceConnected());

    // Set up connection change listener
    const checkConnection = () => {
      setIsConnected(timerSyncService.isAudienceConnected());
    };

    const cleanup = timerSyncService.onConnectionChange(checkConnection);

    // Check periodically (in case heartbeat was missed)
    const interval = setInterval(() => {
      setIsConnected(timerSyncService.isAudienceConnected());
    }, 1000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  const waitForAudience = async (timeoutMs: number): Promise<boolean> => {
    return timerSyncService.waitForAudience(timeoutMs);
  };

  return {
    isConnected,
    waitForAudience,
  };
}
