/**
 * Territory consolidation logic for the grid view floor
 * Handles combining territories when a contestant wins a duel
 */

import type { Contestant } from '@types';

/**
 * Consolidates territories after a duel.
 * Winner absorbs all of loser's squares.
 * Loser is eliminated and loses all squares.
 *
 * @param winner - The contestant who won the duel
 * @param loser - The contestant who lost the duel
 * @param allContestants - The full list of contestants
 * @returns Updated list of contestants with consolidated territories
 */
export function consolidateTerritories(
  winner: Contestant,
  loser: Contestant,
  allContestants: Contestant[]
): Contestant[] {
  // Winner absorbs all of loser's squares
  const updatedWinner: Contestant = {
    ...winner,
    controlledSquares: [...(winner.controlledSquares ?? []), ...(loser.controlledSquares ?? [])],
    wins: winner.wins + 1,
  };

  // Loser is eliminated and loses all territory
  const updatedLoser: Contestant = {
    ...loser,
    eliminated: true,
    controlledSquares: [], // No longer controls any squares
  };

  // Update contestant list
  return allContestants.map((c) => {
    if (c.id === winner.id) {
      return updatedWinner;
    }
    if (c.id === loser.id) {
      return updatedLoser;
    }
    return c;
  });
}
