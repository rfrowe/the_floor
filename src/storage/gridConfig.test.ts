/**
 * Tests for gridConfig storage module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadGridConfig, saveGridConfig } from './gridConfig';

describe('gridConfig storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('loadGridConfig', () => {
    it('returns default config when nothing in localStorage', () => {
      const config = loadGridConfig();
      expect(config).toEqual({
        rows: 5,
        cols: 9,
      });
    });

    it('loads config from localStorage when available', () => {
      localStorage.setItem('the_floor_grid_config', JSON.stringify({ rows: 10, cols: 15 }));

      const config = loadGridConfig();
      expect(config).toEqual({
        rows: 10,
        cols: 15,
      });
    });

    it('returns default config when localStorage has invalid JSON', () => {
      localStorage.setItem('the_floor_grid_config', 'not valid json');

      const config = loadGridConfig();
      expect(config).toEqual({
        rows: 5,
        cols: 9,
      });
    });

    it('validates rows and cols are positive numbers', () => {
      localStorage.setItem('the_floor_grid_config', JSON.stringify({ rows: -5, cols: 10 }));

      const config = loadGridConfig();
      expect(config).toEqual({
        rows: 5,
        cols: 9,
      });
    });

    it('validates rows and cols are not too large', () => {
      localStorage.setItem('the_floor_grid_config', JSON.stringify({ rows: 50, cols: 50 }));

      const config = loadGridConfig();
      expect(config).toEqual({
        rows: 5,
        cols: 9,
      });
    });

    it('validates rows and cols are numbers', () => {
      localStorage.setItem('the_floor_grid_config', JSON.stringify({ rows: 'five', cols: 'nine' }));

      const config = loadGridConfig();
      expect(config).toEqual({
        rows: 5,
        cols: 9,
      });
    });

    it('accepts valid config within range (1-20)', () => {
      localStorage.setItem('the_floor_grid_config', JSON.stringify({ rows: 1, cols: 20 }));

      const config = loadGridConfig();
      expect(config).toEqual({
        rows: 1,
        cols: 20,
      });
    });
  });

  describe('saveGridConfig', () => {
    it('saves config to localStorage', () => {
      saveGridConfig({ rows: 7, cols: 8 });

      const stored = localStorage.getItem('the_floor_grid_config');
      expect(stored).toBe(JSON.stringify({ rows: 7, cols: 8 }));
    });

    it('overwrites existing config', () => {
      saveGridConfig({ rows: 3, cols: 3 });
      saveGridConfig({ rows: 10, cols: 10 });

      const stored = localStorage.getItem('the_floor_grid_config');
      expect(stored).toBe(JSON.stringify({ rows: 10, cols: 10 }));
    });

    it('handles localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      // Should not throw
      expect(() => {
        saveGridConfig({ rows: 5, cols: 5 });
      }).not.toThrow();

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });
});
