/**
 * useRandomSelect Hook
 *
 * Provides random contestant selection functionality for the Dashboard.
 * Selects one random contestant from the non-eliminated pool.
 */

import type { Contestant } from '@types';

export function useRandomSelect() {
  /**
   * Selects a random contestant from the non-eliminated pool
   *
   * @param contestants - Array of all contestants
   * @returns Selected contestant or null if no eligible contestants
   */
  const randomSelect = (contestants: Contestant[]): Contestant | null => {
    // Filter to non-eliminated contestants
    const eligibleContestants = contestants.filter((c) => !c.eliminated);

    if (eligibleContestants.length === 0) {
      return null;
    }

    // Use Math.random() for random selection
    const randomIndex = Math.floor(Math.random() * eligibleContestants.length);
    const selected = eligibleContestants[randomIndex];

    return selected ?? null;
  };

  return { randomSelect };
}
