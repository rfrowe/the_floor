/**
 * Assemble a finished Studio category into a {@link StoredCategory}.
 *
 * The Studio produces the existing gameplay types, so its output must be
 * indistinguishable from an imported category. This builder stamps the
 * IndexedDB metadata the `categories` store expects:
 *
 *  - `id`            — a fresh nanoid
 *  - `createdAt`     — ISO timestamp
 *  - `thumbnailUrl`  — the first slide's image (or '' when none)
 *  - `sizeInBytes`   — the in-memory size via `calculateCategorySize`
 *
 * `sizeInBytes` MUST come from `calculateCategorySize` (object-sizeof), not
 * `JSON.stringify(...).length`, to stay consistent with existing rows and the
 * `CategoryStorage` estimates.
 */

import { nanoid } from 'nanoid';
import { calculateCategorySize } from '@utils/storageUtils';
import type { Category, Slide, StoredCategory } from '@types';

/**
 * Build a {@link StoredCategory} from a category name and its finished slides.
 *
 * @param name   The confirmed category name.
 * @param slides The slides to store (callers are responsible for excluding
 *               image-less slides — see `partitionSlidesByImage` in
 *               `@utils/categoryExport`).
 */
export function buildStoredCategory(name: string, slides: Slide[]): StoredCategory {
  const category: Category = { name, slides };
  const firstSlide = slides[0];
  return {
    ...category,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    thumbnailUrl: firstSlide?.imageUrl ?? '',
    sizeInBytes: calculateCategorySize(category),
  };
}
