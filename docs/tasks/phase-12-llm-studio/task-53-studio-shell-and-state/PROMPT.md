# Task 53: Studio Shell, Navigation & Wizard State

**Status**: 📋 NOT STARTED
**Priority**: HIGH (foundational — all other Phase 12 tasks build on this)
**Complexity**: High
**Estimated effort**: 3–4 days

## Objective

Stand up the LLM Studio's skeleton: a `/studio` route reachable from a "Studio" button in the Dashboard header, a step-based page shell (`Studio.tsx` + `StudioStepper`), the wizard state machine (`useStudioState` reducer over a serializable `StudioDraft`), the shared Studio types, and draft persistence to a new IndexedDB store so in-progress work survives a refresh.

## Background

"The Floor" has no in-app way to *create* a category — only PPTX parsing and JSON import. Phase 12 adds a guided wizard (see [PHASE_PROPOSAL.md](../PHASE_PROPOSAL.md)). This task delivers the container everything else plugs into. No OpenAI calls happen here; steps render placeholder content until their dedicated tasks land.

Routing today is React Router in `src/App.tsx:15-23` (`<BrowserRouter basename={import.meta.env.BASE_URL}>` → `<Routes>`). The Dashboard header lives at `src/pages/Dashboard.tsx:338-362`. There is **no global React Context** — state lives in hooks backed by IndexedDB/`localStorage` with `BroadcastChannel` sync.

## Acceptance Criteria

### Navigation
- [ ] Add a `/studio` route in `src/App.tsx` rendering `<Studio />` (lazy-loaded via `React.lazy` + `Suspense` so the OpenAI SDK added in Task 55 stays off the gameplay bundle).
- [ ] Add a **"Studio"** `LinkButton to="/studio" variant="secondary"` in the Dashboard header (`src/pages/Dashboard.tsx`), beside "Manage Categories".
- [ ] `Studio.tsx` renders inside `<Container>` with a header (title + `ThemeToggle` + a "Back to Dashboard" link) following page conventions in `src/pages/Dashboard.tsx`.

### Types
- [ ] Create `src/types/studio.ts` with the `StudioStep` union, `StudioDraft`, `CardIdea`, and `StudioImageSource` types (below) and re-export from `src/types/index.ts`.

### State machine
- [ ] Create `useStudioState` (reducer) holding a single `StudioDraft` plus actions: `SET_STEP`, `SET_CATEGORY_NAME`, `SET_CARDS`, `UPDATE_CARD`, `DELETE_CARD`, `ADD_CARD`, `SET_SLIDE_IMAGE`, `SET_SLIDE_CENSOR_BOXES`, `HYDRATE_DRAFT`, `RESET`.
- [ ] Step guards: cannot advance to `cards` without a confirmed `categoryName`; cannot advance to `images` with zero cards. Expose a derived `canAdvance`.
- [ ] On entering the `images` step, derive one `Slide` per card: `{ imageUrl: '', answer: card.answer, censorBoxes: [] }` (preserving order).

### Stepper UI
- [ ] `StudioStepper` shows the six steps (`Credentials → Category name → Cards → Images → Censor → Save`), highlights the current one, and supports Back. Disabled/locked states reflect `canAdvance`.

### Draft persistence
- [ ] Bump `DB_VERSION` 2→3 in `src/storage/indexedDB.ts` and add a `studio-drafts` object store (keyPath `'id'`) in an `if (oldVersion < 3)` upgrade block (mirror the existing `categories` upgrade).
- [ ] Add `getStudioDraft`, `putStudioDraft`, `clearStudioDraft` to `src/storage/indexedDB.ts`, mirroring the category functions.
- [ ] `useStudioState` persists the draft **debounced (~500ms)** on change, hydrates on mount, and offers **Resume / Start over** when a draft exists (mirror the Dashboard "Resume Duel" affordance at `src/pages/Dashboard.tsx:~342-346`).
- [ ] Clearing the draft (Start over, or after a successful save in Task 60) removes the `studio-drafts` row.

