/**
 * ClockBar Component
 * Displays both players' names, remaining time, and active player indicator
 * for the audience view during duels.
 */

import type { Contestant } from '@types';
import { formatTime } from '@utils/time';
import styles from './ClockBar.module.css';

export interface ClockBarProps {
  contestant1: Contestant | null;
  contestant2: Contestant | null;
  timeRemaining1: number;
  timeRemaining2: number;
  activePlayer: 1 | 2;
  categoryName: string;
  skipAnswer?: string; // When present, displays the answer in an overlay
}

/**
 * Determines if time is critically low (< 5s)
 */
function isCriticalTime(seconds: number): boolean {
  return seconds < 5;
}

/**
 * Determines if time is low (< 10s)
 */
function isLowTime(seconds: number): boolean {
  return seconds < 10;
}

export function ClockBar({
  contestant1,
  contestant2,
  timeRemaining1,
  timeRemaining2,
  activePlayer,
  categoryName,
  skipAnswer,
}: ClockBarProps) {
  const player1Active = activePlayer === 1;
  const player2Active = activePlayer === 2;

  // Extract class names for template literals
  const containerClass = styles['clock-bar'] ?? '';
  const timeoutClass = styles['timeout'] ?? '';
  const clockBarMainClass = styles['clock-bar-main'] ?? '';
  const playerSectionClass = styles['player-section'] ?? '';
  const activeClass = styles['active'] ?? '';
  const inactiveClass = styles['inactive'] ?? '';
  const playerNameClass = styles['player-name'] ?? '';
  const timeDisplayClass = styles['time-display'] ?? '';
  const lowTimeClass = styles['low-time'] ?? '';
  const criticalTimeClass = styles['critical-time'] ?? '';
  const centerIndicatorClass = styles['center-indicator'] ?? '';
  const indicatorTextClass = styles['indicator-text'] ?? '';

  // Check if either player has run out of time
  const hasTimeout = timeRemaining1 <= 0 || timeRemaining2 <= 0;

  // Determine time classes for each player
  const time1Class = isCriticalTime(timeRemaining1)
    ? criticalTimeClass
    : isLowTime(timeRemaining1)
      ? lowTimeClass
      : '';

  const time2Class = isCriticalTime(timeRemaining2)
    ? criticalTimeClass
    : isLowTime(timeRemaining2)
      ? lowTimeClass
      : '';

  return (
    <div className={`${containerClass} ${hasTimeout ? timeoutClass : ''}`.trim()}>
      <div className={clockBarMainClass}>
        {/* Player 1 Section */}
        <div
          className={`${playerSectionClass} ${player1Active ? activeClass : inactiveClass}`.trim()}
        >
          <div className={playerNameClass}>{contestant1?.name ?? '—'}</div>
          <div className={`${timeDisplayClass} ${time1Class}`.trim()}>
            {formatTime(timeRemaining1)}
          </div>
        </div>

        {/* Center - Category/Answer Display */}
        <div className={centerIndicatorClass}>
          <span className={indicatorTextClass}>{categoryName}</span>
        </div>

        {/* Player 2 Section */}
        <div
          className={`${playerSectionClass} ${player2Active ? activeClass : inactiveClass}`.trim()}
          style={{ justifyContent: 'flex-end' }}
        >
          <div className={`${timeDisplayClass} ${time2Class}`.trim()}>
            {formatTime(timeRemaining2)}
          </div>
          <div className={playerNameClass}>{contestant2?.name ?? '—'}</div>
        </div>
      </div>

      {/* Skip Answer Overlay */}
      {skipAnswer && (
        <div className={styles['skip-answer-overlay']}>
          <div className={styles['skip-answer-text']}>{skipAnswer}</div>
        </div>
      )}
    </div>
  );
}
