/**
 * Utilities for importing and validating JSON data
 *
 * This module handles loading JSON files and validating their structure
 * against our application's data models.
 */

import type { Category, Contestant, CensorBox, Slide } from '@types';

/**
 * Validation error thrown when JSON data is invalid
 */
export class JSONImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JSONImportError';
  }
}

/**
 * Validates that a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates that a value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for CensorBox
 * Exported for testing
 */
export function isCensorBox(box: unknown): box is CensorBox {
  if (typeof box !== 'object' || box === null) {
    return false;
  }

  const b = box as Record<string, unknown>;

  return (
    isNumber(b['x']) &&
    b['x'] >= 0 &&
    isNumber(b['y']) &&
    b['y'] >= 0 &&
    isNumber(b['width']) &&
    b['width'] >= 0 &&
    isNumber(b['height']) &&
    b['height'] >= 0 &&
    isNonEmptyString(b['color'])
  );
}

/**
 * Type guard for Slide
 * Exported for testing
 */
export function isSlide(slide: unknown): slide is Slide {
  if (typeof slide !== 'object' || slide === null) {
    return false;
  }

  const s = slide as Record<string, unknown>;

  return (
    isNonEmptyString(s['imageUrl']) &&
    s['imageUrl'].startsWith('data:image/') &&
    typeof s['answer'] === 'string' &&
    Array.isArray(s['censorBoxes']) &&
    s['censorBoxes'].every(isCensorBox)
  );
}

/**
 * Type guard for Category
 * Exported for testing
 */
export function isCategory(category: unknown): category is Category {
  if (typeof category !== 'object' || category === null) {
    return false;
  }

  const c = category as Record<string, unknown>;

  return (
    isNonEmptyString(c['name']) &&
    Array.isArray(c['slides']) &&
    c['slides'].length > 0 &&
    c['slides'].every(isSlide)
  );
}

/**
 * Load and validate JSON from a File object (uploaded file)
 * Returns the parsed Category data
 */
export async function loadCategoryJSON(file: File): Promise<Category> {
  // Read file as text
  let text: string;
  try {
    text = await file.text();
  } catch (error) {
    throw new JSONImportError(
      `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new JSONImportError(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Check if data has a 'category' field (from Python script output)
  if (typeof data === 'object' && data !== null && 'category' in data) {
    const dataObj = data as Record<string, unknown>;
    data = dataObj['category'];
  }

  // Validate structure
  if (!isCategory(data)) {
    throw new JSONImportError(
      'Invalid category data: must have name (string) and slides (non-empty array)'
    );
  }

  return data;
}

/**
 * Generate a unique ID for a contestant
 */
function generateContestantId(): string {
  const timestamp = String(Date.now());
  return `contestant-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a Contestant from a Category and contestant name
 */
export function createContestantFromCategory(
  category: Category,
  contestantName: string
): Contestant {
  if (!isNonEmptyString(contestantName)) {
    throw new JSONImportError('Contestant name must be a non-empty string');
  }

  return {
    id: generateContestantId(),
    name: contestantName,
    category,
    wins: 0,
    eliminated: false,
  };
}
