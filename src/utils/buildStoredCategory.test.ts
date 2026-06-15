/**
 * Tests for buildStoredCategory — assembling a finished Studio category into a
 * StoredCategory with the metadata the IndexedDB `categories` store expects.
 */

import { describe, it, expect } from 'vitest';
import { buildStoredCategory } from './buildStoredCategory';
import { calculateCategorySize } from './storageUtils';
import type { Slide } from '@types';

const IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function slide(answer: string, imageUrl = IMAGE): Slide {
  return { imageUrl, answer, censorBoxes: [] };
}

describe('buildStoredCategory', () => {
  it('carries name and slides through unchanged', () => {
    const slides = [slide('A'), slide('B')];
    const category = buildStoredCategory('My Category', slides);
    expect(category.name).toBe('My Category');
    expect(category.slides).toEqual(slides);
  });

  it('assigns a non-empty id and an ISO createdAt timestamp', () => {
    const category = buildStoredCategory('X', [slide('A')]);
    expect(category.id).toBeTruthy();
    expect(typeof category.id).toBe('string');
    // Round-trips as a valid ISO-8601 timestamp.
    expect(category.createdAt).toBe(new Date(category.createdAt).toISOString());
  });

  it('generates distinct ids across calls', () => {
    const a = buildStoredCategory('X', [slide('A')]);
    const b = buildStoredCategory('X', [slide('A')]);
    expect(a.id).not.toBe(b.id);
  });

  it('uses the first slide image as the thumbnail', () => {
    const first = slide('A', `${IMAGE}AAAA`);
    const category = buildStoredCategory('X', [first, slide('B')]);
    expect(category.thumbnailUrl).toBe(first.imageUrl);
  });

  it('falls back to an empty thumbnail when there are no slides', () => {
    const category = buildStoredCategory('X', []);
    expect(category.thumbnailUrl).toBe('');
  });

  it('computes sizeInBytes via calculateCategorySize (in-memory size, > 0)', () => {
    const slides = [slide('A'), slide('B')];
    const category = buildStoredCategory('My Category', slides);
    expect(category.sizeInBytes).toBe(calculateCategorySize({ name: 'My Category', slides }));
    expect(category.sizeInBytes ?? 0).toBeGreaterThan(0);
  });
});
