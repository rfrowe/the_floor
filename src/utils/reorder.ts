/**
 * Pure list-reordering helper shared by the Studio Cards step's keyboard
 * Move up/down controls and its native drag-and-drop reorder. Kept in its own
 * module so the component file exports only components (react-refresh) and so
 * the move math is unit-testable in isolation.
 */

/**
 * Return a new array with the item at `from` moved so it lands at `to`, using
 * insert-before semantics in the *original* indexing: `to` is the index the
 * item would be inserted before (0..length), so `to === length` appends.
 *
 * Pure and total: any no-op or out-of-range request returns a shallow copy of
 * the input unchanged, so callers can compare and skip a redundant dispatch.
 */
export function moveCard<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length || to < 0 || to > items.length) {
    return items.slice();
  }
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return items.slice();
  // After removing `from`, every index past it shifts left by one.
  const insertAt = to > from ? to - 1 : to;
  next.splice(insertAt, 0, moved);
  return next;
}
