/**
 * Tests for color utility functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getContestantColor, resetColorAssignments } from './colorUtils';

describe('colorUtils', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset color assignments before each test
    resetColorAssignments();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getContestantColor', () => {
    it('returns transparent for empty squares (undefined ID)', () => {
      const color = getContestantColor(undefined);
      expect(color).toBe('transparent');
    });

    it('returns consistent color for same contestant ID', () => {
      const id = 'contestant-123';
      const color1 = getContestantColor(id);
      const color2 = getContestantColor(id);
      expect(color1).toBe(color2);
    });

    it('returns different colors for different contestant IDs', () => {
      const id1 = 'contestant-1';
      const id2 = 'contestant-2';
      const color1 = getContestantColor(id1);
      const color2 = getContestantColor(id2);
      // With sequential assignment, they should always be different
      expect(color1).not.toBe(color2);
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color2).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('returns valid hex color code', () => {
      const color = getContestantColor('test-id');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('handles various ID formats consistently', () => {
      const ids = ['123', 'abc-def', 'CONTESTANT_1', 'uuid-1234-5678'];
      ids.forEach((id) => {
        const color = getContestantColor(id);
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('assigns unique colors to each contestant', () => {
      const contestants = Array.from({ length: 10 }, (_, i) => `contestant-${String(i)}`);
      const colors = contestants.map((id) => getContestantColor(id));

      // All colors should be unique
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(contestants.length);
    });
  });

  describe('resetColorAssignments', () => {
    it('clears all color assignments', () => {
      const id = 'test-contestant';
      getContestantColor(id);

      resetColorAssignments();

      const color2 = getContestantColor(id);
      // After reset, should get first color again
      expect(color2).toBe('#FF0000'); // First color in list
    });

    it('clears localStorage when reset', () => {
      getContestantColor('contestant-1');
      getContestantColor('contestant-2');

      // Should have color assignments in localStorage
      expect(localStorage.getItem('the_floor_color_assignments')).toBeTruthy();

      resetColorAssignments();

      // Should be cleared from localStorage
      expect(localStorage.getItem('the_floor_color_assignments')).toBeNull();
    });
  });

  describe('Boundary conditions', () => {
    it('handles exactly 30 contestants (palette size)', () => {
      const contestants = Array.from({ length: 30 }, (_, i) => `contestant-${String(i)}`);
      const colors = contestants.map((id) => getContestantColor(id));

      // All should be unique and from predefined list
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(30);

      // All should be valid hex colors
      colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('generates random colors for 31st+ contestants', () => {
      // Assign all 30 predefined colors
      const first30 = Array.from({ length: 30 }, (_, i) => `contestant-${String(i)}`);
      first30.forEach((id) => getContestantColor(id));

      // 31st contestant should get a generated color
      const color31 = getContestantColor('contestant-30');
      expect(color31).toMatch(/^#[0-9A-F]{6}$/i);

      // Should still be unique
      const allColors = [...first30.map((id) => getContestantColor(id)), color31];
      const uniqueColors = new Set(allColors);
      expect(uniqueColors.size).toBe(31);
    });

    it('handles empty string contestant ID', () => {
      const color = getContestantColor('');
      // Empty string is treated as empty square (falsy value)
      expect(color).toBe('transparent');
    });

    it('handles very long contestant IDs', () => {
      const longId = 'a'.repeat(1000);
      const color = getContestantColor(longId);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('handles special characters in contestant IDs', () => {
      const specialIds = ['test@#$%', 'test\nwith\nnewlines', 'test\u0000null'];
      specialIds.forEach((id) => {
        const color = getContestantColor(id);
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('localStorage persistence', () => {
    it('persists color assignments to localStorage', () => {
      const id1 = 'alice';
      const id2 = 'bob';
      const color1 = getContestantColor(id1);
      const color2 = getContestantColor(id2);

      const stored = localStorage.getItem('the_floor_color_assignments');
      expect(stored).toBeTruthy();

      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        expect(parsed[id1]).toBe(color1);
        expect(parsed[id2]).toBe(color2);
      }
    });

    it('loads assignments from localStorage on module reload', () => {
      // Simulate existing color assignments in localStorage
      const existingAssignments = {
        alice: '#FF0000',
        bob: '#00FF00',
        charlie: '#0000FF',
      };
      localStorage.setItem('the_floor_color_assignments', JSON.stringify(existingAssignments));

      // Note: In real usage, the module would reload and read from localStorage
      // In tests, we verify that new assignments respect existing ones
      const color1 = getContestantColor('alice');
      const color2 = getContestantColor('bob');

      expect(color1).toBe('#FF0000');
      expect(color2).toBe('#00FF00');
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('the_floor_color_assignments', 'invalid json {{{');

      // Should not throw and should assign new colors
      const color = getContestantColor('test-contestant');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('handles localStorage.setItem errors gracefully', () => {
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      // Should not throw, just warn
      expect(() => getContestantColor('test-contestant')).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('Color reuse prevention', () => {
    it('never reuses colors while contestants exist', () => {
      const contestants = Array.from({ length: 30 }, (_, i) => `contestant-${String(i)}`);
      const colors = contestants.map((id) => getContestantColor(id));

      // Verify all unique
      expect(new Set(colors).size).toBe(30);

      // Add one more - should NOT reuse any of the 30 colors
      const color31 = getContestantColor('contestant-30');
      expect(colors).not.toContain(color31);
    });

    it('only reuses colors after reset', () => {
      const color1 = getContestantColor('alice');
      expect(color1).toBe('#FF0000'); // First color

      resetColorAssignments();

      const color2 = getContestantColor('bob');
      expect(color2).toBe('#FF0000'); // Can reuse after reset
    });
  });
});
