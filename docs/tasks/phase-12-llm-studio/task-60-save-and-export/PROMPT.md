# Task 60: Save & Export

**Status**: 📋 NOT STARTED
**Priority**: HIGH (completes the wizard)
**Complexity**: Low–Medium
**Estimated effort**: 1–2 days

## Objective

Build the final step: assemble the finished category into a `StoredCategory`, save it to the local IndexedDB library (immediately playable), warn on duplicate names, clear the draft on success, and offer a **Download JSON** action so the user can open a pull request to contribute the category to the repo by hand.

## Background

Finished categories must use the existing shape so they're indistinguishable from imported ones. `useCategories().add(category: StoredCategory)` persists to IndexedDB and broadcasts to other tabs (`src/hooks/useCategories.ts:93-103`). `StoredCategory` assembly (nanoid id, `createdAt`, `thumbnailUrl`, `sizeInBytes`) is modeled in `src/utils/migrateCategories.ts`. `sizeInBytes` is **in-memory size via `object-sizeof`** (`calculateCategorySize` in `src/utils/storageUtils.ts`), **not** `JSON.stringify(...).length`. Duplicate-name detection exists: `getCategoriesByName` (`src/storage/indexedDB.ts`).

"Submit to git as a PR" resolves to **download JSON + manual PR** (locked decision): the app is a static SPA with no backend, and category JSON embeds 2.6–16 MB of base64 images, so committing via a browser-held token would bloat git and expose a token. The download produces an import-compatible file the user attaches to a PR (or re-imports elsewhere).

## Acceptance Criteria

- [ ] Create `buildStoredCategory(name, slides)` → `StoredCategory`: `id` via `nanoid`, `createdAt` ISO, `thumbnailUrl = slides[0]?.imageUrl ?? ''`, `sizeInBytes = calculateCategorySize({ name, slides })`.
- [ ] **Save to library** calls `useCategories().add(...)`; on success, clears the Studio draft (`clearStudioDraft` from Task 53) and shows confirmation with a link back to the Dashboard / Category Manager.
- [ ] **Duplicate name** — before saving, check `getCategoriesByName(name)`; if a match exists, warn and offer rename or save-anyway.
- [ ] **Download JSON** — serialize to the import-compatible shape and trigger a download via `Blob` + `URL.createObjectURL` + a temporary `<a download>`; filename from a slugified category name.
- [ ] A short note explains how to open a PR with the downloaded file (add it under `public/categories/`).
- [ ] The save step summarizes the category (name, slide count, how many slides have images / censor boxes) before committing.

## Implementation Guidance

### Files to create
- `src/utils/buildStoredCategory.ts`
- `src/utils/categoryToFileName.ts` — slugify the name for the download filename.
- `src/components/studio/steps/SaveStep.tsx` (+ `.module.css`)

### Builder sketch
```ts
import { nanoid } from 'nanoid';
import { calculateCategorySize } from '@utils/storageUtils';

export function buildStoredCategory(name: string, slides: Slide[]): StoredCategory {
  const category = { name, slides };
  return {
    ...category,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    thumbnailUrl: slides[0]?.imageUrl ?? '',
    sizeInBytes: calculateCategorySize(category),
  };
}
```

### Export shape
- Match the format the importer accepts. Sample categories on disk use the nested `{ "category": { "name", "slides" } }` shape (`src/utils/sampleCategories.ts`, `src/utils/jsonImport.ts`). Confirm which the importer/`loadCategoryJSON` expects and emit that so the file round-trips through the existing import path.

### Reuse
- Validation reference for slide shape: `isSlide` in `src/utils/jsonImport.ts:62-75` (imageUrl must start with `data:image/`).
- Save pattern + broadcast: `src/hooks/useCategories.ts`.

## Dependencies
**Required:** [Task 53](../task-53-studio-shell-and-state/PROMPT.md) (`clearStudioDraft`, draft → category data), [Task 59](../task-59-censor-box-editor/PROMPT.md) (finished slides). Consumes output of [Task 57](../task-57-card-ideas-editor/PROMPT.md) / [Task 58](../task-58-image-generation/PROMPT.md).
**Enables:** completes the wizard.

## Out of Scope
- **In-browser PAT-based PR submission** (future; would commit multi-MB base64 to git and store a GitHub token in the browser — see [PHASE_PROPOSAL.md](../PHASE_PROPOSAL.md) Future Enhancements).
- Re-importing a category into the Studio to edit (future).
- Versioning / duplicate-category management beyond the name check.

## Testing Strategy
- `buildStoredCategory.test.ts` — id present/unique-ish, `createdAt` is ISO, `thumbnailUrl` = first slide's image (or `''` when none), `sizeInBytes` computed via `calculateCategorySize` (>0).
- `categoryToFileName.test.ts` — slugification (spaces, punctuation, casing, empty).
- `SaveStep.test.tsx` — save calls `add` and clears the draft; duplicate name triggers the warning; Download creates a blob (`URL.createObjectURL` mocked) with the expected filename and import-compatible JSON.

## Success Criteria
- A finished category saves to the library and appears in gameplay; the downloaded JSON re-imports cleanly via the existing importer; the draft is cleared after save.
- `npm run build`, `npm test -- --run`, `npm run lint` pass.

## Notes
- `sizeInBytes` MUST use `calculateCategorySize` to stay consistent with existing rows and the `CategoryStorage` estimates — do not substitute JSON length.
- After saving, returning to the Studio should start fresh (no stale draft).

## Related Tasks
- [Task 59](../task-59-censor-box-editor/PROMPT.md)
- Reuses storage/import utilities from Task 30 (Category Manager) and Task 50 (Sample Categories).
