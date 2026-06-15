/**
 * Export helpers for the Studio Save step.
 *
 * The downloaded JSON must round-trip through the existing importer
 * (`loadCategoryJSON` / `isSlide` in `@utils/jsonImport`):
 *  - the importer unwraps a top-level `{ category: { name, slides } }` envelope,
 *    which is also the shape the sample categories on disk use, so we emit that;
 *  - `isSlide` requires every slide's `imageUrl` to start with `data:image/`,
 *    so image-less slides cannot be exported (or stored for gameplay) as-is.
 */

import type { Category, Slide } from '@types';

/** The exact `imageUrl` prefix the importer's `isSlide` guard requires. */
const DATA_IMAGE_PREFIX = 'data:image/';

/**
 * The import-compatible JSON envelope: a single `category` field wrapping the
 * `{ name, slides }` payload. Matches what `loadCategoryJSON` accepts and what
 * the sample category files on disk use.
 */
export interface CategoryExportEnvelope {
  category: Category;
}

/**
 * Does this slide carry a real, importable image? Mirrors the importer's
 * `isSlide` rule that `imageUrl` must be a `data:image/...` URL.
 */
export function slideHasImage(slide: Slide): boolean {
  return slide.imageUrl.startsWith(DATA_IMAGE_PREFIX);
}

/**
 * Split slides into those that carry a real image (exportable / playable) and
 * those that are still blank. Order is preserved within each group.
 */
export function partitionSlidesByImage(slides: Slide[]): {
  withImage: Slide[];
  blank: Slide[];
} {
  const withImage: Slide[] = [];
  const blank: Slide[] = [];
  for (const slide of slides) {
    if (slideHasImage(slide)) {
      withImage.push(slide);
    } else {
      blank.push(slide);
    }
  }
  return { withImage, blank };
}

/**
 * Wrap a category in the import-compatible envelope.
 */
export function toCategoryExportEnvelope(category: Category): CategoryExportEnvelope {
  return { category: { name: category.name, slides: category.slides } };
}

/**
 * Serialize a category to the import-compatible JSON string (pretty-printed).
 */
export function serializeCategoryForExport(category: Category): string {
  return JSON.stringify(toCategoryExportEnvelope(category), null, 2);
}
