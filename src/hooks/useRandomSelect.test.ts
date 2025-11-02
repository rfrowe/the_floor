/**
 * Tests for useRandomSelect hook
 */

import { describe, it, expect, vi } from 'vitest';
import { useRandomSelect } from './useRandomSelect';
import type { Contestant } from '@types';

// Helper function to create test contestants
function createContestant(id: string, name: string, eliminated: boolean): Contestant {
  return {
    id,
    name,
    category: { name: 'Test Category', slides: [] },
    wins: 0,
    eliminated,
  };
}

describe('useRandomSelect', () => {
  it('returns null when given an empty array', () => {
    const { randomSelect } = useRandomSelect();
    const result = randomSelect([]);
    expect(result).toBeNull();
  });

  it('returns null when all contestants are eliminated', () => {
    const { randomSelect } = useRandomSelect();
    const contestants = [
      createContestant('1', 'Alice', true),
      createContestant('2', 'Bob', true),
      createContestant('3', 'Charlie', true),
    ];
    const result = randomSelect(contestants);
    expect(result).toBeNull();
  });

  it('returns the only eligible contestant when only one is available', () => {
    const { randomSelect } = useRandomSelect();
    const eligible = createContestant('1', 'Alice', false);
    const contestants = [
      eligible,
      createContestant('2', 'Bob', true),
      createContestant('3', 'Charlie', true),
    ];
    const result = randomSelect(contestants);
    expect(result).toBe(eligible);
  });

  it('returns a contestant from the eligible pool', () => {
    const { randomSelect } = useRandomSelect();
    const eligible1 = createContestant('1', 'Alice', false);
    const eligible2 = createContestant('2', 'Bob', false);
    const contestants = [eligible1, eligible2, createContestant('3', 'Charlie', true)];
    const result = randomSelect(contestants);
    expect(result).not.toBeNull();
    expect([eligible1, eligible2]).toContain(result);
  });

  it('never returns an eliminated contestant', () => {
    const { randomSelect } = useRandomSelect();
    const eligible = createContestant('1', 'Alice', false);
    const eliminated = createContestant('2', 'Bob', true);
    const contestants = [eligible, eliminated];

    // Run multiple times to ensure consistency
    for (let i = 0; i < 10; i++) {
      const result = randomSelect(contestants);
      expect(result).toBe(eligible);
      expect(result).not.toBe(eliminated);
    }
  });

  it('has fair distribution over many calls', () => {
    const { randomSelect } = useRandomSelect();
    const contestant1 = createContestant('1', 'Alice', false);
    const contestant2 = createContestant('2', 'Bob', false);
    const contestant3 = createContestant('3', 'Charlie', false);
    const contestants = [contestant1, contestant2, contestant3];

    const counts = new Map<string, number>();
    counts.set('1', 0);
    counts.set('2', 0);
    counts.set('3', 0);

    // Run 3000 iterations
    const iterations = 3000;
    for (let i = 0; i < iterations; i++) {
      const result = randomSelect(contestants);
      if (result) {
        counts.set(result.id, (counts.get(result.id) ?? 0) + 1);
      }
    }

    // Each contestant should be selected roughly 1/3 of the time
    // Allow for 20% variance (should be between 800-1200 out of 3000)
    const expectedCount = iterations / 3;
    const tolerance = expectedCount * 0.2;

    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(expectedCount - tolerance);
      expect(count).toBeLessThan(expectedCount + tolerance);
    }
  });

  it('works with all contestants eligible', () => {
    const { randomSelect } = useRandomSelect();
    const contestants = [
      createContestant('1', 'Alice', false),
      createContestant('2', 'Bob', false),
      createContestant('3', 'Charlie', false),
      createContestant('4', 'David', false),
    ];

    const result = randomSelect(contestants);
    expect(result).not.toBeNull();
    expect(contestants).toContain(result);
  });

  it('handles Math.random edge case at boundary', () => {
    const { randomSelect } = useRandomSelect();
    const contestants = [
      createContestant('1', 'Alice', false),
      createContestant('2', 'Bob', false),
    ];

    // Mock Math.random to return values at boundaries
    const originalRandom = Math.random;

    // Test lower boundary (should select first contestant)
    vi.spyOn(Math, 'random').mockReturnValue(0);
    let result = randomSelect(contestants);
    expect(result).toBe(contestants[0]);

    // Test upper boundary (should select last contestant)
    vi.spyOn(Math, 'random').mockReturnValue(0.9999999);
    result = randomSelect(contestants);
    expect(result).toBe(contestants[1]);

    // Restore original Math.random
    Math.random = originalRandom;
  });
});
