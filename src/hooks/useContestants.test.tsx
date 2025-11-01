/**
 * Tests for useContestants hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Contestant } from '@types';
import { useContestants } from './useContestants';

describe('useContestants', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty array', () => {
    const { result } = renderHook(() => useContestants());
    expect(result.current[0]).toEqual([]);
  });

  it('should store and retrieve contestants', () => {
    const { result } = renderHook(() => useContestants());

    const contestants: Contestant[] = [
      {
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
      },
      {
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 1,
        eliminated: false,
      },
    ];

    act(() => {
      result.current[1](contestants);
    });

    expect(result.current[0]).toEqual(contestants);
    expect(localStorage.getItem('the-floor:contestants')).toBe(JSON.stringify(contestants));
  });

  it('should persist contestants across remounts', () => {
    const contestants: Contestant[] = [
      {
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 2,
        eliminated: false,
      },
    ];

    const { unmount } = renderHook(() => useContestants());
    unmount();

    localStorage.setItem('the-floor:contestants', JSON.stringify(contestants));

    const { result } = renderHook(() => useContestants());
    expect(result.current[0]).toEqual(contestants);
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useContestants());

    const initialContestants: Contestant[] = [
      {
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
      },
    ];

    act(() => {
      result.current[1](initialContestants);
    });

    act(() => {
      result.current[1]((prev) => [
        ...prev,
        {
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 0,
          eliminated: false,
        },
      ]);
    });

    expect(result.current[0]).toHaveLength(2);
    expect(result.current[0][1]?.name).toBe('Bob');
  });
});
