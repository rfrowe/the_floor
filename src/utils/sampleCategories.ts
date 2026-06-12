/**
 * Utility for fetching and managing sample categories from public/categories
 * These are demo categories available on GitHub Pages deployment
 *
 * Uses Vite's import.meta.glob to dynamically discover available categories at build time
 */

import type { Category } from '@types';

/**
 * Sample category metadata (name only, fetched from public directory)
 */
export interface SampleCategoryMeta {
  name: string;
  filename: string;
  sizeBytes?: number;
}

/**
 * Get list of available sample categories.
 *
 * Filenames are discovered from public/categories at build time and injected as
 * `__SAMPLE_CATEGORY_FILES__` (see vite.config.ts). This avoids `import.meta.glob`,
 * which would bundle each multi-MB JSON into an unused JS chunk and bloat the build.
 * @returns Array of sample category metadata
 */
export function getSampleCategories(): SampleCategoryMeta[] {
  const filenames = __SAMPLE_CATEGORY_FILES__;

  const categories: SampleCategoryMeta[] = filenames.map((filename) => ({
    // Display name: "Dogs.json" -> "Dogs"
    name: filename.replace(/\.json$/i, ''),
    filename,
  }));

  // Sort alphabetically by name
  categories.sort((a, b) => a.name.localeCompare(b.name));

  return categories;
}

/**
 * Build the request URL for a sample category file.
 *
 * This is the single source of truth for sample-category URLs. It MUST be used
 * everywhere a category is fetched OR cached so that the offline cache key
 * (written by the offline-download flow) is byte-identical to the URL requested
 * at runtime by {@link fetchSampleCategory}. If the two ever drift (e.g. one
 * encodes the filename and the other does not), the service worker's CacheFirst
 * route misses and falls through to a network fetch that fails offline.
 *
 * @param filename - The filename of the sample category (e.g., "Dogs.json")
 * @returns Absolute, base-path-aware URL (e.g., "/categories/The%20Real%20Housewives.json")
 */
export function getSampleCategoryUrl(filename: string): string {
  const basePath = import.meta.env.BASE_URL || '/';
  return `${basePath}categories/${encodeURIComponent(filename)}`;
}

/**
 * Fetch a sample category by filename
 * @param filename - The filename of the sample category (e.g., "Dogs.json")
 * @returns Promise resolving to the category data and file size
 */
export async function fetchSampleCategory(
  filename: string
): Promise<{ category: Category; sizeBytes?: number }> {
  const url = getSampleCategoryUrl(filename);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sample category: ${response.statusText}`);
  }

  // Try to get size from Content-Length header
  let sizeBytes: number | undefined;
  const contentLength = response.headers.get('Content-Length');
  if (contentLength) {
    sizeBytes = parseInt(contentLength, 10);
  }

  const data = (await response.json()) as { category: Category } | Category;

  // Handle nested category structure (sample files have { category: { name, slides } })
  const category = 'category' in data ? data.category : data;

  // Validate that it has required fields
  if (!category.name || !Array.isArray(category.slides)) {
    throw new Error('Invalid category format');
  }

  // If we didn't get Content-Length, calculate size from stringified JSON
  if (!sizeBytes) {
    const jsonString = JSON.stringify(category);
    sizeBytes = new Blob([jsonString]).size;
  }

  return { category, sizeBytes };
}

/**
 * Check if sample categories are available (GitHub Pages deployment)
 * @returns Promise resolving to true if sample categories are accessible
 */
export async function areSampleCategoriesAvailable(): Promise<boolean> {
  try {
    // Try to fetch one known sample category to test availability
    const categories = getSampleCategories();
    if (categories.length === 0) {
      return false;
    }

    const testFilename = categories[0]?.filename;
    if (!testFilename) {
      return false;
    }

    const testUrl = getSampleCategoryUrl(testFilename);
    const response = await fetch(testUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
