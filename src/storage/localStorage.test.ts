/**
 * Unit tests for localStorage abstraction layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getItem, setItem, removeItem, clear } from './localStorage';

describe('localStorage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any console warnings
    vi.spyOn(console, 'warn').mockImplementation(() => {
      // Mock implementation
    });
    vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getItem', () => {
    it('should return default value when key does not exist', () => {
      const result = getItem('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should return stored value when key exists', () => {
      localStorage.setItem('the-floor:test', JSON.stringify({ foo: 'bar' }));
      const result = getItem<{ foo: string }>('test', { foo: 'default' });
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return default value for invalid JSON', () => {
      localStorage.setItem('the-floor:test', 'invalid json');
      const result = getItem('test', 'default');
      expect(result).toBe('default');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle different data types', () => {
      const testCases = [
        { value: 42, key: 'number' },
        { value: true, key: 'boolean' },
        { value: { nested: { value: 'test' } }, key: 'object' },
        { value: [1, 2, 3], key: 'array' },
        { value: null, key: 'null' },
      ];

      testCases.forEach(({ value, key }) => {
        localStorage.setItem(`the-floor:${key}`, JSON.stringify(value));
        const result = getItem(key, 'default');
        expect(result).toEqual(value);
      });
    });
  });

  describe('setItem', () => {
    it('should store value with prefix', () => {
      setItem('test', { foo: 'bar' });
      const stored = localStorage.getItem('the-floor:test');
      expect(stored).toBe(JSON.stringify({ foo: 'bar' }));
    });

    it('should handle different data types', () => {
      const testCases = [
        { value: 42, key: 'number' },
        { value: true, key: 'boolean' },
        { value: { nested: { value: 'test' } }, key: 'object' },
        { value: [1, 2, 3], key: 'array' },
        { value: null, key: 'null' },
      ];

      testCases.forEach(({ value, key }) => {
        setItem(key, value);
        const stored = localStorage.getItem(`the-floor:${key}`);
        expect(JSON.parse(stored ?? '')).toEqual(value);
      });
    });

    it('should log error on quota exceeded and use in-memory fallback', () => {
      // Mock localStorage.setItem to throw QuotaExceededError on non-test keys
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key) => {
        // Allow the test key through for availability check
        if (key.includes('__test__')) {
          return;
        }
        // Throw on actual data
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Should throw and log error when quota exceeded after availability check passes
      expect(() => {
        setItem('test', 'value');
      }).toThrow('QuotaExceededError');
      // Logger formats the message, so check console.error was called with message containing the text
      expect(console.error).toHaveBeenCalled();
      const errorSpy = console.error as unknown as { mock: { calls: unknown[][] } };
      const calls = errorSpy.mock.calls;
      const quotaCall = calls.find(
        (call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('Storage quota exceeded')
      );
      expect(quotaCall).toBeTruthy();

      // Restore original
      setItemSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('should remove item with prefix', () => {
      localStorage.setItem('the-floor:test', 'value');
      removeItem('test');
      expect(localStorage.getItem('the-floor:test')).toBeNull();
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => {
        removeItem('nonexistent');
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear only prefixed items', () => {
      localStorage.setItem('the-floor:test1', 'value1');
      localStorage.setItem('the-floor:test2', 'value2');
      localStorage.setItem('other-app:test', 'value3');

      clear();

      expect(localStorage.getItem('the-floor:test1')).toBeNull();
      expect(localStorage.getItem('the-floor:test2')).toBeNull();
      expect(localStorage.getItem('other-app:test')).toBe('value3');
    });

    it('should not throw when storage is empty', () => {
      expect(() => {
        clear();
      }).not.toThrow();
    });
  });

  describe('localStorage unavailable fallback', () => {
    it('should use in-memory storage when localStorage is unavailable', () => {
      // Mock localStorage to throw error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      // Should still work with in-memory fallback
      setItem('test', { foo: 'bar' });
      const result = getItem<{ foo: string }>('test', { foo: 'default' });
      expect(result).toEqual({ foo: 'bar' });

      // Restore
      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
    });
  });
});
