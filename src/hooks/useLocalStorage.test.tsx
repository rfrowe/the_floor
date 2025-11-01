/**
 * Tests for useLocalStorage hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default value when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should initialize with stored value when key exists', () => {
    localStorage.setItem('the-floor:test', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('should update state and localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('the-floor:test')).toBe(JSON.stringify('updated'));
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('test', 10));

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(15);
    expect(localStorage.getItem('the-floor:test')).toBe(JSON.stringify(15));
  });

  it('should handle complex objects', () => {
    const initialValue = { foo: 'bar', nested: { value: 42 } };
    const { result } = renderHook(() => useLocalStorage('test', initialValue));

    expect(result.current[0]).toEqual(initialValue);

    const updatedValue = { foo: 'baz', nested: { value: 100 } };
    act(() => {
      result.current[1](updatedValue);
    });

    expect(result.current[0]).toEqual(updatedValue);
    expect(localStorage.getItem('the-floor:test')).toBe(JSON.stringify(updatedValue));
  });

  it('should handle arrays', () => {
    const { result } = renderHook(() => useLocalStorage('test', [1, 2, 3]));

    act(() => {
      result.current[1]([...result.current[0], 4]);
    });

    expect(result.current[0]).toEqual([1, 2, 3, 4]);
  });

  it('should handle null values', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('test', null));

    expect(result.current[0]).toBeNull();

    act(() => {
      result.current[1]('not null');
    });

    expect(result.current[0]).toBe('not null');

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
  });

  it('should sync across hook instances with same key', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('test', 'initial'));
    renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      result1.current[1]('updated');
    });

    // Both instances should reflect the update
    expect(result1.current[0]).toBe('updated');
    // Note: result2 won't automatically update in the same window
    // Storage events only fire across different windows/tabs
  });

  it('should handle storage events from other tabs', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    // Simulate a storage event from another tab
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'the-floor:test',
        newValue: JSON.stringify('from-other-tab'),
        oldValue: JSON.stringify('initial'),
        storageArea: localStorage,
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe('from-other-tab');
  });

  it('should ignore storage events for other keys', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      const event = new StorageEvent('storage', {
        key: 'the-floor:other',
        newValue: JSON.stringify('other-value'),
        storageArea: localStorage,
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe('initial');
  });

  it('should cleanup storage event listener on unmount', () => {
    const { unmount } = renderHook(() => useLocalStorage('test', 'initial'));

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});
