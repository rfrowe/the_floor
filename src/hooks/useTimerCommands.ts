/**
 * useTimerCommands Hook
 *
 * Command interface for Master View to control the authoritative timer.
 * This hook sends commands to Audience View and displays current time received
 * from broadcasts.
 *
 * Key responsibilities:
 * - Send timer control commands (start, pause, resume, skip)
 * - Receive and display timer updates from Audience View
 * - Track current timer state for display only (not authoritative)
 *
 * Based on Task 28.1 requirements.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import timerSyncService, { type TimerMessage } from '@services/timerSync';
import { createLogger } from '@/utils/logger';

export interface TimerCommandsOptions {
  /** Callback when a player's time expires (from Audience broadcast) */
  onPlayerTimeout?: (loser: 1 | 2) => void;

  /** Callback when skip animation completes (from Audience broadcast) */
  onSkipEnd?: (switchToPlayer: 1 | 2) => void;
}

export interface TimerCommandsReturn {
  /** Current time for player 1 (from Audience broadcasts) */
  currentTime1: number;

  /** Current time for player 2 (from Audience broadcasts) */
  currentTime2: number;

  /** Current active player (from Audience broadcasts) */
  currentActivePlayer: 1 | 2;

  /** Whether skip animation is active */
  isSkipActive: boolean;

  /** Send START command to Audience */
  sendStart: (player1Time: number, player2Time: number, activePlayer: 1 | 2) => void;

  /** Send PAUSE command to Audience */
  sendPause: () => void;

  /** Send RESUME command to Audience */
  sendResume: (activePlayer: 1 | 2) => void;

  /** Send SWITCH command to Audience */
  sendSwitch: (activePlayer: 1 | 2) => void;

  /** Send SKIP_START command to Audience */
  sendSkipStart: (answer: string, activePlayer: 1 | 2) => void;

  /** Send DUEL_END command to Audience */
  sendDuelEnd: () => void;
}

const log = createLogger('TimerCommands');

/**
 * Timer commands hook for Master View
 * Sends commands and displays state received from Audience View
 */
export function useTimerCommands(options: TimerCommandsOptions = {}): TimerCommandsReturn {
  const { onPlayerTimeout, onSkipEnd } = options;

  // Display state (received from Audience broadcasts)
  const [currentTime1, setCurrentTime1] = useState(0);
  const [currentTime2, setCurrentTime2] = useState(0);
  const [currentActivePlayer, setCurrentActivePlayer] = useState<1 | 2>(1);
  const [isSkipActive, setIsSkipActive] = useState(false);

  // Store callbacks in refs to avoid stale closures
  const onPlayerTimeoutRef = useRef(onPlayerTimeout);
  const onSkipEndRef = useRef(onSkipEnd);

  useEffect(() => {
    onPlayerTimeoutRef.current = onPlayerTimeout;
    onSkipEndRef.current = onSkipEnd;
  }, [onPlayerTimeout, onSkipEnd]);

  /**
   * Handle messages from Audience View
   */
  const handleMessage = useCallback((message: TimerMessage) => {
    switch (message.type) {
      case 'TIMER_UPDATE':
        // Update display state from Audience broadcast
        setCurrentTime1(message.time1);
        setCurrentTime2(message.time2);
        setCurrentActivePlayer(message.activePlayer);
        break;

      case 'SKIP_END':
        log.debug('Skip ended, switching to player', message.switchToPlayer);
        setIsSkipActive(false);
        setCurrentActivePlayer(message.switchToPlayer);

        // Notify callback
        if (onSkipEndRef.current) {
          onSkipEndRef.current(message.switchToPlayer);
        }
        break;

      case 'PLAYER_TIMEOUT':
        log.debug('Player timeout:', message.loser);

        // Notify callback
        if (onPlayerTimeoutRef.current) {
          onPlayerTimeoutRef.current(message.loser);
        }
        break;
    }
  }, []);

  // ============================================================================
  // Message Listener
  // ============================================================================

  useEffect(() => {
    log.debug('Setting up message listener');

    const cleanup = timerSyncService.onMessage(handleMessage);

    return () => {
      cleanup();
    };
  }, [handleMessage]);

  // ============================================================================
  // Command Senders
  // ============================================================================

  const sendStart = useCallback((player1Time: number, player2Time: number, activePlayer: 1 | 2) => {
    log.debug('Sending START command', {
      player1Time,
      player2Time,
      activePlayer,
    });

    // Initialize display state
    setCurrentTime1(player1Time);
    setCurrentTime2(player2Time);
    setCurrentActivePlayer(activePlayer);
    setIsSkipActive(false);

    // Send command to Audience
    timerSyncService.sendStart(player1Time, player2Time, activePlayer);
  }, []);

  const sendPause = useCallback(() => {
    log.debug('Sending PAUSE command');
    timerSyncService.sendPause();
  }, []);

  const sendResume = useCallback((activePlayer: 1 | 2) => {
    log.debug('Sending RESUME command', { activePlayer });
    setCurrentActivePlayer(activePlayer);
    timerSyncService.sendResume(activePlayer);
  }, []);

  const sendSwitch = useCallback((activePlayer: 1 | 2) => {
    log.debug('Sending SWITCH command', { activePlayer });
    setCurrentActivePlayer(activePlayer);
    timerSyncService.sendSwitch(activePlayer);
  }, []);

  const sendSkipStart = useCallback((answer: string, activePlayer: 1 | 2) => {
    log.debug('Sending SKIP_START command', { answer, activePlayer });
    setIsSkipActive(true);
    timerSyncService.sendSkipStart(answer, activePlayer);
  }, []);

  const sendDuelEnd = useCallback(() => {
    log.debug('Sending DUEL_END command');
    setIsSkipActive(false);
    timerSyncService.sendDuelEnd();
  }, []);

  return {
    currentTime1,
    currentTime2,
    currentActivePlayer,
    isSkipActive,
    sendStart,
    sendPause,
    sendResume,
    sendSwitch,
    sendSkipStart,
    sendDuelEnd,
  };
}
