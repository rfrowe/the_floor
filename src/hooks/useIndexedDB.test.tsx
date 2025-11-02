/**
 * Tests for useContestants hook (IndexedDB integration)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useContestants } from './useIndexedDB';
import { clearAllContestants } from '@storage/indexedDB';
import type { Contestant } from '@types';

describe('useContestants', () => {
  const testContestant1: Contestant = {
    id: 'test-1',
    name: 'Alice',
    category: {
      name: 'Math',
      slides: [
        {
          imageUrl: 'data:image/jpeg;base64,test',
          answer: '42',
          censorBoxes: [],
        },
      ],
    },
    wins: 0,
    eliminated: false,
  };

  const testContestant2: Contestant = {
    id: 'test-2',
    name: 'Bob',
    category: {
      name: 'Science',
      slides: [],
    },
    wins: 2,
    eliminated: false,
  };

  beforeEach(async () => {
    // Clear IndexedDB before each test
    await clearAllContestants();
  });

  it('should initialize with empty array', async () => {
    const { result } = renderHook(() => useContestants());

    await waitFor(() => {
      expect(result.current[0]).toEqual([]);
    });
  });

  it('should add contestant and update state', async () => {
    const { result } = renderHook(() => useContestants());

    await waitFor(() => {
      expect(result.current[0]).toEqual([]);
    });

    await act(async () => {
      await result.current[1].add(testContestant1);
    });

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(1);
      expect(result.current[0][0]).toEqual(testContestant1);
    });
  });

  it('should add multiple contestants', async () => {
    const { result } = renderHook(() => useContestants());

    await act(async () => {
      await result.current[1].add(testContestant1);
      await result.current[1].add(testContestant2);
    });

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(2);
    });
  });

  it('should update contestant', async () => {
    const { result } = renderHook(() => useContestants());

    await act(async () => {
      await result.current[1].add(testContestant1);
    });

    const updated: Contestant = {
      ...testContestant1,
      wins: 5,
    };

    await act(async () => {
      await result.current[1].update(updated);
    });

    await waitFor(() => {
      expect(result.current[0][0]?.wins).toBe(5);
    });
  });

  it('should remove contestant', async () => {
    const { result } = renderHook(() => useContestants());

    await act(async () => {
      await result.current[1].add(testContestant1);
      await result.current[1].add(testContestant2);
    });

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(2);
    });

    await act(async () => {
      await result.current[1].remove('test-1');
    });

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(1);
      expect(result.current[0][0]?.id).toBe('test-2');
    });
  });

  it('should refresh contestants from IndexedDB', async () => {
    const { result } = renderHook(() => useContestants());

    await act(async () => {
      await result.current[1].add(testContestant1);
    });

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(1);
    });

    // Manually clear state (simulate external change)
    await act(async () => {
      await result.current[1].refresh();
    });

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(1);
      expect(result.current[0][0]).toEqual(testContestant1);
    });
  });

  it('should persist across remounts', async () => {
    const { result: result1, unmount } = renderHook(() => useContestants());

    await act(async () => {
      await result1.current[1].add(testContestant1);
    });

    await waitFor(() => {
      expect(result1.current[0]).toHaveLength(1);
    });

    // Unmount and remount
    unmount();

    const { result: result2 } = renderHook(() => useContestants());

    await waitFor(() => {
      expect(result2.current[0]).toHaveLength(1);
      expect(result2.current[0][0]).toEqual(testContestant1);
    });
  });

  it('should handle errors when adding contestant', async () => {
    const { result } = renderHook(() => useContestants());

    const invalidContestant = {
      name: 'Invalid',
      // Missing id field
    } as unknown as Contestant;

    await act(async () => {
      await expect(result.current[1].add(invalidContestant)).rejects.toThrow();
    });
  });

  it('should maintain state consistency during concurrent operations', async () => {
    const { result } = renderHook(() => useContestants());

    await act(async () => {
      await Promise.all([
        result.current[1].add(testContestant1),
        result.current[1].add(testContestant2),
      ]);
    });

    await waitFor(() => {
      expect(result.current[0]).toHaveLength(2);
    });
  });
});
