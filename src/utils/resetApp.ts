/**
 * Utility for resetting all application state
 * Clears both IndexedDB (contestants) and localStorage (duel state, config, timer state, etc.)
 * Broadcasts reset event to all windows/tabs
 */

import { clearAllContestants, clearAllCategories } from '@/storage/indexedDB';
import { clear as clearLocalStorage } from '@/storage/localStorage';
import { clearTimerState } from '@/storage/timerState';
import { resetColorAssignments } from '@/utils/colorUtils';

const RESET_CHANNEL_NAME = 'the_floor_app_reset';

/**
 * Reset all application state
 * - Clears all contestants from IndexedDB
 * - Clears all categories from IndexedDB
 * - Clears all app data from localStorage (duel state, game config, etc.)
 * - Resets color assignments for contestants
 * - Broadcasts reset to all windows (triggers reload/redirect)
 * - Preserves user preferences like theme/dark mode
 *
 * @returns Promise that resolves when all storage is cleared
 * @throws Error if reset fails
 */
export async function resetAppState(): Promise<void> {
  try {
    // Clear IndexedDB (contestants with images)
    await clearAllContestants();

    // Clear IndexedDB (categories with slides)
    await clearAllCategories();

    // Clear duel state (stored directly in localStorage without prefix)
    localStorage.removeItem('duel');

    // Clear localStorage with prefix (game config, etc.)
    clearLocalStorage();

    // Clear timer state
    clearTimerState();

    // Reset color assignments
    resetColorAssignments();

    // Broadcast reset to all windows
    try {
      const channel = new BroadcastChannel(RESET_CHANNEL_NAME);
      channel.postMessage('reset');
      channel.close();
    } catch (error) {
      console.warn('BroadcastChannel not supported for app reset:', error);
    }

    // Note: 'theme' key is preserved (not prefixed, not explicitly removed)
  } catch (error) {
    console.error('Error resetting app state:', error);
    throw new Error(
      `Failed to reset application state: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Listen for app reset events from other windows
 * Returns cleanup function
 */
export function onAppReset(callback: () => void): () => void {
  try {
    const channel = new BroadcastChannel(RESET_CHANNEL_NAME);

    channel.onmessage = () => {
      callback();
    };

    return () => {
      channel.close();
    };
  } catch (error) {
    console.warn('BroadcastChannel not supported for reset listener:', error);
    return () => {
      // No-op cleanup
    };
  }
}
