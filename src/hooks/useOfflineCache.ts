import { useState, useEffect, useRef, useCallback } from 'react';
import {
  downloadAll,
  getOfflineStatus,
  clearOffline,
  isOfflineSupported,
  type DownloadProgress,
  type OfflineStatus,
} from '@services/offlineCache';
import { createLogger } from '@utils/logger';

const log = createLogger('useOfflineCache');

export type OfflineState = 'idle' | 'downloading' | 'ready' | 'error';

export interface UseOfflineCache {
  /** Current lifecycle state. */
  state: OfflineState;
  /** Whether offline caching is available in this browser. */
  supported: boolean;
  /** Latest readiness snapshot (counts, storage estimate, summary). */
  status: OfflineStatus | null;
  /** Live download progress, present while downloading. */
  progress: DownloadProgress | null;
  /** Human-readable error message when state is 'error'. */
  error: string | null;
  /** Begin (or resume) caching all sample categories. */
  start: () => void;
  /** Abort an in-flight download (leaves partial cache; resumable). */
  cancel: () => void;
  /** Remove all cached categories and reset to idle. */
  clear: () => Promise<void>;
  /** Re-read the offline status from Cache Storage; resolves to the latest snapshot. */
  refresh: () => Promise<OfflineStatus | null>;
}

/**
 * React hook managing the offline-cache lifecycle for sample categories.
 * Mirrors the localStorage-backed pattern used by {@link useTheme}.
 */
export function useOfflineCache(): UseOfflineCache {
  const supported = isOfflineSupported();
  const [state, setState] = useState<OfflineState>('idle');
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const downloadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Refresh the status snapshot only. State is owned by the lifecycle handlers
  // below so a late-resolving refresh can never clobber an 'error'/'downloading'
  // state. Returns the latest status (or null when unavailable).
  const refresh = useCallback(async (): Promise<OfflineStatus | null> => {
    if (!supported) {
      return null;
    }
    try {
      const next = await getOfflineStatus();
      if (mountedRef.current) {
        setStatus(next);
      }
      return next;
    } catch (err) {
      log.warn('Failed to refresh offline status', err);
      return null;
    }
  }, [supported]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh().then((next) => {
      if (next && mountedRef.current && !downloadingRef.current) {
        setState(next.ready ? 'ready' : 'idle');
      }
    });
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [refresh]);

  const start = useCallback(() => {
    if (!supported || downloadingRef.current) {
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    downloadingRef.current = true;
    setError(null);
    setProgress({
      completed: 0,
      total: status?.totalCount ?? 0,
      bytes: 0,
      currentName: '',
    });
    setState('downloading');

    void downloadAll((next) => {
      if (mountedRef.current) {
        setProgress(next);
      }
    }, controller.signal)
      .then(() => {
        downloadingRef.current = false;
        if (mountedRef.current) {
          setState('ready');
        }
        void refresh();
      })
      .catch((err: unknown) => {
        downloadingRef.current = false;
        if (!mountedRef.current) {
          return;
        }
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Cancelled — reflect partial progress as a resumable idle/ready state.
          void refresh().then((next) => {
            if (mountedRef.current) {
              setState(next?.ready ? 'ready' : 'idle');
            }
          });
          return;
        }
        log.error('Offline download failed', err);
        setError(err instanceof Error ? err.message : 'Download failed');
        setState('error');
        void refresh();
      });
  }, [supported, status, refresh]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(async () => {
    abortRef.current?.abort();
    downloadingRef.current = false;
    await clearOffline();
    if (mountedRef.current) {
      setProgress(null);
      setError(null);
    }
    const next = await refresh();
    if (mountedRef.current) {
      setState(next?.ready ? 'ready' : 'idle');
    }
  }, [refresh]);

  return { state, supported, status, progress, error, start, cancel, clear, refresh };
}
