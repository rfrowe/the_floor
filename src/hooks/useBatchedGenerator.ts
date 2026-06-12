/**
 * useBatchedGenerator — a generic "buffered suggestions" hook.
 *
 * Many Studio steps want to show one AI-generated candidate at a time and let the
 * user cycle to the next instantly (a 🎲 dice). Calling the API on every click
 * would lag; fetching a whole batch up front and *prefetching the next batch
 * before the current one runs out* keeps cycling instant without over-fetching.
 *
 * This hook owns that batching + background-prefetch machinery generically over
 * `T`. The category-name step (Task 56) is the first consumer; it stays reusable
 * for later "buffered suggestion" needs.
 *
 * Design (per Task 56 acceptance criteria):
 *  - The `buffer` lives in a `useRef`, so *consuming* it (advancing the cursor)
 *    never forces a re-render by itself — only `cursor` (state) and the loading/
 *    error flags do.
 *  - `next()` advances the cursor *synchronously*: when candidates are buffered,
 *    the dice is instant (no awaiting).
 *  - After `next()` (and on the initial enabled mount) we prefetch the next batch
 *    when `remaining = buffer.length - 1 - cursor <= prefetchThreshold` and no
 *    fetch is already in flight.
 *  - A `fetchingRef` guard prevents duplicate concurrent fetches; a monotonically
 *    increasing `requestSeq` (compared against a "live" generation counter) drops
 *    stale resolutions, including any that land after unmount.
 *  - `isLoading` is true only when the user is actually *waiting* — i.e. there is
 *    no `current` candidate AND a fetch is in flight.
 *  - A failed fetch records a typed {@link GenerationError} but leaves any
 *    already-buffered candidates usable; `retry()` re-attempts.
 *  - New batches are de-duplicated against everything already buffered using an
 *    optional `dedupeKey` (case-insensitive for the string default). If a whole
 *    batch is duplicates, we fetch one more (bounded) so the user always gets a
 *    fresh option.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GenerationError, toGenerationError } from '@services/openai';

/** Options for {@link useBatchedGenerator}. */
export interface UseBatchedGeneratorOptions<T> {
  /**
   * Fetch one batch of candidates. Receives the desired `batchSize` so callers
   * can size the request; may return fewer (the model can repeat itself).
   * Rejections are normalized to a {@link GenerationError}.
   */
  fetchBatch: (batchSize: number) => Promise<T[]>;
  /** How many candidates to request per batch. */
  batchSize: number;
  /**
   * Prefetch the next batch once the number of *unseen* buffered candidates drops
   * to this threshold or below. `0` means "prefetch only when the buffer is
   * exhausted".
   */
  prefetchThreshold: number;
  /**
   * Gate all activity. While `false`, no fetch runs and the buffer stays empty;
   * flipping to `true` triggers the initial fetch.
   */
  enabled: boolean;
  /**
   * Derive a de-duplication key for a candidate. Defaults to a case-insensitive
   * key for string candidates (trim + lowercase). Provide this for non-string
   * `T` (or return a unique key per item to disable de-duplication).
   */
  dedupeKey?: (item: T) => string;
}

/** The value returned by {@link useBatchedGenerator}. */
export interface UseBatchedGeneratorResult<T> {
  /** The current candidate, or `undefined` while the very first batch is loading. */
  current: T | undefined;
  /** Advance to the next candidate synchronously, prefetching when low. */
  next: () => void;
  /** True only when the user is waiting: no `current` AND a fetch is in flight. */
  isLoading: boolean;
  /** The most recent fetch error, if any. Buffered candidates remain usable. */
  error: GenerationError | null;
  /** Re-attempt a fetch (e.g. after an error, or to top up an empty buffer). */
  retry: () => void;
}

/**
 * Default de-dup key for string candidates: trimmed + lowercased so the dice
 * never shows case-only or whitespace-only repeats.
 */
function defaultStringKey(item: unknown): string {
  return typeof item === 'string' ? item.trim().toLowerCase() : JSON.stringify(item);
}

/**
 * Upper bound on consecutive all-duplicate batches we'll chase before giving up,
 * so a model stuck repeating itself can't spin the fetch loop forever.
 */
const MAX_DEDUPE_RETRIES = 2;

