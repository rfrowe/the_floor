import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  downloadAll,
  getOfflineStatus,
  clearOffline,
  isOfflineSupported,
  CATEGORY_CACHE,
  OFFLINE_READY_KEY,
} from './offlineCache';
import { getSampleCategoryUrl } from '@utils/sampleCategories';

// Use a small, deterministic set of sample categories. getSampleCategoryUrl
// stays real so cache keys match what the runtime fetch would request.
vi.mock('@utils/sampleCategories', async (importActual) => {
  const actual = await importActual<typeof import('@utils/sampleCategories')>();
  return {
    ...actual,
    getSampleCategories: vi.fn(() => [
      { name: 'Alpha', filename: 'Alpha.json' },
      { name: 'Beta', filename: 'Beta.json' },
      { name: 'Has Space', filename: 'Has Space.json' },
    ]),
  };
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// A fresh in-memory `caches` is installed by setupTests before each test.
const fetchMock = vi.fn((_url?: RequestInfo | URL, _init?: RequestInit) =>
  Promise.resolve(jsonResponse({ category: { name: 'X', slides: [] } }))
);

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockClear();
  localStorage.clear();
});

describe('isOfflineSupported', () => {
  it('is true when caches + serviceWorker are present (test env)', () => {
    expect(isOfflineSupported()).toBe(true);
  });
});

describe('downloadAll', () => {
  it('caches every sample category and records a ready summary', async () => {
    const progress = vi.fn();
    const summary = await downloadAll(progress);

    expect(summary.fileCount).toBe(3);
    expect(summary.persisted).toBe(true);

    const cache = await caches.open(CATEGORY_CACHE);
    const keys = await cache.keys();
    expect(keys).toHaveLength(3);

    // Stored under the exact URL fetchSampleCategory will later request.
    const match = await cache.match(getSampleCategoryUrl('Has Space.json'));
    expect(match).toBeDefined();

    // Progress advanced to completion.
    const last = progress.mock.calls.at(-1)?.[0] as { completed: number; total: number };
    expect(last.completed).toBe(3);
    expect(last.total).toBe(3);

    // Ready flag persisted.
    expect(localStorage.getItem(OFFLINE_READY_KEY)).not.toBeNull();
  });

  it('requests persistent storage once', async () => {
    const persistSpy = vi.spyOn(navigator.storage, 'persist');
    persistSpy.mockClear();
    await downloadAll();
    expect(persistSpy).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: skips files already cached (resume)', async () => {
    const cache = await caches.open(CATEGORY_CACHE);
    await cache.put(
      getSampleCategoryUrl('Alpha.json'),
      jsonResponse({ category: { name: 'A', slides: [] } })
    );

    await downloadAll();

    // Only the two missing files are fetched.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const fetchedUrls = fetchMock.mock.calls.map((call) => call[0]);
    expect(fetchedUrls).not.toContain(getSampleCategoryUrl('Alpha.json'));
  });

  it('rejects with AbortError when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(downloadAll(undefined, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    // Nothing fetched, nothing marked ready.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(OFFLINE_READY_KEY)).toBeNull();
  });

  it('surfaces a friendly message on QuotaExceededError', async () => {
    const throwingCache = {
      put: vi.fn(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      }),
      match: vi.fn(() => Promise.resolve(undefined)),
      keys: vi.fn(() => Promise.resolve([])),
      delete: vi.fn(() => Promise.resolve(true)),
    };
    vi.stubGlobal('caches', {
      open: vi.fn(() => Promise.resolve(throwingCache)),
      delete: vi.fn(() => Promise.resolve(true)),
      keys: vi.fn(() => Promise.resolve([])),
    });

    await expect(downloadAll()).rejects.toThrow(/storage space/i);
  });
});

describe('getOfflineStatus', () => {
  it('reports not-ready before download', async () => {
    const status = await getOfflineStatus();
    expect(status.ready).toBe(false);
    expect(status.cachedCount).toBe(0);
    expect(status.totalCount).toBe(3);
    expect(status.quota).toBe(1_000_000_000);
  });

  it('reports ready after a full download', async () => {
    await downloadAll();
    const status = await getOfflineStatus();
    expect(status.ready).toBe(true);
    expect(status.cachedCount).toBe(3);
    expect(status.summary).not.toBeNull();
  });
});

describe('clearOffline', () => {
  it('empties the cache and clears the ready flag', async () => {
    await downloadAll();
    expect((await getOfflineStatus()).ready).toBe(true);

    await clearOffline();

    const status = await getOfflineStatus();
    expect(status.ready).toBe(false);
    expect(status.cachedCount).toBe(0);
    expect(localStorage.getItem(OFFLINE_READY_KEY)).toBeNull();
  });
});
