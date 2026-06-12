/**
 * Shared type guards for validating parsed JSON responses without casts.
 *
 * `noUncheckedIndexedAccess` + the repo's ban on `as` mean we narrow `unknown`
 * with predicates rather than asserting shapes. {@link isRecord} is the building
 * block: once a value is a record, bracket access yields `unknown` we can narrow
 * field-by-field.
 */

/**
 * Narrow an `unknown` to an indexable record. Arrays are excluded so callers can
 * treat the result as a plain object map.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Narrow an `unknown` to a `string[]` (every element a string). */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
