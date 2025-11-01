/**
 * Tests for useGameConfig hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DEFAULT_GAME_CONFIG } from '@types';
import { useGameConfig } from './useGameConfig';

describe('useGameConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default config', () => {
    const { result } = renderHook(() => useGameConfig());
    expect(result.current[0]).toEqual(DEFAULT_GAME_CONFIG);
  });

  it('should store and retrieve custom config', () => {
    const { result } = renderHook(() => useGameConfig());

    const customConfig = {
      timePerPlayer: 45,
      skipPenaltySeconds: 5,
    };

    act(() => {
      result.current[1](customConfig);
    });

    expect(result.current[0]).toEqual(customConfig);
    expect(localStorage.getItem('the-floor:config')).toBe(JSON.stringify(customConfig));
  });

  it('should persist config across remounts', () => {
    const customConfig = {
      timePerPlayer: 60,
      skipPenaltySeconds: 10,
    };

    localStorage.setItem('the-floor:config', JSON.stringify(customConfig));

    const { result } = renderHook(() => useGameConfig());
    expect(result.current[0]).toEqual(customConfig);
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useGameConfig());

    act(() => {
      result.current[1]((prev) => ({
        ...prev,
        timePerPlayer: prev.timePerPlayer + 10,
      }));
    });

    expect(result.current[0].timePerPlayer).toBe(40);
    expect(result.current[0].skipPenaltySeconds).toBe(DEFAULT_GAME_CONFIG.skipPenaltySeconds);
  });
});
