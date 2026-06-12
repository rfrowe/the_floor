import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useOfflineCache } from './useOfflineCache';
import * as offlineCache from '@services/offlineCache';
import type { OfflineStatus, OfflineSummary } from '@services/offlineCache';

vi.mock('@services/offlineCache', () => ({
  isOfflineSupported: vi.fn(() => true),
  downloadAll: vi.fn(),
  getOfflineStatus: vi.fn(),
  clearOffline: vi.fn(() => Promise.resolve(undefined)),
}));

const idleStatus: OfflineStatus = {
  ready: false,
  cachedCount: 0,
  totalCount: 3,
  usage: 0,
  quota: 1_000_000_000,
  summary: null,
};

const readySummary: OfflineSummary = {
  downloadedAt: '2026-06-12T00:00:00.000Z',
  fileCount: 3,
  totalBytes: 100,
  persisted: true,
};

const readyStatus: OfflineStatus = {
  ...idleStatus,
  ready: true,
  cachedCount: 3,
  summary: readySummary,
};

beforeEach(() => {
  vi.mocked(offlineCache.isOfflineSupported).mockReturnValue(true);
  vi.mocked(offlineCache.getOfflineStatus).mockResolvedValue(idleStatus);
  vi.mocked(offlineCache.downloadAll).mockReset();
  vi.mocked(offlineCache.clearOffline).mockReset();
  vi.mocked(offlineCache.clearOffline).mockResolvedValue(undefined);
});

describe('useOfflineCache', () => {
  it('derives idle state from status on mount', async () => {
    const { result } = renderHook(() => useOfflineCache());
    await waitFor(() => {
      expect(result.current.status).not.toBeNull();
    });
    expect(result.current.state).toBe('idle');
    expect(result.current.supported).toBe(true);
  });

  it('derives ready state when already cached', async () => {
    vi.mocked(offlineCache.getOfflineStatus).mockResolvedValue(readyStatus);
    const { result } = renderHook(() => useOfflineCache());
    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });
  });

  it('transitions idle → downloading → ready on start()', async () => {
    let resolveDownload: (() => void) | undefined;
    const pending = new Promise<OfflineSummary>((resolve) => {
      resolveDownload = () => {
        resolve(readySummary);
      };
    });
    vi.mocked(offlineCache.downloadAll).mockReturnValue(pending);
    // After the download, status reports ready.
    vi.mocked(offlineCache.getOfflineStatus)
      .mockResolvedValueOnce(idleStatus)
      .mockResolvedValue(readyStatus);

    const { result } = renderHook(() => useOfflineCache());
    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });

    act(() => {
      result.current.start();
    });
    expect(result.current.state).toBe('downloading');

    await act(async () => {
      resolveDownload?.();
      await pending;
    });

    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });
  });

  it('sets error state when the download fails', async () => {
    vi.mocked(offlineCache.downloadAll).mockRejectedValue(new Error('disk full'));

    const { result } = renderHook(() => useOfflineCache());
    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('error');
    });
    expect(result.current.error).toBe('disk full');
  });

  it('returns to idle when cancelled mid-download', async () => {
    vi.mocked(offlineCache.downloadAll).mockImplementation(
      (_onProgress, signal) =>
        new Promise<OfflineSummary>((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        })
    );

    const { result } = renderHook(() => useOfflineCache());
    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });

    act(() => {
      result.current.start();
    });
    expect(result.current.state).toBe('downloading');

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });
  });

  it('clears the cache and resets to idle', async () => {
    vi.mocked(offlineCache.getOfflineStatus).mockResolvedValue(readyStatus);
    const { result } = renderHook(() => useOfflineCache());
    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });

    vi.mocked(offlineCache.getOfflineStatus).mockResolvedValue(idleStatus);
    await act(async () => {
      await result.current.clear();
    });

    expect(offlineCache.clearOffline).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });
  });
});
