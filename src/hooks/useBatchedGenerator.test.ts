/**
 * Tests for useBatchedGenerator — the generic buffered-suggestions hook.
 *
 * Covers the Task 56 acceptance criteria: an initial fetch populates the buffer;
 * `next()` advances synchronously; prefetch fires exactly once when crossing the
 * threshold; an in-flight guard prevents duplicate concurrent fetches; an error
 * on the initial fetch surfaces while a prefetch error leaves buffered candidates
 * usable; case-insensitive de-dup across batches; and a resolution that lands
 * after unmount is dropped.
 *
 * `fetchBatch` is fully controlled via deferred promises so we can interleave
 * advancing the cursor with batch resolution deterministically — no real network.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useBatchedGenerator } from './useBatchedGenerator';
import { GenerationError } from '@services/openai';

/** A promise plus its resolve/reject, so a test can settle it on demand. */
interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function defer<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * A `fetchBatch` whose every call returns a fresh deferred the test controls.
 * `deferreds[i]` corresponds to the (i+1)-th call.
 */
function makeControlledFetch<T>() {
  const deferreds: Deferred<T[]>[] = [];
  const fetchBatch = vi.fn((_batchSize: number): Promise<T[]> => {
    const d = defer<T[]>();
    deferreds.push(d);
    return d.promise;
  });
  return { fetchBatch, deferreds };
}

/** Generate `n` distinct labelled names starting at `start` (1-based). */
function names(start: number, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `Name ${String(start + i)}`);
}

/**
 * Run `mutate` (which settles a deferred), then flush the microtask queue inside
 * `act` so the hook's `.then`/`.catch` chains and the resulting state updates are
 * applied before we assert. The trailing `await` keeps the `act` callback honest
 * for `@typescript-eslint/require-await`.
 */
