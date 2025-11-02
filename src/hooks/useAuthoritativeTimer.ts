/**
 * useAuthoritativeTimer Hook
 *
 * Authoritative timer implementation for Audience View.
 * This hook owns the game clock and is the source of truth for all timing.
 *
 * Key responsibilities:
 * - Run countdown timers for both players
 * - Broadcast timer updates every 100ms
 * - Execute skip animation timing (exactly 3.0 seconds)
 * - Detect and broadcast time expiration
 * - Handle all timer commands from Master View
 *
 * Based on Task 28.1 requirements.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import timerSyncService, { type TimerMessage } from '@services/timerSync';
import { saveTimerState } from '@storage/timerState';

const UPDATE_INTERVAL = 100; // 100ms = 0.1s display precision
const SKIP_DURATION = 3.0; // 3.0 seconds for skip animation
const PERSIST_INTERVAL_BROADCASTS = 10; // Save to localStorage every 10 broadcasts (1 second)

export interface AuthoritativeTimerOptions {
  /** Initial time for player 1 in seconds */
  initialTime1: number;

  /** Initial time for player 2 in seconds */
  initialTime2: number;

  /** Which player starts as active */
  initialActivePlayer: 1 | 2;

  /** Callback when a player's time expires */
  onPlayerTimeout: (loser: 1 | 2) => void;

  /** Callback when skip animation completes */
  onSkipEnd: (switchToPlayer: 1 | 2) => void;
}

export interface AuthoritativeTimerReturn {
  /** Current time for player 1 in seconds */
  time1: number;

  /** Current time for player 2 in seconds */
  time2: number;

  /** Currently active player */
  activePlayer: 1 | 2;

  /** Whether a skip animation is currently active */
  isSkipActive: boolean;

  /** The answer being shown during skip (if any) */
  skipAnswer: string | null;

  /** Whether the timer is running */
  isRunning: boolean;

  /** Manually start the timer (for resuming mid-duel) */
  startTimer: (player1Time: number, player2Time: number, activePlayer: 1 | 2) => void;
}

/**
 * Authoritative timer hook for Audience View
 * This hook is the single source of truth for game timing
 */
