# Task 56: Category Name Step — Batched Generation + Prefetch

**Status**: 📋 NOT STARTED
**Priority**: HIGH
**Complexity**: Medium
**Estimated effort**: 2 days

## Objective

Build the category-name step: on entry the app generates a *batch* of candidate names; a dice/reroll button cycles to the next instantly; the next batch is **prefetched before the current one runs out** so rerolls never lag. Extract the batching+prefetch logic into a reusable `useBatchedGenerator<T>` hook.

## Background

The user wanted the name picker to feel instant — "batch generate to avoid calling the API every re-roll, but also call for the next batch before we run out to avoid UI lag." `generateCategoryNames(count)` (Task 55) supplies a batch. A similar background-prefetch pattern already exists in the codebase: `IndividualPreview` preloads the *next* sample category while showing the current one (`src/components/category/manager/IndividualPreview.tsx:122-146`) — mirror that intent.

## Acceptance Criteria

### `useBatchedGenerator<T>`
- [ ] Signature: `useBatchedGenerator<T>({ fetchBatch, batchSize, prefetchThreshold, enabled })` → `{ current, next, isLoading, error, retry }`.
- [ ] Maintains a `buffer: T[]` (in a `useRef`, so consumption doesn't re-render) and a `cursor` in state; `current = buffer[cursor]`.
- [ ] `next()` advances the cursor **synchronously** (no awaiting), so the dice is instant when candidates are buffered.
- [ ] After `next()` (or initial mount when `enabled`), if `remaining = buffer.length - 1 - cursor <= prefetchThreshold` and no fetch is in flight, prefetch `fetchBatch(batchSize)` and append.
- [ ] In-flight guard (`fetchingRef`) prevents duplicate concurrent fetches; a `requestSeq` guard drops stale/after-unmount resolutions.
- [ ] `isLoading` is true only when `current` is empty AND a fetch is in flight (i.e. the user is actually waiting).
- [ ] Errors set `error` (typed `GenerationError`) but keep already-buffered candidates usable; `retry()` re-attempts.

### `CategoryNameStep`
- [ ] On entry (with `isConfigured`), shows the current candidate; **🎲 Reroll** calls `next()`.
- [ ] **Use this name** confirms → `SET_CATEGORY_NAME` + advance.
- [ ] User may also type/override a custom name.
- [ ] Loading and error states (with retry) are shown inline.

## Implementation Guidance

### Files to create
- `src/hooks/useBatchedGenerator.ts`
- `src/components/studio/steps/CategoryNameStep.tsx` (+ `.module.css`)

### Wiring
```ts
const [config] = useCredentials();
const gen = useBatchedGenerator<string>({
  fetchBatch: () => generateCategoryNames(10),
  batchSize: 10,
  prefetchThreshold: 3,
  enabled: isConfigured,
});
// 🎲 → gen.next();  Use this name → dispatch SET_CATEGORY_NAME(gen.current)
```

### Prefetch logic sketch
```ts
const advanceAndMaybePrefetch = () => {
  setCursor((c) => {
    const nextCursor = c + 1;
    const remaining = bufferRef.current.length - 1 - nextCursor;
    if (remaining <= prefetchThreshold) void prefetch();
    return nextCursor;
  });
};
```

### De-duplication
- Append only names not already in `buffer` (case-insensitive) so the dice never shows repeats. If a whole batch is duplicates, fetch one more (bounded retry) so the user always gets a fresh option.

## Dependencies
**Required:** [Task 55](../task-55-openai-service-layer/PROMPT.md) (`generateCategoryNames`), [Task 54](../task-54-credentials-management/PROMPT.md) (`isConfigured`), [Task 53](../task-53-studio-shell-and-state/PROMPT.md) (step host + `SET_CATEGORY_NAME`).
**Enables:** [Task 57](../task-57-card-ideas-editor/PROMPT.md) (confirmed name feeds card generation).

## Out of Scope
- Card idea generation (Task 57).
- Persisting the candidate buffer (only the *confirmed* name lives in the draft).

## Testing Strategy
- `useBatchedGenerator.test.ts` (renderHook + a mocked `fetchBatch`):
  - initial fetch populates the buffer;
  - `next()` advances synchronously;
  - prefetch fires exactly once when crossing `prefetchThreshold`;
  - no duplicate in-flight fetches;
  - error on initial vs. error on prefetch behave per spec;
  - stale resolution after unmount is dropped.
- `CategoryNameStep.test.tsx` — reroll updates the shown name; "Use this name" dispatches; error state shows retry.

## Success Criteria
- Rerolling is visibly instant; the network tab shows a *new* batch fetched while candidates remain (not on every click).
- `npm run build`, `npm test -- --run`, `npm run lint` pass.

## Notes
- Keep the hook generic — it will later be reusable for other "buffered suggestions" needs.
- Guard all background work against unmount; this step is easy to navigate away from.

## Related Tasks
- [Task 55](../task-55-openai-service-layer/PROMPT.md), [Task 57](../task-57-card-ideas-editor/PROMPT.md)
- Prefetch reference: `src/components/category/manager/IndividualPreview.tsx:122-146`.
