/**
 * Utility for resetting all application state
 * Clears both IndexedDB (contestants) and localStorage (duel state, config, timer state, etc.)
 */

import { clearAllContestants } from '@/storage/indexedDB';
import { clear as clearLocalStorage } from '@/storage/localStorage';
import { clearTimerState } from '@/storage/timerState';

/**
 * Reset all application state
 * - Clears all contestants from IndexedDB
 * - Clears all app data from localStorage (duel state, game config, etc.)
 *
 * @returns Promise that resolves when all storage is cleared
 * @throws Error if reset fails
 */
export async function resetAppState(): Promise<void> {
  try {
    // Clear IndexedDB (contestants with images)
    await clearAllContestants();

    // Clear localStorage (duel state, game config, etc.)
    clearLocalStorage();

    // Clear timer state
    clearTimerState();
  } catch (error) {
    console.error('Error resetting app state:', error);
    throw new Error(
      `Failed to reset application state: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
