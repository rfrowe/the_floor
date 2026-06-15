/**
 * Tests for categoryExport — the import-compatible serialization and
 * blank-slide partitioning used by the Studio Save step.
 *
 * The headline guarantee is that what we emit round-trips through the EXISTING
 * importer (`loadCategoryJSON` unwraps the `{ category }` envelope; `isSlide`
 * requires a `data:image/...` URL), so a downloaded category re-imports cleanly.
 */

import { describe, it, expect } from 'vitest';
import {
  partitionSlidesByImage,
  serializeCategoryForExport,
  slideHasImage,
  toCategoryExportEnvelope,
} from './categoryExport';
import { isSlide, loadCategoryJSON } from './jsonImport';
import type { Slide } from '@types';

const IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function slide(answer: string, imageUrl = IMAGE): Slide {
  return { imageUrl, answer, censorBoxes: [] };
}

/**
 * Build a File whose `.text()` resolves to `json`. jsdom does not implement
 * `Blob.prototype.text()`, so we polyfill it per the existing jsonImport tests.
 */
function jsonFile(json: string, filename = 'category.json'): File {
  const file = new File([json], filename, { type: 'application/json' });
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(json),
    writable: true,
    configurable: true,
  });
  return file;
}

describe('slideHasImage / partitionSlidesByImage', () => {
  it('treats only data:image/ URLs as having an image', () => {
    expect(slideHasImage(slide('A'))).toBe(true);
    expect(slideHasImage(slide('B', ''))).toBe(false);
    expect(slideHasImage(slide('C', 'https://example.com/x.png'))).toBe(false);
  });

  it('partitions slides preserving order within each group', () => {
    const slides = [slide('A'), slide('B', ''), slide('C'), slide('D', '')];
    const { withImage, blank } = partitionSlidesByImage(slides);
    expect(withImage.map((s) => s.answer)).toEqual(['A', 'C']);
    expect(blank.map((s) => s.answer)).toEqual(['B', 'D']);
  });
});

describe('toCategoryExportEnvelope', () => {
  it('wraps the category in a top-level `category` field', () => {
    const envelope = toCategoryExportEnvelope({ name: 'X', slides: [slide('A')] });
    expect(envelope).toHaveProperty('category.name', 'X');
    expect(envelope.category.slides).toHaveLength(1);
  });
});

describe('serializeCategoryForExport round-trips through the importer', () => {
  it('produces JSON that loadCategoryJSON accepts and that satisfies isSlide', async () => {
    const slides = [slide('First'), slide('Second')];
    const json = serializeCategoryForExport({ name: 'Cryptids', slides });

    // Every emitted slide must satisfy the importer's slide guard.
    const parsed = JSON.parse(json) as { category: { slides: unknown[] } };
    expect(parsed.category.slides.every(isSlide)).toBe(true);

    // And the whole file must load back through the real importer path.
    const file = jsonFile(json, 'cryptids.json');
    const category = await loadCategoryJSON(file);
    expect(category.name).toBe('Cryptids');
    expect(category.slides).toHaveLength(2);
    expect(category.slides[0]?.answer).toBe('First');
  });
});