async function settle(mutate: () => void): Promise<void> {
  await act(async () => {
    mutate();
    await Promise.resolve();
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useBatchedGenerator', () => {
  it('does nothing while disabled', () => {
    const { fetchBatch } = makeControlledFetch<string>();
    const { result } = renderHook(() =>
      useBatchedGenerator<string>({
        fetchBatch,
        batchSize: 10,
        prefetchThreshold: 3,
        enabled: false,
      })
    );

    expect(fetchBatch).not.toHaveBeenCalled();
    expect(result.current.current).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches an initial batch on enable and shows the first candidate', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    const { result } = renderHook(() =>
      useBatchedGenerator<string>({
        fetchBatch,
        batchSize: 10,
        prefetchThreshold: 3,
        enabled: true,
      })
    );

    // While the first batch is in flight and nothing is buffered, we're loading.
    expect(fetchBatch).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.current).toBeUndefined();

    await settle(() => {
      deferreds[0]?.resolve(names(1, 10));
    });

    expect(result.current.current).toBe('Name 1');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('next() advances the cursor synchronously when candidates are buffered', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    const { result } = renderHook(() =>
      useBatchedGenerator<string>({
        fetchBatch,
        batchSize: 10,
        prefetchThreshold: 3,
        enabled: true,
      })
    );
    await settle(() => {
      deferreds[0]?.resolve(names(1, 10));
    });
    expect(result.current.current).toBe('Name 1');

    // A single synchronous next() (no awaiting a fetch) moves to the next item.
    act(() => {
      result.current.next();
    });
    expect(result.current.current).toBe('Name 2');
    expect(result.current.isLoading).toBe(false);
  });

  it('prefetches exactly once when crossing the prefetch threshold, then appends', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    // Buffer of 10, threshold 3: remaining<=3 first happens at cursor 6
    // (remaining = 10 - 1 - 6 = 3).
    const { result } = renderHook(() =>
      useBatchedGenerator<string>({
        fetchBatch,
        batchSize: 10,
        prefetchThreshold: 3,
        enabled: true,
      })
    );
    await settle(() => {
      deferreds[0]?.resolve(names(1, 10));
    });
    expect(fetchBatch).toHaveBeenCalledTimes(1);

    // Advance to cursor 5 (remaining = 4): no prefetch yet.
    for (let i = 0; i < 5; i += 1) {
      act(() => {
        result.current.next();
      });
    }
    expect(result.current.current).toBe('Name 6');
    expect(fetchBatch).toHaveBeenCalledTimes(1);

    // One more step → cursor 6, remaining = 3 → exactly one prefetch fires.
    act(() => {
      result.current.next();
    });
    expect(result.current.current).toBe('Name 7');
    expect(fetchBatch).toHaveBeenCalledTimes(2);

    // A further step while that prefetch is still in flight must NOT start a
    // second concurrent fetch (in-flight guard).
    act(() => {
      result.current.next();
    });
    expect(fetchBatch).toHaveBeenCalledTimes(2);

    // Resolve the prefetch: the new batch is appended and remains navigable.
    await settle(() => {
      deferreds[1]?.resolve(names(11, 10));
    });
    expect(result.current.current).toBe('Name 8');
    // Walk to the boundary and into the appended batch.
    for (let i = 0; i < 4; i += 1) {
      act(() => {
        result.current.next();
      });
    }
    expect(result.current.current).toBe('Name 12');
  });

  it('does not start a duplicate fetch while one is already in flight', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    const { result } = renderHook(() =>
      useBatchedGenerator<string>({ fetchBatch, batchSize: 4, prefetchThreshold: 3, enabled: true })
    );
    // First batch still in flight.
    expect(fetchBatch).toHaveBeenCalledTimes(1);

    // retry() while loading must be a no-op (guarded), not a second fetch.
    act(() => {
      result.current.retry();
    });
    expect(fetchBatch).toHaveBeenCalledTimes(1);

    await settle(() => {
      deferreds[0]?.resolve(names(1, 4));
    });
    expect(result.current.current).toBe('Name 1');
  });

  it('surfaces an error from the initial fetch and recovers via retry()', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    const { result } = renderHook(() =>
      useBatchedGenerator<string>({
        fetchBatch,
        batchSize: 10,
        prefetchThreshold: 3,
        enabled: true,
      })
    );

    await settle(() => {
      deferreds[0]?.reject(new GenerationError('rateLimit', 'slow down'));
    });

    expect(result.current.error).toBeInstanceOf(GenerationError);
    expect(result.current.error?.kind).toBe('rateLimit');
    expect(result.current.current).toBeUndefined();
    expect(result.current.isLoading).toBe(false);

    // retry() re-attempts; success clears the error and populates the buffer.
    act(() => {
      result.current.retry();
    });
    expect(fetchBatch).toHaveBeenCalledTimes(2);
    await settle(() => {
      deferreds[1]?.resolve(names(1, 10));
    });
    expect(result.current.error).toBeNull();
    expect(result.current.current).toBe('Name 1');
  });

  it('a failed prefetch does not break already-buffered candidates', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    const { result } = renderHook(() =>
      useBatchedGenerator<string>({
        fetchBatch,
        batchSize: 10,
        prefetchThreshold: 3,
        enabled: true,
      })
    );
    await settle(() => {
      deferreds[0]?.resolve(names(1, 10));
    });

    // Cross the threshold to trigger a prefetch (cursor 6).
    for (let i = 0; i < 6; i += 1) {
      act(() => {
        result.current.next();
      });
    }
    expect(fetchBatch).toHaveBeenCalledTimes(2);
    expect(result.current.current).toBe('Name 7');

    // The prefetch fails — but the current candidate and the rest of the buffer
    // remain fully usable; isLoading stays false (the user is not waiting).
    await settle(() => {
      deferreds[1]?.reject(new GenerationError('network', 'offline'));
    });
    expect(result.current.error?.kind).toBe('network');
    expect(result.current.current).toBe('Name 7');
    expect(result.current.isLoading).toBe(false);

    // Already-buffered candidates still advance despite the failed prefetch.
    act(() => {
      result.current.next();
    });
    expect(result.current.current).toBe('Name 8');
  });

  it('de-dups across batches case-insensitively (no repeats shown)', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    const { result } = renderHook(() =>
      useBatchedGenerator<string>({ fetchBatch, batchSize: 4, prefetchThreshold: 1, enabled: true })
    );
    await settle(() => {
      deferreds[0]?.resolve(['Alpha', 'Beta', 'Gamma', 'Delta']);
    });
    expect(result.current.current).toBe('Alpha');

    // Drop to remaining<=1 to trigger a prefetch (cursor 2: remaining = 1).
    act(() => {
      result.current.next();
    });
    act(() => {
      result.current.next();
    });
    expect(result.current.current).toBe('Gamma');
    expect(fetchBatch).toHaveBeenCalledTimes(2);

    // The next batch repeats two names (different casing) and adds two new ones.
    await settle(() => {
      deferreds[1]?.resolve(['alpha', 'BETA', 'Epsilon', 'Zeta']);
    });

    // Walk to the end; only the two genuinely-new names should appear after Delta.
    const seen: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      const value = result.current.current;
      if (value && seen[seen.length - 1] !== value) seen.push(value);
      act(() => {
        result.current.next();
      });
    }
    expect(seen).toEqual(['Gamma', 'Delta', 'Epsilon', 'Zeta']);
    // No case-variant repeat of Alpha/Beta leaked into the buffer.
    expect(seen).not.toContain('alpha');
    expect(seen).not.toContain('BETA');
  });

  it('chases another batch (bounded) when a whole batch is duplicates', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    const { result } = renderHook(() =>
      useBatchedGenerator<string>({ fetchBatch, batchSize: 2, prefetchThreshold: 0, enabled: true })
    );
    await settle(() => {
      deferreds[0]?.resolve(['One', 'Two']);
    });

    // Exhaust to remaining<=0 (cursor 1) → prefetch.
    act(() => {
      result.current.next();
    });
    expect(fetchBatch).toHaveBeenCalledTimes(2);

    // First prefetch batch is all duplicates → the hook chases one more.
    await settle(() => {
      deferreds[1]?.resolve(['one', 'TWO']);
    });
    expect(fetchBatch).toHaveBeenCalledTimes(3);

    // The chased batch has a fresh name; it lands in the buffer.
    await settle(() => {
      deferreds[2]?.resolve(['Three', 'one']);
    });
    act(() => {
      result.current.next();
    });
    expect(result.current.current).toBe('Three');
  });

  it('drops a fetch resolution that lands after unmount', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    const { result, unmount } = renderHook(() =>
      useBatchedGenerator<string>({
        fetchBatch,
        batchSize: 10,
        prefetchThreshold: 3,
        enabled: true,
      })
    );
    expect(fetchBatch).toHaveBeenCalledTimes(1);
    const before = result.current;

    unmount();

    // Resolving after unmount must not throw or attempt to set state; the last
    // observed snapshot is unchanged (no candidate ever surfaced).
    await settle(() => {
      deferreds[0]?.resolve(names(1, 10));
    });
    expect(before.current).toBeUndefined();
  });

  it('starts the initial fetch only after enabled flips true', async () => {
    const { fetchBatch, deferreds } = makeControlledFetch<string>();
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useBatchedGenerator<string>({ fetchBatch, batchSize: 10, prefetchThreshold: 3, enabled }),
      { initialProps: { enabled: false } }
    );
    expect(fetchBatch).not.toHaveBeenCalled();

    rerender({ enabled: true });
    expect(fetchBatch).toHaveBeenCalledTimes(1);

    await settle(() => {
      deferreds[0]?.resolve(names(1, 10));
    });
    expect(result.current.current).toBe('Name 1');
  });

  it('supports a custom dedupeKey for non-string candidates', async () => {
    interface Idea {
      id: number;
      label: string;
    }
    const fetchBatch = vi.fn<(batchSize: number) => Promise<Idea[]>>().mockResolvedValueOnce([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ]);
    const { result } = renderHook(() =>
      useBatchedGenerator<Idea>({
        fetchBatch,
        batchSize: 2,
        prefetchThreshold: 3,
        enabled: true,
        dedupeKey: (item) => String(item.id),
      })
    );

    await waitFor(() => {
      expect(result.current.current).toEqual({ id: 1, label: 'a' });
    });
    act(() => {
      result.current.next();
    });
    expect(result.current.current).toEqual({ id: 2, label: 'b' });
  });
});