export function useAuthoritativeTimer(
  options: AuthoritativeTimerOptions
): AuthoritativeTimerReturn {
  const { initialTime1, initialTime2, initialActivePlayer, onPlayerTimeout, onSkipEnd } = options;

  // Timer state
  const [time1, setTime1] = useState(initialTime1);
  const [time2, setTime2] = useState(initialTime2);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(initialActivePlayer);
  const [isRunning, setIsRunning] = useState(false);

  // Skip animation state
  const [isSkipActive, setIsSkipActive] = useState(false);
  const [skipAnswer, setSkipAnswer] = useState<string | null>(null);
  const skipStartTimeRef = useRef<number>(0);
  const skipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track last update for accurate timing
  const lastUpdateRef = useRef<number>(Date.now());

  // Store callbacks in refs to avoid stale closures
  const onPlayerTimeoutRef = useRef(onPlayerTimeout);
  const onSkipEndRef = useRef(onSkipEnd);

  // Store current timer state in refs for broadcast (to avoid re-creating interval)
  const time1Ref = useRef(time1);
  const time2Ref = useRef(time2);
  const activePlayerRef = useRef(activePlayer);
  const handleSkipCompleteRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onPlayerTimeoutRef.current = onPlayerTimeout;
    onSkipEndRef.current = onSkipEnd;
  }, [onPlayerTimeout, onSkipEnd]);

  // Keep refs in sync with state
  useEffect(() => {
    time1Ref.current = time1;
    time2Ref.current = time2;
    activePlayerRef.current = activePlayer;
  }, [time1, time2, activePlayer]);

  /**
   * Handle time expiration for a player
   */
  const handleTimeout = useCallback((player: 1 | 2) => {
    console.log('[AuthTimer] Player timeout:', player);

    // Stop timer
    setIsRunning(false);

    // Broadcast timeout
    timerSyncService.broadcastPlayerTimeout(player);

    // Notify callback
    onPlayerTimeoutRef.current(player);
  }, []);

  /**
   * Handle skip animation end
   */
  const handleSkipComplete = useCallback(() => {
    console.log('[AuthTimer] Skip animation complete');

    // Get current times
    const currentTime1 = time1;
    const currentTime2 = time2;
    const currentActivePlayer = activePlayer;

    // Check if active player timed out during skip
    const activeTime = currentActivePlayer === 1 ? currentTime1 : currentTime2;

    if (activeTime <= 0) {
      // Player timed out during skip
      setIsSkipActive(false);
      setSkipAnswer(null);
      handleTimeout(currentActivePlayer);
    } else {
      // Switch to other player
      const nextPlayer = currentActivePlayer === 1 ? 2 : 1;

      setIsSkipActive(false);
      setSkipAnswer(null);
      setActivePlayer(nextPlayer);

      // Broadcast skip end
      timerSyncService.broadcastSkipEnd(nextPlayer);

      // Notify callback
      onSkipEndRef.current(nextPlayer);
    }
  }, [time1, time2, activePlayer, handleTimeout]);

  // Keep handleSkipComplete ref in sync (must be after function is defined)
  useEffect(() => {
    handleSkipCompleteRef.current = handleSkipComplete;
  }, [handleSkipComplete]);

  // ============================================================================
  // Command Handlers
  // ============================================================================

  const handleCommand = useCallback(
    (message: TimerMessage) => {
      switch (message.type) {
        case 'TIMER_START':
          console.log('[AuthTimer] START command', message);
          console.log('[AuthTimer] Setting times:', {
            time1: message.player1Time,
            time2: message.player2Time,
            activePlayer: message.activePlayer,
          });
          setTime1(message.player1Time);
          setTime2(message.player2Time);
          setActivePlayer(message.activePlayer);
          setIsRunning(true);
          lastUpdateRef.current = Date.now();
          console.log('[AuthTimer] Timer started, isRunning should now be true');
          break;

        case 'TIMER_PAUSE':
          console.log('[AuthTimer] PAUSE command');
          setIsRunning(false);
          break;

        case 'TIMER_RESUME':
          console.log('[AuthTimer] RESUME command', message);
          setActivePlayer(message.activePlayer);
          setIsRunning(true);
          lastUpdateRef.current = Date.now();
          break;

        case 'TIMER_SWITCH':
          console.log('[AuthTimer] SWITCH command', message);
          setActivePlayer(message.activePlayer);
          lastUpdateRef.current = Date.now();
          break;

        case 'SKIP_START':
          console.log('[AuthTimer] SKIP_START command', message);
          setIsSkipActive(true);
          setSkipAnswer(message.answer);
          skipStartTimeRef.current = Date.now();

          // Schedule skip end after exactly 3.0 seconds
          if (skipTimeoutRef.current) {
            clearTimeout(skipTimeoutRef.current);
          }

          skipTimeoutRef.current = setTimeout(() => {
            // Call via ref to get latest implementation
            if (handleSkipCompleteRef.current) {
              handleSkipCompleteRef.current();
            }
          }, SKIP_DURATION * 1000);
          break;

        case 'DUEL_END':
          console.log('[AuthTimer] DUEL_END command');
          setIsRunning(false);
          setIsSkipActive(false);
          setSkipAnswer(null);
          if (skipTimeoutRef.current) {
            clearTimeout(skipTimeoutRef.current);
            skipTimeoutRef.current = null;
          }
          break;

        case 'MASTER_PING':
          // Respond to ping with heartbeat
          timerSyncService.sendAudienceHeartbeat();
          break;
      }
    },
    [] // No dependencies - uses refs for dynamic values
  );

  // ============================================================================
  // Message Listener
  // ============================================================================

  useEffect(() => {
    console.log('[AuthTimer] Setting up message listener');

    const cleanup = timerSyncService.onMessage(handleCommand);

    return () => {
      cleanup();
    };
    // Only set up once on mount - handleCommand uses refs for dynamic values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // Heartbeat
  // ============================================================================

  useEffect(() => {
    console.log('[AuthTimer] Starting heartbeat');

    timerSyncService.startAudienceHeartbeat();

    return () => {
      timerSyncService.stopAudienceHeartbeat();
    };
  }, []);

  // ============================================================================
  // Timer Countdown Loop
  // ============================================================================

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    console.log('[AuthTimer] Starting countdown loop');

    lastUpdateRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastUpdateRef.current) / 1000; // Convert to seconds

      // Update active player's time
      if (activePlayer === 1) {
        setTime1((prev) => {
          const newTime = Math.max(0, prev - elapsed);

          // Check for timeout
          if (newTime === 0 && prev > 0) {
            handleTimeout(1);
          }

          return newTime;
        });
      } else {
        setTime2((prev) => {
          const newTime = Math.max(0, prev - elapsed);

          // Check for timeout
          if (newTime === 0 && prev > 0) {
            handleTimeout(2);
          }

          return newTime;
        });
      }

      lastUpdateRef.current = now;
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning, activePlayer, handleTimeout]);

  // ============================================================================
  // Broadcast Timer Updates & Save State
  // ============================================================================

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    let broadcastCount = 0;

    // Broadcast every 100ms - read current values from refs (no effect dependencies)
    const interval = setInterval(() => {
      timerSyncService.broadcastTimerUpdate(
        time1Ref.current,
        time2Ref.current,
        activePlayerRef.current
      );

      // Save to localStorage periodically
      broadcastCount++;
      if (broadcastCount >= PERSIST_INTERVAL_BROADCASTS) {
        saveTimerState({
          timeRemaining1: time1Ref.current,
          timeRemaining2: time2Ref.current,
          activePlayer: activePlayerRef.current,
          lastUpdate: Date.now(),
        });
        broadcastCount = 0;
      }
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(interval);
    };
    // Only re-create interval when running state changes
  }, [isRunning]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Manually start the timer (for resuming mid-duel)
   * This is used when Audience View opens mid-duel and needs to resume
   */
  const startTimer = useCallback(
    (player1Time: number, player2Time: number, newActivePlayer: 1 | 2) => {
      console.log('[AuthTimer] Manual start called', {
        player1Time,
        player2Time,
        activePlayer: newActivePlayer,
      });
      setTime1(player1Time);
      setTime2(player2Time);
      setActivePlayer(newActivePlayer);
      setIsRunning(true);
      lastUpdateRef.current = Date.now();
    },
    []
  );

  return {
    time1,
    time2,
    activePlayer,
    isSkipActive,
    skipAnswer,
    isRunning,
    startTimer,
  };
}
