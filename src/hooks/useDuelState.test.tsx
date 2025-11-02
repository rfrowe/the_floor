/**
 * Tests for useDuelState hook
 * Note: These tests verify the storage mechanism works correctly.
 * Hydration from IndexedDB is tested separately in integration tests.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { DuelState } from '@types';
import { useDuelState } from './useDuelState';

// Mock IndexedDB functions
vi.mock('@/storage/indexedDB', () => ({
  getContestantById: vi.fn(),
}));

describe('useDuelState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with null', async () => {
    const { result } = renderHook(() => useDuelState());
    await waitFor(() => {
      expect(result.current[0]).toBeNull();
    });
  });

  it('should store duel state and save reference to localStorage', async () => {
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

    await waitFor(() => {
      expect(result.current[0]).toBeNull();
    });

    act(() => {
      result.current[1](duelState);
    });

    // Check that state is updated
    expect(result.current[0]).toEqual(duelState);

    // Check that localStorage contains reference (not full objects)
    const stored = localStorage.getItem('duel');
    expect(stored).toBeTruthy();

    if (stored) {
      const reference = JSON.parse(stored) as Record<string, unknown>;
      expect(reference['contestant1Id']).toBe('alice-test');
      expect(reference['contestant2Id']).toBe('bob-test');
      expect(reference['selectedCategoryName']).toBe('Math');
      // Should not contain full contestant objects
      expect(reference['contestant1']).toBeUndefined();
      expect(reference['contestant2']).toBeUndefined();
    }
  });

  it('should clear duel state from both memory and localStorage', async () => {
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

    await waitFor(() => {
      expect(result.current[0]).toBeNull();
    });

    act(() => {
      result.current[1](duelState);
    });

    expect(result.current[0]).toEqual(duelState);

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
    expect(localStorage.getItem('duel')).toBeNull();
  });
});
