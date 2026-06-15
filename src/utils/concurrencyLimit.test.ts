/**
 * Tests for the shared concurrency limiter.
 *
 * The core guarantee: no more than `limit` tasks run at once, regardless of how
 * many are submitted concurrently. We assert this with deferred promises by
 * tracking in-flight count and its observed maximum, then draining one at a time
 * and confirming a freed slot picks up the next queued task. We also cover value
 * pass-through, per-task rejection isolation, and the `limit < 1` clamp.
 */

import { describe, it, expect } from 'vitest';
import { createLimiter } from './concurrencyLimit';

/** A controllable gate: a promise plus an `open()` to settle it on demand. */
interface Gate {
  promise: Promise<void>;
  open: () => void;
}

function gate(): Gate {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => {
    open = () => {
      resolve();
    };
  });
  return { promise, open };
}

/** Let queued microtasks flush so the limiter can dequeue. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('createLimiter', () => {
  it('never runs more than `limit` tasks at once', async () => {
    const limit = 3;
    const run = createLimiter(limit);

    let inFlight = 0;
    let maxInFlight = 0;
    const gates: Gate[] = [];

    const task = (): Promise<string> => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      const g = gate();
      gates.push(g);
      return g.promise.then(() => {
        inFlight -= 1;
        return 'ok';
      });
    };

    // Submit more tasks than the cap so the limiter must queue.
    const total = limit + 4;
    const results = Array.from({ length: total }, () => run(task));

    await flush();
    // Only `limit` should have started.
    expect(inFlight).toBe(limit);
    expect(maxInFlight).toBe(limit);
    expect(gates).toHaveLength(limit);

    // Drain one at a time; each freed slot pulls exactly one queued task and the
    // cap must continue to hold.
    let opened = 0;
    while (opened < total) {
      const g = gates[opened];
      expect(g).toBeDefined();
      g?.open();
      opened += 1;
      await flush();
      expect(inFlight).toBeLessThanOrEqual(limit);
    }

    await Promise.all(results);
    expect(maxInFlight).toBe(limit);
    expect(gates).toHaveLength(total);
  });

  it('passes through each task’s resolved value', async () => {
    const run = createLimiter(2);
    const values = await Promise.all([
      run(() => Promise.resolve(1)),
      run(() => Promise.resolve(2)),
      run(() => Promise.resolve(3)),
    ]);
    expect(values).toEqual([1, 2, 3]);
  });

  it('isolates a rejecting task and frees its slot for the next one', async () => {
    const run = createLimiter(1);
    const order: string[] = [];

    const bad = run(() => Promise.reject(new Error('boom')));
    const good = run(() =>
      Promise.resolve().then(() => {
        order.push('good ran');
        return 'fine';
      })
    );

    await expect(bad).rejects.toThrow('boom');
    await expect(good).resolves.toBe('fine');
    // The good task only ran after the bad one freed the single slot.
    expect(order).toEqual(['good ran']);
  });

  it('clamps a sub-1 limit to 1 (serializes)', async () => {
    const run = createLimiter(0);
    let inFlight = 0;
    let maxInFlight = 0;

    const task = (g: Promise<void>): Promise<void> => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      return g.then(() => {
        inFlight -= 1;
      });
    };

    const a = gate();
    const b = gate();
    const p1 = run(() => task(a.promise));
    const p2 = run(() => task(b.promise));

    await flush();
    expect(inFlight).toBe(1);

    a.open();
    await flush();
    expect(inFlight).toBe(1);

    b.open();
    await Promise.all([p1, p2]);
    expect(maxInFlight).toBe(1);
  });
});
