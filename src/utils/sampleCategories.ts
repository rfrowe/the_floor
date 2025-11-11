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
}

/**
 * Get list of available sample categories
 * Uses Vite's glob import to discover files at build time
 * @returns Array of sample category metadata
 */
export function getSampleCategories(): SampleCategoryMeta[] {
  // Vite's import.meta.glob returns a record of file paths at build time
  // This is statically analyzed and doesn't actually import the files yet
  const categoryFiles = import.meta.glob('/public/categories/*.json', {
    eager: false,
    import: 'default',
  });

  const categories: SampleCategoryMeta[] = [];

  for (const path in categoryFiles) {
    // Extract filename from path: "/public/categories/Dogs.json" -> "Dogs.json"
    const filename = path.split('/').pop();
    if (filename) {
      // Extract display name: "Dogs.json" -> "Dogs"
      const name = filename.replace(/\.json$/i, '');
      categories.push({ name, filename });
    }
  }

  // Sort alphabetically by name
  categories.sort((a, b) => a.name.localeCompare(b.name));

  return categories;
}

/**
 * Fetch a sample category by filename
 * @param filename - The filename of the sample category (e.g., "Dogs.json")
 * @returns Promise resolving to the category data
 */
export async function fetchSampleCategory(filename: string): Promise<Category> {
  const basePath = import.meta.env.BASE_URL || '/';
  const url = `${basePath}categories/${encodeURIComponent(filename)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sample category: ${response.statusText}`);
  }

  const data = (await response.json()) as { category: Category } | Category;

  // Handle nested category structure (sample files have { category: { name, slides } })
  const category = 'category' in data ? data.category : data;

  // Validate that it has required fields
  if (!category.name || !Array.isArray(category.slides)) {
    throw new Error('Invalid category format');
  }

  return category;
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

    const basePath = import.meta.env.BASE_URL || '/';
    const testFilename = categories[0]?.filename;
    if (!testFilename) {
      return false;
    }

    const testUrl = `${basePath}categories/${encodeURIComponent(testFilename)}`;
    const response = await fetch(testUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
