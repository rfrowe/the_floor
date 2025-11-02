/**
 * Tests for useDuelState hook
 * Note: These tests verify the storage mechanism works correctly.
 * Hydration from IndexedDB is tested separately in integration tests.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { DuelState } from '@types';
import { useDuelState } from './useDuelState';
import * as indexedDB from '@/storage/indexedDB';

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

  it('should handle hydration when contestants are found in IndexedDB', async () => {
    const mockContestant1 = {
      id: 'alice-test',
      name: 'Alice',
      category: { name: 'Math', slides: [] },
      wins: 0,
      eliminated: false,
    };

    const mockContestant2 = {
      id: 'bob-test',
      name: 'Bob',
      category: { name: 'Science', slides: [] },
      wins: 0,
      eliminated: false,
    };

    // Pre-populate localStorage with a reference
    localStorage.setItem(
      'duel',
      JSON.stringify({
        contestant1Id: 'alice-test',
        contestant2Id: 'bob-test',
        selectedCategoryName: 'Math',
        activePlayer: 1,
        timeRemaining1: 25,
        timeRemaining2: 30,
        currentSlideIndex: 2,
        isSkipAnimationActive: false,
      })
    );

    // Mock IndexedDB to return contestants
    vi.mocked(indexedDB.getContestantById).mockImplementation((id: string) => {
      if (id === 'alice-test') return Promise.resolve(mockContestant1);
      if (id === 'bob-test') return Promise.resolve(mockContestant2);
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useDuelState());

    // Wait for hydration to complete
    await waitFor(() => {
      expect(result.current[0]).not.toBeNull();
    });

    expect(result.current[0]?.contestant1).toEqual(mockContestant1);
    expect(result.current[0]?.contestant2).toEqual(mockContestant2);
    expect(result.current[0]?.selectedCategory.name).toBe('Math');
    expect(result.current[0]?.currentSlideIndex).toBe(2);
  });

  it('should handle hydration failure when contestants not found in IndexedDB', async () => {
    // Pre-populate localStorage with a reference
    localStorage.setItem(
      'duel',
      JSON.stringify({
        contestant1Id: 'alice-test',
        contestant2Id: 'bob-test',
        selectedCategoryName: 'Math',
        activePlayer: 1,
        timeRemaining1: 25,
        timeRemaining2: 30,
        currentSlideIndex: 2,
        isSkipAnimationActive: false,
      })
    );

    // Mock IndexedDB to return null (contestants not found)
    vi.mocked(indexedDB.getContestantById).mockResolvedValue(null);

    const { result } = renderHook(() => useDuelState());

    // Wait for loading to complete
    await waitFor(() => {
      // Should remain null when hydration fails
      expect(result.current[0]).toBeNull();
    });
  });

  it('should handle hydration error when IndexedDB throws', async () => {
    // Pre-populate localStorage with a reference
    localStorage.setItem(
      'duel',
      JSON.stringify({
        contestant1Id: 'alice-test',
        contestant2Id: 'bob-test',
        selectedCategoryName: 'Math',
        activePlayer: 1,
        timeRemaining1: 25,
        timeRemaining2: 30,
        currentSlideIndex: 2,
        isSkipAnimationActive: false,
      })
    );

    // Mock IndexedDB to throw an error
    vi.mocked(indexedDB.getContestantById).mockRejectedValue(new Error('IndexedDB error'));

    const { result } = renderHook(() => useDuelState());

    // Wait for loading to complete
    await waitFor(() => {
      // Should remain null when hydration fails
      expect(result.current[0]).toBeNull();
    });
  });

  it('should handle malformed JSON in localStorage', async () => {
    // Pre-populate localStorage with invalid JSON
    localStorage.setItem('duel', 'invalid json {');

    const { result } = renderHook(() => useDuelState());

    // Wait for loading to complete
    await waitFor(() => {
      // Should remain null when JSON parsing fails
      expect(result.current[0]).toBeNull();
    });
  });

  it('should handle localStorage.setItem errors gracefully', async () => {
    const { result } = renderHook(() => useDuelState());

    await waitFor(() => {
      expect(result.current[0]).toBeNull();
    });

    // Mock localStorage.setItem to throw (e.g., quota exceeded)
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

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

    // Should not throw, but still update state in memory
    act(() => {
      result.current[1](duelState);
    });

    expect(result.current[0]).toEqual(duelState);

    // Restore original setItem
    setItemSpy.mockRestore();
  });
});
