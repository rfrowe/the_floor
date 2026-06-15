/**
 * Turn a category name into a safe download filename.
 *
 * Used by the Studio Save step's "Download JSON" action so the exported file
 * has a tidy, slugified name (e.g. "The Real Housewives!" → "the-real-housewives.json")
 * that the user can drop straight into `public/categories/` for a PR.
 */

/**
 * Slugify a category name: lowercase, strip diacritics, replace any run of
 * non-alphanumeric characters with a single hyphen, and trim leading/trailing
 * hyphens. Returns a fallback slug when the name has no usable characters.
 */
export function slugifyCategoryName(name: string, fallback = 'category'): string {
  const slug = name
    .normalize('NFKD')
    // Strip combining diacritical marks left behind by NFKD decomposition.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // Collapse any run of non-alphanumeric characters into a single hyphen.
    .replace(/[^a-z0-9]+/g, '-')
    // Trim leading/trailing hyphens.
    .replace(/^-+|-+$/g, '');

  return slug.length > 0 ? slug : fallback;
}

/**
 * Build the download filename for a category JSON export.
 *
 * @param name The category name (may contain spaces/punctuation/casing).
 * @returns A slugified filename ending in `.json`.
 */
export function categoryToFileName(name: string): string {
  return `${slugifyCategoryName(name)}.json`;
}
