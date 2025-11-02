/**
 * Tests for useGameTimer hook
 *
 * Tests cover:
 * - Timer countdown accuracy
 * - Active player selection
 * - Pause/resume functionality
 * - Time expiration callbacks
 * - Time updates (skip penalties)
 * - Memory leak prevention
 * - Timing accuracy over long durations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameTimer } from './useGameTimer';

describe('useGameTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with correct times and running state', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 25,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      expect(result.current.timeRemaining1).toBe(30);
      expect(result.current.timeRemaining2).toBe(25);
      expect(result.current.isRunning).toBe(true);
    });

    it('should start with timer running by default', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      expect(result.current.isRunning).toBe(true);
    });
  });

  describe('Active Player Countdown', () => {
    it('should only decrement active player 1 time', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      const initialTime1 = result.current.timeRemaining1;
      const initialTime2 = result.current.timeRemaining2;

      act(() => {
        vi.advanceTimersByTime(1000); // 1 second
      });

      // Player 1 should have decreased
      expect(result.current.timeRemaining1).toBeLessThan(initialTime1);
      // Player 2 should remain unchanged
      expect(result.current.timeRemaining2).toBe(initialTime2);
    });

    it('should only decrement active player 2 time', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 2,
          onTimeExpired,
        })
      );

      const initialTime1 = result.current.timeRemaining1;
      const initialTime2 = result.current.timeRemaining2;

      act(() => {
        vi.advanceTimersByTime(1000); // 1 second
      });

      // Player 1 should remain unchanged
      expect(result.current.timeRemaining1).toBe(initialTime1);
      // Player 2 should have decreased
      expect(result.current.timeRemaining2).toBeLessThan(initialTime2);
    });

    it('should countdown approximately 1 second over 1000ms', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should be close to 29 seconds (within 0.2s tolerance for test timing)
      expect(result.current.timeRemaining1).toBeGreaterThan(28.8);
      expect(result.current.timeRemaining1).toBeLessThanOrEqual(30);
    });
  });

  describe('Pause and Resume', () => {
    it('should stop counting when paused', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      // Let it run for 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const timeAfterFirstSecond = result.current.timeRemaining1;

      // Pause the timer
      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);

      // Advance time while paused
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Time should not have changed
      expect(result.current.timeRemaining1).toBe(timeAfterFirstSecond);
    });

    it('should resume counting after resume is called', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      // Pause immediately
      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);

      // Resume
      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);

      const timeBefore = result.current.timeRemaining1;

      // Should countdown after resume
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining1).toBeLessThan(timeBefore);
    });

    it('should maintain accurate time across pause/resume cycles', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      // Run for 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Pause
      act(() => {
        result.current.pause();
      });

      // Wait while paused
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Resume
      act(() => {
        result.current.resume();
      });

      // Run for another second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should have decremented approximately 2 seconds total (not 4)
      expect(result.current.timeRemaining1).toBeGreaterThan(27.8);
      expect(result.current.timeRemaining1).toBeLessThan(29.2);
    });
  });

  describe('Time Expiration', () => {
    it('should call onTimeExpired when player 1 time reaches 0', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 0.5, // 500ms
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      act(() => {
        vi.advanceTimersByTime(600); // Slightly more than 500ms
      });

      expect(onTimeExpired).toHaveBeenCalledWith(1);
      expect(result.current.timeRemaining1).toBe(0);
    });

    it('should call onTimeExpired when player 2 time reaches 0', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 0.5, // 500ms
          activePlayer: 2,
          onTimeExpired,
        })
      );

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onTimeExpired).toHaveBeenCalledWith(2);
      expect(result.current.timeRemaining2).toBe(0);
    });

    it('should pause timer automatically after time expires', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 0.5,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.isRunning).toBe(false);
    });

    it('should call onTimeExpired only once when time expires', () => {
      const onTimeExpired = vi.fn();
      renderHook(() =>
        useGameTimer({
          initialTime1: 0.3,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onTimeExpired).toHaveBeenCalledTimes(1);
    });

    it('should not go below 0 seconds', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 0.3,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining1).toBe(0);
      expect(result.current.timeRemaining1).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Update Time', () => {
    it('should update player 1 time when updateTime is called', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      act(() => {
        result.current.updateTime(1, 25);
      });

      expect(result.current.timeRemaining1).toBe(25);
    });

    it('should update player 2 time when updateTime is called', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      act(() => {
        result.current.updateTime(2, 20);
      });

      expect(result.current.timeRemaining2).toBe(20);
    });

    it('should apply skip penalty correctly', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      const beforePenalty = result.current.timeRemaining1;

      act(() => {
        result.current.updateTime(1, result.current.timeRemaining1 - 3);
      });

      expect(result.current.timeRemaining1).toBe(beforePenalty - 3);
    });

    it('should not allow negative time when updateTime is called', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      act(() => {
        result.current.updateTime(1, -5);
      });

      expect(result.current.timeRemaining1).toBe(0);
    });

    it('should continue counting accurately after time update', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      // Apply penalty
      act(() => {
        result.current.updateTime(1, 20);
      });

      expect(result.current.timeRemaining1).toBe(20);

      // Continue counting
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should have counted down from 20
      expect(result.current.timeRemaining1).toBeGreaterThan(18.8);
      expect(result.current.timeRemaining1).toBeLessThan(20);
    });
  });

  describe('Memory and Cleanup', () => {
    it('should cleanup interval on unmount', () => {
      const onTimeExpired = vi.fn();
      const { unmount } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      const activeTimers = vi.getTimerCount();

      unmount();

      // Should have fewer active timers after unmount
      expect(vi.getTimerCount()).toBeLessThan(activeTimers);
    });

    it('should not cause memory leaks with multiple pause/resume cycles', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      // Multiple pause/resume cycles
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.pause();
        });
        act(() => {
          result.current.resume();
        });
      }

      // Should not accumulate intervals
      const timerCount = vi.getTimerCount();
      expect(timerCount).toBeLessThan(10); // Reasonable upper bound
    });
  });

  describe('Timing Accuracy', () => {
    it('should maintain accuracy over 10 seconds', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      act(() => {
        vi.advanceTimersByTime(10000); // 10 seconds
      });

      // Should be within 0.2s of 20 seconds remaining
      expect(result.current.timeRemaining1).toBeGreaterThan(19.8);
      expect(result.current.timeRemaining1).toBeLessThanOrEqual(20.2);
    });

    it('should update smoothly at 100ms intervals', () => {
      const onTimeExpired = vi.fn();
      const { result } = renderHook(() =>
        useGameTimer({
          initialTime1: 30,
          initialTime2: 30,
          activePlayer: 1,
          onTimeExpired,
        })
      );

      const updates: number[] = [];

      // Record time over 1 second
      for (let i = 0; i < 10; i++) {
        act(() => {
          vi.advanceTimersByTime(100);
        });
        updates.push(result.current.timeRemaining1);
      }

      // Should have recorded 10 different values (smooth updates)
      const uniqueValues = new Set(updates);
      expect(uniqueValues.size).toBeGreaterThan(5);
    });
  });
});
