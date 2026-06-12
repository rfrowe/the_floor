/**
 * In-memory Cache Storage + StorageManager stubs for tests.
 *
 * jsdom provides neither `caches` nor `navigator.storage`. These factories build
 * lightweight, spec-shaped doubles. Methods return resolved promises rather than
 * using `async`, which keeps them compatible with the project's `require-await`
 * lint rule while still behaving asynchronously.
 */

function cacheKey(request: RequestInfo | URL): string {
  if (typeof request === 'string') {
    return request;
  }
  if (request instanceof URL) {
    return request.toString();
  }
  return request.url;
}

/** A fresh, isolated in-memory CacheStorage. */
export function createCachesStub(): CacheStorage {
  const stores = new Map<string, Map<string, Response>>();

  const openCache = (name: string): Cache => {
    let store = stores.get(name);
    if (!store) {
      store = new Map<string, Response>();
      stores.set(name, store);
    }
    const backing = store;
    const cache = {
      put: (request: RequestInfo | URL, response: Response): Promise<void> => {
        backing.set(cacheKey(request), response);
        return Promise.resolve();
      },
      match: (request: RequestInfo | URL): Promise<Response | undefined> =>
        Promise.resolve(backing.get(cacheKey(request))),
      // Only `.length` is consumed; return lightweight URL-bearing objects since
      // undici's Request rejects relative URLs.
      keys: (): Promise<readonly Request[]> =>
        Promise.resolve(Array.from(backing.keys(), (url) => ({ url }) as unknown as Request)),
      delete: (request: RequestInfo | URL): Promise<boolean> =>
        Promise.resolve(backing.delete(cacheKey(request))),
    };
    return cache as unknown as Cache;
  };

  const stub = {
    open: (name: string): Promise<Cache> => Promise.resolve(openCache(name)),
    delete: (name: string): Promise<boolean> => Promise.resolve(stores.delete(name)),
    has: (name: string): Promise<boolean> => Promise.resolve(stores.has(name)),
    keys: (): Promise<string[]> => Promise.resolve(Array.from(stores.keys())),
    match: (): Promise<Response | undefined> => Promise.resolve(undefined),
  };
  return stub;
}

/** A StorageManager double that grants persistence and reports a large quota. */
export function createStorageManagerStub(): StorageManager {
  const stub = {
    persist: (): Promise<boolean> => Promise.resolve(true),
    persisted: (): Promise<boolean> => Promise.resolve(true),
    estimate: (): Promise<StorageEstimate> => Promise.resolve({ usage: 0, quota: 1_000_000_000 }),
  };
  return stub as unknown as StorageManager;
}
