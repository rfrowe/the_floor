/**
 * A tiny shared concurrency limiter (semaphore).
 *
 * Wraps any async function so that no more than `limit` invocations run at once,
 * regardless of how many callers fire concurrently. Extra calls queue (FIFO) and
 * start as in-flight ones settle. This is the rate-limit safety net for OpenAI
 * image generation: a SINGLE limiter governs every `generateImage` call — both
 * lazy per-card clicks and "Generate all" — so total concurrent requests never
 * exceed the cap no matter how the user triggers them.
 *
 * Dependency-free and framework-free so it runs in tests and the browser alike.
 */

/** A function that wraps a task to enforce the shared concurrency cap. */
export type Limiter = <T>(task: () => Promise<T>) => Promise<T>;

/**
 * Create a limiter that runs at most `limit` tasks concurrently.
 *
 * The returned function preserves each task's resolved value and rejection: a
 * task that throws rejects only its own returned promise (and frees its slot),
 * never affecting queued or in-flight siblings.
 *
 * @param limit Maximum tasks in flight at once; values below 1 are clamped to 1.
 */
export function createLimiter(limit: number): Limiter {
  const max = Math.max(1, Math.floor(limit));
  let active = 0;
  const queue: (() => void)[] = [];

  const next = (): void => {
    if (active >= max) return;
    const start = queue.shift();
    if (start) {
      active += 1;
      start();
    }
  };

  return <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = (): void => {
        // Defer to a microtask so a synchronously-throwing `task` still settles
        // via the promise machinery (and the slot is released exactly once).
        Promise.resolve()
          .then(task)
          .then(resolve, reject)
          .finally(() => {
            active -= 1;
            next();
          });
      };
      queue.push(run);
      next();
    });
}
