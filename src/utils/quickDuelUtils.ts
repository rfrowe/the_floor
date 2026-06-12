/**
 * Quick duel (exhibition match) logic.
 *
 * A quick duel is a one-off match between two existing players in a category.
 * Unlike a normal duel it does NOT affect game state beyond bragging rights:
 * the winner's win count is incremented, but there is no territory transfer,
 * no elimination, and no category-ownership change.
 */

import type { Contestant } from '@types';

/**
 * Records a quick-duel win by incrementing only the winner's win count.
 * All other fields (territory, elimination status, category) are preserved.
 *
 * @param winner - The contestant who won the quick duel
 * @returns A new contestant object with `wins` incremented by 1
 */
export function recordQuickDuelWin(winner: Contestant): Contestant {
  return {
    ...winner,
    wins: winner.wins + 1,
  };
}
