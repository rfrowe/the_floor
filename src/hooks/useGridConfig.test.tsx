/**
 * Tests for useGridConfig hook
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGridConfig } from './useGridConfig';

describe('useGridConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns default grid config on first load', () => {
    const { result } = renderHook(() => useGridConfig());
    const [config] = result.current;

    expect(config).toEqual({
      rows: 5,
      cols: 9,
    });
  });

  it('allows updating grid config', () => {
    const { result } = renderHook(() => useGridConfig());
    const [, setConfig] = result.current;

    act(() => {
      setConfig({ rows: 10, cols: 10 });
    });

    const [newConfig] = result.current;
    expect(newConfig).toEqual({
      rows: 10,
      cols: 10,
    });
  });

  it('persists config to localStorage', () => {
    const { result } = renderHook(() => useGridConfig());
    const [, setConfig] = result.current;

    act(() => {
      setConfig({ rows: 7, cols: 12 });
    });

    const stored = localStorage.getItem('the_floor_grid_config');
    expect(stored).toBe(JSON.stringify({ rows: 7, cols: 12 }));
  });

  it('loads config from localStorage on mount', () => {
    localStorage.setItem('the_floor_grid_config', JSON.stringify({ rows: 3, cols: 4 }));

    const { result } = renderHook(() => useGridConfig());
    const [config] = result.current;

    expect(config).toEqual({
      rows: 3,
      cols: 4,
    });
  });

  it('uses default config if localStorage has invalid data', () => {
    localStorage.setItem('the_floor_grid_config', 'invalid json');

    const { result } = renderHook(() => useGridConfig());
    const [config] = result.current;

    expect(config).toEqual({
      rows: 5,
      cols: 9,
    });
  });

  it('validates config from localStorage (rejects out of range)', () => {
    localStorage.setItem('the_floor_grid_config', JSON.stringify({ rows: 25, cols: 30 }));

    const { result } = renderHook(() => useGridConfig());
    const [config] = result.current;

    // Should fall back to default since values are out of range
    expect(config).toEqual({
      rows: 5,
      cols: 9,
    });
  });

  it('validates config from localStorage (rejects negative values)', () => {
    localStorage.setItem('the_floor_grid_config', JSON.stringify({ rows: -1, cols: 5 }));

    const { result } = renderHook(() => useGridConfig());
    const [config] = result.current;

    expect(config).toEqual({
      rows: 5,
      cols: 9,
    });
  });

  it('syncs config across multiple hook instances via BroadcastChannel', async () => {
    const { result: result1 } = renderHook(() => useGridConfig());
    const { result: result2 } = renderHook(() => useGridConfig());

    const [, setConfig1] = result1.current;

    act(() => {
      setConfig1({ rows: 8, cols: 8 });
    });

    // First hook should have the updated config immediately
    expect(result1.current[0]).toEqual({ rows: 8, cols: 8 });

    // Second hook should receive update via BroadcastChannel (may take a tick)
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result2.current[0]).toEqual({ rows: 8, cols: 8 });
  });
});
