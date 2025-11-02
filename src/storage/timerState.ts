/**
 * Timer state storage - separate from duelState to allow frequent updates
 * without triggering React re-renders of game components
 */

const TIMER_STATE_KEY = 'the-floor:timerState';

export interface TimerState {
  timeRemaining1: number;
  timeRemaining2: number;
  activePlayer: 1 | 2;
  lastUpdate: number; // timestamp for staleness detection
}

/**
 * Save current timer state to localStorage
 * Called frequently (every second) by MasterView
 */
export function saveTimerState(state: TimerState): void {
  try {
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save timer state:', error);
  }
}

/**
 * Load timer state from localStorage
 * Used by AudienceView to initialize its timer
 */
export function loadTimerState(): TimerState | null {
  try {
    const stored = localStorage.getItem(TIMER_STATE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as TimerState;
  } catch (error) {
    console.warn('Failed to load timer state:', error);
    return null;
  }
}

/**
 * Clear timer state from localStorage
 * Called when duel ends
 */
export function clearTimerState(): void {
  try {
    localStorage.removeItem(TIMER_STATE_KEY);
  } catch (error) {
    console.warn('Failed to clear timer state:', error);
  }
}
