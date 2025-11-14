/**
 * Duel utilities for determining contestant eligibility
 */

import type { Contestant } from '@types';
import { getAdjacentContestants } from './gridUtils';

/**
 * Check if a contestant is eligible for a duel
 * A contestant is eligible if:
 * - Not eliminated
 * - Has controlled squares on the grid
 */
export function isDuelEligible(contestant: Contestant): boolean {
  return (
    !contestant.eliminated &&
    Boolean(contestant.controlledSquares && contestant.controlledSquares.length > 0)
  );
}

/**
 * Get all duel-eligible contestants from a list
 */
export function getDuelEligibleContestants(contestants: Contestant[]): Contestant[] {
  return contestants.filter(isDuelEligible);
}

/**
 * Check if there are enough contestants for a duel
 */
export function canStartDuel(contestants: Contestant[]): boolean {
  return getDuelEligibleContestants(contestants).length >= 2;
}

/**
 * Check if two specific contestants can duel each other
 * Requirements:
 * - Both must be individually eligible (not eliminated, have territory)
 * - Their territories must be adjacent on the grid (share an edge)
 *
 * @param contestant1 - First contestant
 * @param contestant2 - Second contestant
 * @param allContestants - All contestants in the game (needed for adjacency calculation)
 * @returns true if the two contestants can duel each other
 */
export function canContestantsDuel(
  contestant1: Contestant,
  contestant2: Contestant,
  allContestants: Contestant[]
): boolean {
  // Both must be individually eligible
  if (!isDuelEligible(contestant1) || !isDuelEligible(contestant2)) {
    return false;
  }

  // Check if they are adjacent
  const adjacentToContestant1 = getAdjacentContestants(contestant1, allContestants);
  return adjacentToContestant1.some((c) => c.id === contestant2.id);
}
