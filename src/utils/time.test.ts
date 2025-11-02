/**
 * Tests for time utility functions
 */

import { describe, it, expect } from 'vitest';
import { formatTime } from './time';

describe('formatTime', () => {
  describe('Basic formatting', () => {
    it('formats whole seconds under 60', () => {
      expect(formatTime(0)).toBe('0.0s');
      expect(formatTime(5)).toBe('5.0s');
      expect(formatTime(30)).toBe('30.0s');
      expect(formatTime(59)).toBe('59.0s');
    });

    it('formats decimal seconds under 60', () => {
      expect(formatTime(28.5)).toBe('28.5s');
      expect(formatTime(15.3)).toBe('15.3s');
      expect(formatTime(45.7)).toBe('45.7s');
    });

    it('formats seconds as minutes:seconds for 60+', () => {
      expect(formatTime(60)).toBe('1:00.0');
      expect(formatTime(90)).toBe('1:30.0');
      expect(formatTime(120)).toBe('2:00.0');
      expect(formatTime(125)).toBe('2:05.0');
    });

    it('formats minutes:seconds with decimals', () => {
      expect(formatTime(125.3)).toBe('2:05.2'); // Floors to .2
      expect(formatTime(90.7)).toBe('1:30.7');
      expect(formatTime(185.5)).toBe('3:05.5');
    });

    it('pads seconds to 2 digits in minute format', () => {
      expect(formatTime(61)).toBe('1:01.0');
      expect(formatTime(62)).toBe('1:02.0');
      expect(formatTime(125)).toBe('2:05.0');
      expect(formatTime(309)).toBe('5:09.0');
    });
  });

  describe('Edge cases', () => {
    it('clamps negative values to 0', () => {
      expect(formatTime(-1)).toBe('0.0s');
      expect(formatTime(-10)).toBe('0.0s');
      expect(formatTime(-100.5)).toBe('0.0s');
    });

    it('handles very large values', () => {
      expect(formatTime(3600)).toBe('60:00.0'); // 1 hour
      expect(formatTime(3661)).toBe('61:01.0'); // 1 hour, 1 minute, 1 second
      expect(formatTime(7200)).toBe('120:00.0'); // 2 hours
    });

    it('handles very small decimals', () => {
      expect(formatTime(0.1)).toBe('0.1s');
      expect(formatTime(0.05)).toBe('0.0s'); // Rounds down
      expect(formatTime(0.9)).toBe('0.9s');
    });

    it('truncates decimals beyond first place', () => {
      expect(formatTime(28.56)).toBe('28.5s'); // Not 28.6
      expect(formatTime(28.99)).toBe('28.9s'); // Not 29.0
      expect(formatTime(125.789)).toBe('2:05.7'); // Not 2:05.8
    });

    it('handles boundary at 60 seconds', () => {
      expect(formatTime(59.9)).toBe('59.8s'); // Floors to .8
      expect(formatTime(60.0)).toBe('1:00.0');
      expect(formatTime(60.1)).toBe('1:00.1');
    });
  });

  describe('Precision and rounding', () => {
    it('shows exactly one decimal place', () => {
      const result1 = formatTime(28.5);
      expect(result1).toMatch(/\.\d[^0-9]/); // Matches .X followed by non-digit

      const result2 = formatTime(125.3);
      expect(result2).toMatch(/\.\d$/); // Matches .X at end
    });

    it('floors decimal values rather than rounding', () => {
      // Should floor (truncate), not round
      expect(formatTime(28.59)).toBe('28.5s'); // Not 28.6
      expect(formatTime(28.51)).toBe('28.5s'); // Not 28.6
      expect(formatTime(28.99)).toBe('28.9s'); // Not 29.0
    });
  });

  describe('Real-world game scenarios', () => {
    it('formats typical game timer values', () => {
      // 30 second timer
      expect(formatTime(30)).toBe('30.0s');
      expect(formatTime(15.5)).toBe('15.5s');
      expect(formatTime(5.3)).toBe('5.2s'); // Floors to .2
      expect(formatTime(0.1)).toBe('0.1s');
    });

    it('formats countdown sequences', () => {
      // Countdown from 10
      expect(formatTime(10)).toBe('10.0s');
      expect(formatTime(9)).toBe('9.0s');
      expect(formatTime(5)).toBe('5.0s');
      expect(formatTime(3)).toBe('3.0s');
      expect(formatTime(1)).toBe('1.0s');
      expect(formatTime(0)).toBe('0.0s');
    });

    it('handles game clock running out', () => {
      expect(formatTime(0.5)).toBe('0.5s');
      expect(formatTime(0.1)).toBe('0.1s');
      expect(formatTime(0)).toBe('0.0s');
      expect(formatTime(-0.1)).toBe('0.0s'); // Should clamp, not go negative
    });
  });
});