## Implementation Guidance

### Files to create
- `src/pages/Studio.tsx` — route component; reads `useStudioState`, renders `StudioStepper` + the active step (placeholders for now), Back/Continue controls, and the Resume prompt.
- `src/pages/Studio.module.css` — layout using theme tokens from `src/styles/theme.css`.
- `src/components/studio/StudioStepper.tsx` (+ `.module.css`) — progress indicator.
- `src/types/studio.ts` — domain types.
- `src/hooks/useStudioState.ts` — the reducer hook.
- `src/hooks/useStudioDraftStore.ts` — thin load/save/clear wrapper over the IndexedDB functions (keeps `useStudioState` storage-agnostic and testable).

### Files to modify
- `src/App.tsx` — add the lazy route.
- `src/pages/Dashboard.tsx` — add the Studio `LinkButton`.
- `src/storage/indexedDB.ts` — `DB_VERSION` bump, `studio-drafts` store, draft CRUD.
- `src/types/index.ts` — `export * from './studio'`.

### Types sketch
```ts
export type StudioStep =
  | 'credentials' | 'categoryName' | 'cards' | 'images' | 'censor' | 'save';

export type StudioImageSource = 'openai'; // search reserved for future

export interface CardIdea {
  id: string;            // nanoid — stable React key for mid-list edits
  answer: string;
  imageKeywords: string; // retained for future search
  imagePrompt: string;   // drives Task 58 image generation
}

export interface StudioDraft {
  version: 1;
  id: 'current';         // single-row store
  step: StudioStep;
  categoryName: string | null;
  cards: CardIdea[];
  slides: Slide[];       // from '@types'; filled in Tasks 58/59
  imageSource: StudioImageSource;
  updatedAt: string;
}
```

### Notes on reuse
- ID generation: `nanoid` is already used in `src/utils/migrateCategories.ts:14`.
- Page/CSS conventions and the `const x = styles['key'] ?? ''` access pattern: see `src/pages/Dashboard.tsx` and the CSS Modules note in `CLAUDE.md`.
- Adding a route: `src/pages/ComponentsDemo.tsx` is registered at `/components` in `src/App.tsx:20` — same pattern.
- Keep transient UI flags (e.g. "is generating") out of the persisted draft — either component-local state or a non-persisted slice of the reducer.

## Dependencies

**Required:** none (this is the foundation).
**Enables:** Tasks 54–60.

## Out of Scope
- Any OpenAI calls or step *content* logic (placeholders only).
- Credentials handling (Task 54).
- The censor editor and image generation (Tasks 58/59).

## Testing Strategy
- `useStudioState.test.ts` — reducer transitions; guards (no advance without name/cards); `images`-entry slide derivation; `HYDRATE_DRAFT`; `RESET` clears state.
- `useStudioDraftStore.test.ts` — put/get/clear against `fake-indexeddb` (already a dev dep); v3 upgrade creates the store.
- `Studio.test.tsx` — renders; stepper reflects current step; Resume prompt appears when a seeded draft exists; "Start over" clears it.
- Add a smoke assertion that the Dashboard renders the new Studio button.

## Success Criteria
- Navigating to `/studio` (or clicking the header button) shows the stepper and step 1 placeholder.
- A draft persists across reload and can be resumed or discarded.
- `npm run build`, `npm test -- --run`, `npm run lint` pass.

## Notes
- Drafts must NOT use `localStorage`: slides carry multi-MB base64 images that exceed its ~5 MB quota (`src/storage/localStorage.ts` already special-cases `QuotaExceededError`). IndexedDB is the same family used for categories.
- Debounce draft writes so per-keystroke/box-draw edits don't thrash IndexedDB.

## Related Tasks
- [Task 54](../task-54-credentials-management/PROMPT.md), [Task 60](../task-60-save-and-export/PROMPT.md)
- Reuses storage patterns from Task 30 (Category Manager) and Task 50 (Sample Categories).
