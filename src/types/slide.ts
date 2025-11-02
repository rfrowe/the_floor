/**
 * Slide and CensorBox type definitions
 * Based on SPEC.md section 4.3 and 4.4
 *
 * IMPORTANT: Keep in sync with Python types in scripts/parse_pptx.py
 */

/**
 * Represents a censorship box overlay on a slide image.
 * Position and size are specified as percentages (0-100) relative to the image dimensions.
 *
 * SYNC WITH: scripts/parse_pptx.py - CensorBox dataclass
 */
export interface CensorBox {
  /** X position as percentage (0-100) from left edge */
  x: number;

  /** Y position as percentage (0-100) from top edge */
  y: number;

  /** Width as percentage (0-100) of image width */
  width: number;

  /** Height as percentage (0-100) of image height */
  height: number;

  /** Color of the censor box (hex or rgba format) */
  color: string;
}

/**
 * Represents a single slide in a category, containing an image,
 * the correct answer, and optional censorship boxes.
 *
 * SYNC WITH: scripts/parse_pptx.py - Slide dataclass
 */
export interface Slide {
  /** Image data as base64 or blob URL */
  imageUrl: string;

  /** The correct answer for this slide (from speaker notes) */
  answer: string;

  /** Censorship boxes to overlay on the image */
  censorBoxes: CensorBox[];
}
