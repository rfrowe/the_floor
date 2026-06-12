import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { OfflineDownloadButton } from './OfflineDownloadButton';
import { useOfflineCache, type UseOfflineCache } from '@hooks/useOfflineCache';
import type { OfflineStatus } from '@services/offlineCache';

vi.mock('@hooks/useOfflineCache', () => ({ useOfflineCache: vi.fn() }));

const baseStatus: OfflineStatus = {
  ready: false,
  cachedCount: 0,
  totalCount: 3,
  usage: 1000,
  quota: 1_000_000_000,
  summary: null,
};

function mockHook(overrides: Partial<UseOfflineCache>): UseOfflineCache {
  const value: UseOfflineCache = {
    state: 'idle',
    supported: true,
    status: baseStatus,
    progress: null,
    error: null,
    start: vi.fn(),
    cancel: vi.fn(),
    clear: vi.fn(() => Promise.resolve(undefined)),
    refresh: vi.fn(() => Promise.resolve(null)),
    ...overrides,
  };
  vi.mocked(useOfflineCache).mockReturnValue(value);
  return value;
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.mocked(useOfflineCache).mockReset();
});

describe('OfflineDownloadButton', () => {
  it('renders nothing when offline caching is unsupported', () => {
    mockHook({ supported: false });
    const { container } = render(<OfflineDownloadButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opens a modal and starts the download from idle', () => {
    const value = mockHook({ state: 'idle' });
    render(<OfflineDownloadButton />);

    fireEvent.click(screen.getByRole('button', { name: /download sample categories/i }));

    // Modal opened with a Download action.
    const download = screen.getByRole('button', { name: /download for offline use/i });
    fireEvent.click(download);
    expect(value.start).toHaveBeenCalledTimes(1);
  });

  it('shows progress and cancels while downloading', () => {
    const value = mockHook({
      state: 'downloading',
      progress: { completed: 1, total: 3, bytes: 5_000_000, currentName: 'Bears.json' },
    });
    render(<OfflineDownloadButton />);

    // Button face shows percent (1/3 ≈ 33%).
    fireEvent.click(screen.getByRole('button', { name: /downloading for offline use/i }));

    expect(screen.getByText(/caching 1 of 3/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(value.cancel).toHaveBeenCalledTimes(1);
  });

  it('offers re-download and clear when ready', () => {
    const value = mockHook({
      state: 'ready',
      status: { ...baseStatus, ready: true, cachedCount: 3 },
    });
    render(<OfflineDownloadButton />);

    fireEvent.click(screen.getByRole('button', { name: /available offline/i }));

    fireEvent.click(screen.getByRole('button', { name: /clear offline data/i }));
    expect(value.clear).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /re-download/i }));
    expect(value.start).toHaveBeenCalledTimes(1);
  });

  it('shows the error and retries', () => {
    const value = mockHook({ state: 'error', error: 'Ran out of storage space.' });
    render(<OfflineDownloadButton />);

    fireEvent.click(screen.getByRole('button', { name: /offline download failed/i }));

    expect(screen.getByText(/ran out of storage space/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(value.start).toHaveBeenCalledTimes(1);
  });
});
