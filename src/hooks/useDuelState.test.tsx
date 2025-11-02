/**
 * Tests for useDuelState hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { DuelState } from '@types';
import { useDuelState } from './useDuelState';

describe('useDuelState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with null', () => {
    const { result } = renderHook(() => useDuelState());
    expect(result.current[0]).toBeNull();
  });

  it('should store and retrieve duel state', () => {
    const { result } = renderHook(() => useDuelState());

    const duelState: DuelState = {
      contestant1: {
        id: 'alice-test',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
      },
      contestant2: {
        id: 'bob-test',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
      },
      activePlayer: 1,
      timeRemaining1: 30,
      timeRemaining2: 30,
      currentSlideIndex: 0,
      selectedCategory: { name: 'Math', slides: [] },
      isSkipAnimationActive: false,
    };

    act(() => {
      result.current[1](duelState);
    });

    expect(result.current[0]).toEqual(duelState);
    expect(localStorage.getItem('the-floor:duel')).toBe(JSON.stringify(duelState));
  });

  it('should persist duel state across remounts', () => {
    const duelState: DuelState = {
      contestant1: {
        id: 'alice-test',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
      },
      contestant2: {
        id: 'bob-test',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
      },
      activePlayer: 2,
      timeRemaining1: 15,
      timeRemaining2: 20,
      currentSlideIndex: 5,
      selectedCategory: { name: 'Science', slides: [] },
      isSkipAnimationActive: true,
    };

    localStorage.setItem('the-floor:duel', JSON.stringify(duelState));

    const { result } = renderHook(() => useDuelState());
    expect(result.current[0]).toEqual(duelState);
  });

  it('should support clearing duel state', () => {
    const { result } = renderHook(() => useDuelState());

    const duelState: DuelState = {
      contestant1: {
        id: 'alice-test',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
      },
      contestant2: {
        id: 'bob-test',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
      },
      activePlayer: 1,
      timeRemaining1: 30,
      timeRemaining2: 30,
      currentSlideIndex: 0,
      selectedCategory: { name: 'Math', slides: [] },
      isSkipAnimationActive: false,
    };

    act(() => {
      result.current[1](duelState);
    });

    expect(result.current[0]).not.toBeNull();

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
    expect(localStorage.getItem('the-floor:duel')).toBe(JSON.stringify(null));
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useDuelState());

    const initialDuel: DuelState = {
      contestant1: {
        id: 'alice-test',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
      },
      contestant2: {
        id: 'bob-test',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
      },
      activePlayer: 1,
      timeRemaining1: 30,
      timeRemaining2: 30,
      currentSlideIndex: 0,
      selectedCategory: { name: 'Math', slides: [] },
      isSkipAnimationActive: false,
    };

    act(() => {
      result.current[1](initialDuel);
    });

    act(() => {
      result.current[1]((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          activePlayer: 2 as const,
          currentSlideIndex: prev.currentSlideIndex + 1,
        };
      });
    });

    expect(result.current[0]?.activePlayer).toBe(2);
    expect(result.current[0]?.currentSlideIndex).toBe(1);
  });
});
