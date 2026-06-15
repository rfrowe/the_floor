/**
 * Tests for censorGeometry — the pure pixel ↔ percentage math powering the
 * censor-box editor. This is the highest-value surface to test: it is pure,
 * deterministic, and must stay the exact inverse of `CensorBox.tsx` placement.
 */

import { describe, it, expect } from 'vitest';
import {
  boxToStyle,
  clamp,
  normalizeRect,
  pxRectToCensorBox,
  isBoxLargeEnough,
  MIN_BOX_SIZE_PCT,
  type PxRect,
} from './censorGeometry';

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('clamps to the minimum below range', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });

  it('clamps to the maximum above range', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('returns min for an inverted range (max < min)', () => {
    // Happens when the remaining width (100 - x) is negative; min wins.
    expect(clamp(20, 30, 10)).toBe(30);
  });
});

describe('normalizeRect', () => {
  it('keeps a top-left → bottom-right drag positive', () => {
    expect(normalizeRect({ x: 10, y: 20 }, { x: 60, y: 80 })).toEqual({
      x: 10,
      y: 20,
      w: 50,
      h: 60,
    });
  });

  it('normalizes a bottom-right → top-left drag (reversed)', () => {
    expect(normalizeRect({ x: 60, y: 80 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      w: 50,
      h: 60,
    });
  });

  it('normalizes a bottom-left → top-right drag (mixed direction)', () => {
    expect(normalizeRect({ x: 10, y: 80 }, { x: 60, y: 20 })).toEqual({
      x: 10,
      y: 20,
      w: 50,
      h: 60,
    });
  });

  it('produces zero dimensions for a click with no movement', () => {
    expect(normalizeRect({ x: 40, y: 40 }, { x: 40, y: 40 })).toEqual({ x: 40, y: 40, w: 0, h: 0 });
  });
});

describe('pxRectToCensorBox', () => {
  it('converts pixels to percentages against the bounds', () => {
    const rect: PxRect = { x: 80, y: 60, w: 160, h: 120 };
    const box = pxRectToCensorBox(rect, 800, 600, '#000');
    expect(box).not.toBeNull();
    // 80/800 = 10%, 60/600 = 10%, 160/800 = 20%, 120/600 = 20%
    expect(box).toEqual({ x: 10, y: 10, width: 20, height: 20, color: '#000' });
  });

  it('carries the supplied color through', () => {
    const box = pxRectToCensorBox({ x: 0, y: 0, w: 100, h: 100 }, 200, 200, 'rgba(0,0,0,0.6)');
    expect(box?.color).toBe('rgba(0,0,0,0.6)');
  });

  it('clamps a rect that extends past the right/bottom edges so x+width ≤ 100', () => {
    // Rect starts at 90% and is 40% wide → would overflow to 130%.
    const rect: PxRect = { x: 720, y: 540, w: 320, h: 240 };
    const box = pxRectToCensorBox(rect, 800, 600, '#000');
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBe(90);
      expect(box.y).toBe(90);
      expect(box.x + box.width).toBeLessThanOrEqual(100);
      expect(box.y + box.height).toBeLessThanOrEqual(100);
      // Width is clamped to the remaining 10%.
      expect(box.width).toBe(10);
      expect(box.height).toBe(10);
    }
  });

  it('clamps a negative-origin rect to 0', () => {
    const box = pxRectToCensorBox({ x: -40, y: -30, w: 80, h: 60 }, 800, 600, '#000');
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBe(0);
      expect(box.y).toBe(0);
    }
  });

  it('returns null for non-positive bounds (degenerate image)', () => {
    expect(pxRectToCensorBox({ x: 0, y: 0, w: 10, h: 10 }, 0, 600, '#000')).toBeNull();
    expect(pxRectToCensorBox({ x: 0, y: 0, w: 10, h: 10 }, 800, 0, '#000')).toBeNull();
  });
});

describe('boxToStyle', () => {
  it('maps a box to percentage left/top/width/height', () => {
    expect(boxToStyle({ x: 10, y: 20, width: 30, height: 40, color: '#000' })).toEqual({
      left: '10%',
      top: '20%',
      width: '30%',
      height: '40%',
    });
  });

  it('is the exact forward transform pxRectToCensorBox feeds', () => {
    // A rect → box → style must land at the same percentages the box carries.
    const box = pxRectToCensorBox({ x: 80, y: 60, w: 160, h: 120 }, 800, 600, '#000');
    expect(box).not.toBeNull();
    if (box) {
      expect(boxToStyle(box)).toEqual({
        left: '10%',
        top: '10%',
        width: '20%',
        height: '20%',
      });
    }
  });

  it('preserves fractional percentages', () => {
    expect(boxToStyle({ x: 12.5, y: 33.3, width: 45.7, height: 22.1, color: '#000' })).toEqual({
      left: '12.5%',
      top: '33.3%',
      width: '45.7%',
      height: '22.1%',
    });
  });

  it('omits color and stacking — those are the caller’s concern', () => {
    const style = boxToStyle({ x: 0, y: 0, width: 10, height: 10, color: '#abcdef' });
    expect(style).not.toHaveProperty('backgroundColor');
    expect(style).not.toHaveProperty('position');
  });
});

describe('isBoxLargeEnough', () => {
  it('rejects a sub-threshold box on both axes (stray click)', () => {
    const box = pxRectToCensorBox({ x: 0, y: 0, w: 2, h: 2 }, 800, 600, '#000');
    expect(box).not.toBeNull();
    if (box) {
      // 2/800 = 0.25% and 2/600 ≈ 0.33% — both under 1%.
      expect(isBoxLargeEnough(box)).toBe(false);
    }
  });

  it('rejects a box that is wide enough but too short', () => {
    expect(isBoxLargeEnough({ x: 0, y: 0, width: 50, height: 0.5, color: '#000' })).toBe(false);
  });

  it('accepts a box meeting the threshold on both axes', () => {
    expect(isBoxLargeEnough({ x: 0, y: 0, width: 10, height: 10, color: '#000' })).toBe(true);
  });

  it('uses MIN_BOX_SIZE_PCT as the default threshold', () => {
    expect(
      isBoxLargeEnough({
        x: 0,
        y: 0,
        width: MIN_BOX_SIZE_PCT,
        height: MIN_BOX_SIZE_PCT,
        color: '#000',
      })
    ).toBe(true);
  });

  it('honors a custom threshold', () => {
    expect(isBoxLargeEnough({ x: 0, y: 0, width: 4, height: 4, color: '#000' }, 5)).toBe(false);
    expect(isBoxLargeEnough({ x: 0, y: 0, width: 6, height: 6, color: '#000' }, 5)).toBe(true);
  });
});
