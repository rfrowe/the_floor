/**
 * censorGeometry — pure pixel ↔ percentage math for the censor-box editor.
 *
 * The gameplay data model stores each {@link CensorBox} as percentages (0–100)
 * of the rendered image (see `src/types/slide.ts`). The editor, however, works
 * in pixels relative to the rendered image's `getBoundingClientRect()` bounds
 * (the same bounds `SlideViewer` computes). These helpers convert between the
 * two coordinate systems and are deliberately React-free so they are trivially
 * unit-testable and reusable.
 *
 * Conversions here are the exact inverse of `CensorBox.tsx` placement
 * (`left: x%`, `top: y%`, `width: width%`, `height: height%`), so a box drawn
 * in the editor renders identically in gameplay.
 */

import type { CensorBox } from '@types';

/** A rectangle in pixel space relative to the rendered image's top-left. */
export interface PxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A point in pixel space relative to the rendered image's top-left. */
export interface Point {
  x: number;
  y: number;
}

/**
 * Minimum size (as a percentage of either axis) below which a drawn box is
 * treated as a stray click and discarded. Both width and height must meet this
 * threshold for the box to be kept.
 */
export const MIN_BOX_SIZE_PCT = 1;

/**
 * Clamp `value` into the inclusive range `[min, max]`.
 *
 * Guards against an inverted range (`min > max`) by returning `min`, which
 * keeps callers safe when, e.g., the available width is already exhausted.
 */
export function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

/**
 * Normalize a drag from `start` to `end` into a positive-dimension rectangle,
 * so dragging in any direction (up-left, down-right, etc.) yields a sensible
 * `{ x, y, w, h }` with non-negative width and height.
 */
export function normalizeRect(start: Point, end: Point): PxRect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(end.x - start.x);
  const h = Math.abs(end.y - start.y);
  return { x, y, w, h };
}

/**
 * Convert a pixel rectangle (relative to a `boundsW × boundsH` image) into a
 * {@link CensorBox} with each field as a clamped percentage (0–100).
 *
 * The conversion guarantees `x + width ≤ 100` and `y + height ≤ 100` so a box
 * can never extend past the image edge — the exact inverse of `CensorBox.tsx`
 * percentage placement.
 *
 * @returns the resulting box, or `null` if the bounds are non-positive
 *          (degenerate — nothing to draw against).
 */
export function pxRectToCensorBox(
  rect: PxRect,
  boundsW: number,
  boundsH: number,
  color: string
): CensorBox | null {
  if (boundsW <= 0 || boundsH <= 0) {
    return null;
  }

  const x = clamp((rect.x / boundsW) * 100, 0, 100);
  const y = clamp((rect.y / boundsH) * 100, 0, 100);
  const width = clamp((rect.w / boundsW) * 100, 0, 100 - x);
  const height = clamp((rect.h / boundsH) * 100, 0, 100 - y);

  return { x, y, width, height, color };
}

/**
 * Convert a {@link CensorBox} (percentages) back into a pixel rectangle
 * relative to a `boundsW × boundsH` image — used for hit-testing and rendering
 * selection handles.
 */
export function censorBoxToPxRect(box: CensorBox, boundsW: number, boundsH: number): PxRect {
  return {
    x: (box.x / 100) * boundsW,
    y: (box.y / 100) * boundsH,
    w: (box.width / 100) * boundsW,
    h: (box.height / 100) * boundsH,
  };
}

/**
 * Whether a drawn box meets the minimum-size threshold on both axes. Boxes that
 * fail this (e.g. a stray click or a tiny accidental drag) should be discarded
 * rather than committed.
 */
export function isBoxLargeEnough(box: CensorBox, minPct: number = MIN_BOX_SIZE_PCT): boolean {
  return box.width >= minPct && box.height >= minPct;
}