export function useBatchedGenerator<T>({
  fetchBatch,
  batchSize,
  prefetchThreshold,
  enabled,
  dedupeKey,
}: UseBatchedGeneratorOptions<T>): UseBatchedGeneratorResult<T> {
  // The candidate buffer lives in a ref: appending to it or moving the cursor
  // must not, by itself, re-render. We bump `cursor` (state) to surface a new
  // `current`, and toggle the loading/error state when the user is waiting.
  const bufferRef = useRef<T[]>([]);
  const [cursor, setCursor] = useState(0);

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<GenerationError | null>(null);

  // In-flight guard: prevents two concurrent fetches from stacking.
  const fetchingRef = useRef(false);
  // Monotonic request id; only the latest request may mutate state. Incrementing
  // it (on unmount or retry) invalidates older in-flight resolutions.
  const requestSeqRef = useRef(0);
  const mountedRef = useRef(true);

  // Keep the latest props in refs so the stable callbacks below don't need them
  // in their dependency arrays (which would otherwise re-create `next`/`retry`
  // on every render and churn the prefetch logic).
  const fetchBatchRef = useRef(fetchBatch);
  fetchBatchRef.current = fetchBatch;
  const batchSizeRef = useRef(batchSize);
  batchSizeRef.current = batchSize;
  const prefetchThresholdRef = useRef(prefetchThreshold);
  prefetchThresholdRef.current = prefetchThreshold;
  const dedupeKeyRef = useRef<(item: T) => string>(dedupeKey ?? defaultStringKey);
  dedupeKeyRef.current = dedupeKey ?? defaultStringKey;

  // The set of keys already in the buffer, kept in lockstep with `bufferRef` so
  // de-dup is O(1) per candidate rather than rescanning the whole buffer.
  const seenKeysRef = useRef<Set<string>>(new Set());

  /**
   * Append only candidates whose key isn't already buffered. Returns how many
   * genuinely new candidates were added (so the caller can decide whether to
   * chase another batch when everything was a duplicate).
   */
  const appendUnique = useCallback((items: T[]): number => {
    let added = 0;
    for (const item of items) {
      const key = dedupeKeyRef.current(item);
      if (seenKeysRef.current.has(key)) continue;
      seenKeysRef.current.add(key);
      bufferRef.current.push(item);
      added += 1;
    }
    return added;
  }, []);

  /**
   * Fetch a batch and append its unique candidates. If a whole batch was
   * duplicates, chase up to {@link MAX_DEDUPE_RETRIES} more so the user always
   * gets a fresh option. State is only touched by the *latest* request (guarded
   * by `requestSeq`), so a resolution that lands after unmount or after a
   * newer fetch began is dropped.
   */
  const runFetch = useCallback(async (): Promise<void> => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const seq = (requestSeqRef.current += 1);

    // Only flip the "fetching" flag for the live request.
    if (mountedRef.current) {
      setIsFetching(true);
      setError(null);
    }

    const isStale = (): boolean => !mountedRef.current || seq !== requestSeqRef.current;

    try {
      let attempts = 0;
      // Loop while we keep getting all-duplicate batches (bounded), so the buffer
      // genuinely grows even if the model repeats prior suggestions.
      for (;;) {
        const batch = await fetchBatchRef.current(batchSizeRef.current);
        if (isStale()) return;

        const added = appendUnique(batch);
        attempts += 1;

        if (added > 0 || attempts > MAX_DEDUPE_RETRIES) {
          break;
        }
      }
      if (!isStale()) {
        setError(null);
      }
    } catch (caught) {
      if (!isStale()) {
        // Keep already-buffered candidates usable; just record the typed error.
        setError(toGenerationError(caught));
      }
    } finally {
      // Clear the in-flight guard only if this is still the live request; a
      // superseded request must not unlock a newer one.
      if (seq === requestSeqRef.current) {
        fetchingRef.current = false;
        if (mountedRef.current) {
          setIsFetching(false);
        }
      }
    }
  }, [appendUnique]);

  /** Prefetch when the unseen remainder is at/under the threshold and idle. */
  const maybePrefetch = useCallback(
    (nextCursor: number): void => {
      const remaining = bufferRef.current.length - 1 - nextCursor;
      if (remaining <= prefetchThresholdRef.current && !fetchingRef.current) {
        void runFetch();
      }
    },
    [runFetch]
  );

  /**
   * Advance the cursor synchronously (instant dice) and prefetch if we're now
   * running low. The cursor never advances past the last buffered candidate, so
   * when the buffer is exhausted we hold on the last item and rely on the
   * prefetch to extend it.
   */
  const next = useCallback((): void => {
    setCursor((c) => {
      const lastIndex = bufferRef.current.length - 1;
      const nextCursor = c < lastIndex ? c + 1 : c;
      maybePrefetch(nextCursor);
      return nextCursor;
    });
  }, [maybePrefetch]);

  /** Re-attempt a fetch (after an error, or to populate an empty buffer). */
  const retry = useCallback((): void => {
    void runFetch();
  }, [runFetch]);

  // Initial fetch on enable. Invalidates any in-flight request on disable/unmount
  // by bumping the sequence so a late resolution is dropped.
  useEffect(() => {
    mountedRef.current = true;
    if (enabled && bufferRef.current.length === 0 && !fetchingRef.current) {
      void runFetch();
    }
    return () => {
      mountedRef.current = false;
      // Invalidate any in-flight request: a newer "generation" means older
      // resolutions are stale and must not touch state.
      requestSeqRef.current += 1;
      fetchingRef.current = false;
    };
  }, [enabled, runFetch]);

  const current = bufferRef.current[cursor];
  // The user is only "waiting" when there's nothing to show and a fetch is live.
  const isLoading = current === undefined && isFetching;

  return { current, next, isLoading, error, retry };
}
