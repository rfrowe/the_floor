/**
 * useGameTimer Hook
 *
 * Manages countdown timers for both players with accurate timing, pause/resume,
 * and time expiration callbacks. Uses high-precision timestamps to prevent drift.
 *
 * Based on Task 15 requirements.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Options for configuring the game timer
 */
export interface GameTimerOptions {
  /** Initial time for player 1 in seconds */
  initialTime1: number;

  /** Initial time for player 2 in seconds */
  initialTime2: number;

  /** Which player is currently active (1 or 2) */
  activePlayer: 1 | 2;

  /** Callback triggered when a player's time reaches 0 */
  onTimeExpired: (player: 1 | 2) => void;
}

/**
 * Return value from the useGameTimer hook
 */
export interface GameTimerReturn {
  /** Remaining time for player 1 in seconds */
  timeRemaining1: number;

  /** Remaining time for player 2 in seconds */
  timeRemaining2: number;

  /** Whether the timer is currently running */
  isRunning: boolean;

  /** Pause the timer */
  pause: () => void;

  /** Resume the timer */
  resume: () => void;

  /** Update a player's time (e.g., for skip penalties) */
  updateTime: (player: 1 | 2, newTime: number) => void;
}

/**
 * Game timer hook that manages countdown timers for both players
 *
 * Features:
 * - Counts down for active player only
 * - Updates every 100ms for smooth display
 * - Pause/resume functionality
 * - Time expiration callbacks
 * - Accurate timing with minimal drift (within 0.1s)
 *
 * @param options - Timer configuration options
 * @returns Timer state and control functions
 *
 * @example
 * ```tsx
 * const timer = useGameTimer({
 *   initialTime1: 30,
 *   initialTime2: 30,
 *   activePlayer: 1,
 *   onTimeExpired: (player) => {
 *     console.log(`Player ${player} ran out of time!`);
 *   },
 * });
 *
 * // Display time
 * <div>Player 1: {timer.timeRemaining1.toFixed(1)}s</div>
 *
 * // Control timer
 * <button onClick={timer.pause}>Pause</button>
 * <button onClick={timer.resume}>Resume</button>
 *
 * // Apply skip penalty
 * timer.updateTime(1, timer.timeRemaining1 - 3);
 * ```
 */
export function useGameTimer(options: GameTimerOptions): GameTimerReturn {
  const { initialTime1, initialTime2, activePlayer, onTimeExpired } = options;

  // Timer state
  const [timeRemaining1, setTimeRemaining1] = useState(initialTime1);
  const [timeRemaining2, setTimeRemaining2] = useState(initialTime2);
  const [isRunning, setIsRunning] = useState(true);

  // Track previous initial times to detect significant changes (for storage sync)
  const prevInitialTime1Ref = useRef(initialTime1);
  const prevInitialTime2Ref = useRef(initialTime2);

  // Reinitialize timer state when initial times change significantly
  // This handles both initial load and cross-window sync updates
  useEffect(() => {
    console.log('[useGameTimer] Checking reinit:', {
      initialTime1: initialTime1.toFixed(1),
      initialTime2: initialTime2.toFixed(1),
      prevInitialTime1: prevInitialTime1Ref.current.toFixed(1),
      prevInitialTime2: prevInitialTime2Ref.current.toFixed(1),
    });

    const time1Changed = Math.abs(initialTime1 - prevInitialTime1Ref.current) > 0.5;
    const time2Changed = Math.abs(initialTime2 - prevInitialTime2Ref.current) > 0.5;

    // Update if times changed significantly (more than 0.5s difference)
    // This prevents constant reinitialization from 200ms polling updates
    if (time1Changed || time2Changed) {
      console.log('[useGameTimer] REINITIALIZING with:', {
        initialTime1: initialTime1.toFixed(1),
        initialTime2: initialTime2.toFixed(1),
      });
      setTimeRemaining1(initialTime1);
      setTimeRemaining2(initialTime2);
      prevInitialTime1Ref.current = initialTime1;
      prevInitialTime2Ref.current = initialTime2;
    }
  }, [initialTime1, initialTime2]);

  // Track last update timestamp for accurate timing
  const lastUpdateRef = useRef<number>(Date.now());

  // Store interval ID for cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Store onTimeExpired callback in ref to avoid stale closures
  const onTimeExpiredRef = useRef(onTimeExpired);
  useEffect(() => {
    onTimeExpiredRef.current = onTimeExpired;
  }, [onTimeExpired]);

  // Pause the timer
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // Resume the timer
  const resume = useCallback(() => {
    if (!isRunning) {
      lastUpdateRef.current = Date.now();
      setIsRunning(true);
    }
  }, [isRunning]);

  // Update a player's time (for skip penalties or other adjustments)
  const updateTime = useCallback((player: 1 | 2, newTime: number) => {
    const clampedTime = Math.max(0, newTime);

    if (player === 1) {
      setTimeRemaining1(clampedTime);
    } else {
      setTimeRemaining2(clampedTime);
    }

    // Reset last update timestamp to prevent drift
    lastUpdateRef.current = Date.now();
  }, []);

  // Main timer effect
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    // Reset timestamp when starting or when activePlayer changes
    lastUpdateRef.current = Date.now();

    // Update timer every 100ms for smooth display
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastUpdateRef.current) / 1000; // Convert to seconds

      // Update active player's time only
      if (activePlayer === 1) {
        setTimeRemaining1((prev) => {
          const newTime = Math.max(0, prev - elapsed);

          // Check for time expiration
          if (newTime === 0 && prev > 0) {
            // Time just expired
            pause();
            onTimeExpiredRef.current(1);
          }

          return newTime;
        });
      } else {
        setTimeRemaining2((prev) => {
          const newTime = Math.max(0, prev - elapsed);

          // Check for time expiration
          if (newTime === 0 && prev > 0) {
            // Time just expired
            pause();
            onTimeExpiredRef.current(2);
          }

          return newTime;
        });
      }

      // Update last update timestamp
      lastUpdateRef.current = now;
    }, 100);

    intervalRef.current = interval;

    // Cleanup on unmount or when isRunning changes
    return () => {
      clearInterval(interval);
    };
  }, [isRunning, activePlayer, pause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining1,
    timeRemaining2,
    isRunning,
    pause,
    resume,
    updateTime,
  };
}
