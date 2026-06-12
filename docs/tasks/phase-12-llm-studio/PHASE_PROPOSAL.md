# Phase 12: LLM Studio - AI-Powered Category Creation

## Overview

**The Studio** is a guided, in-app wizard that lets a user create a brand-new game category end-to-end using their own OpenAI key — without writing JSON or parsing a PPTX. The user is walked through a fixed sequence of steps: enter credentials, pick an AI-suggested category name, generate ~50 card ideas, generate an image for each card, draw censor boxes, and save the finished category to the local library (with a JSON download for contributing it back to the repo).

This is deliberately a **linear, opinionated wizard**, not a free-form editor. Each step produces one well-defined artifact and gates the next. The goal is the fastest possible path from "I want a new category" to a playable category.

## Vision

A non-technical host can sit down, paste an OpenAI key, and in a few minutes produce a polished category that drops straight into gameplay — names, images, and censoring included. The app does the heavy lifting (suggesting names, drafting ideas, generating art); the user stays in control by rerolling, editing, deleting, and censoring.

## Locked Decisions

These were decided up front and constrain every task in this phase:

| Decision | Choice | Rationale |
|---|---|---|
| **Image source** | **OpenAI image generation** (`gpt-image-1`) | Reuses the single OpenAI key — no second API, no extra CORS/attribution handling. Works for any subject. |
| **Default card count** | **~50** (matches sample categories) | Sample categories carry 41–52 slides (50 is the norm). Card *ideas* are one cheap LLM call; **images are generated lazily per card** so the user never pays for 50 images they don't want. |
| **Submit to repo** | **Download JSON + manual PR** (plus auto-save to the local library) | The app is a static SPA with no backend; category JSON embeds 2.6–16 MB of base64 images. A browser-held GitHub token + multi-MB commits is the wrong default. (In-browser PAT PR is noted as a future option.) |
| **Credentials storage** | **`localStorage`, plaintext, with a prominent warning** | Client-only encryption is security theater (the key would ship in the bundle). Honesty + a Clear button is the right posture. |

## Wizard Flow

```
Credentials → Category name → Cards → Images → Censor → Save
```

1. **Credentials** — Enter an OpenAI API key and (optionally) a custom OpenAI-compatible base URL. Stored in the browser. Choose nothing else; image source is fixed to OpenAI generation.
2. **Category name** — On entry (key present), the app generates a *batch* of candidate category names. A dice/reroll button cycles to the next candidate instantly; the next batch is prefetched *before* the current one runs out so rerolls never lag. Confirm a name to advance.
3. **Cards** — One LLM call prepopulates ~50 card ideas (answer + image keywords/prompt). The user can reroll all, edit an individual card, delete a card, or add a blank card.
4. **Images** — For each card, generate an image with OpenAI (`gpt-image-1`). Images are generated lazily per card (or via a concurrency-limited "Generate all"), each stored as a base64 data URL on the slide.
5. **Censor** — For each slide, the user draws censor boxes directly on the image (drag to draw a rectangle) and can delete a mistaken box (select + Delete, or a delete button). Reuses the existing `%`-coordinate censor model.
6. **Save** — Save the finished category to the local IndexedDB library (immediately playable) and/or download it as JSON to open a PR by hand.

Work-in-progress is **persisted as a draft** so a refresh or accidental navigation doesn't lose generated content.

## Use Cases

### Use Case 1: Create a category from scratch (primary)
Host opens Studio → dice through suggested names, picks "Cryptids" → 50 card ideas appear → tweaks a few answers, deletes two, adds one → generates images → censors the giveaway text on a handful of slides → saves. The category is now selectable in a duel.

### Use Case 2: Quick themed category for a one-off game
Host needs a category fast → accepts the first good name → "Generate all" images → minimal censoring → save + play.

### Use Case 3: Contribute a category to the repo
Host builds a polished category → downloads the JSON → opens a PR adding it to `public/categories/`.

## Technical Architecture

### Components
1. **Studio page + stepper** (React) — `/studio` route, a `StudioStepper` progress UI, and one component per step.
2. **Wizard state machine** — a `useStudioState` reducer holding a single serializable `StudioDraft`, persisted (debounced) to IndexedDB so drafts survive refresh.
3. **OpenAI service layer** — the official `openai` SDK configured for the browser with a custom base URL; a structured-output chat helper plus image generation; typed errors.
4. **Credentials store** — `useCredentials` over `localStorage` with cross-tab sync.
5. **Censor drawing editor** — a new interactive component (the app only *renders* boxes today).
6. **Save/export** — build a `StoredCategory`, persist via the existing category hook, and offer a JSON download.

### Data model (unchanged — reused as-is)
The Studio produces the existing types, so output drops straight into gameplay:
- `Category = { name: string; slides: Slide[] }` (`src/types/contestant.ts`)
- `Slide = { imageUrl: string /* base64 data URL */; answer: string; censorBoxes: CensorBox[] }` (`src/types/slide.ts`)
- `CensorBox = { x; y; width; height; color }` with x/y/width/height as **percentages (0–100)** of the rendered image (`src/types/slide.ts`)
- `StoredCategory = Category & { id; createdAt; thumbnailUrl; sizeInBytes? }`

### Persistence
- **Finished categories** → existing `useCategories().add` → IndexedDB `categories` store (`src/hooks/useCategories.ts`, `src/storage/indexedDB.ts`).
- **In-progress drafts** → a **new `studio-drafts` IndexedDB store** (bump `DB_VERSION` 2→3). Not `localStorage`: slides embed multi-MB base64 images that exceed the ~5 MB `localStorage` quota.
- **Credentials** → `localStorage` via the existing `useLocalStorage` hook.

### Data flow
```
OpenAI (names)  → dice/reroll → confirmed category name
OpenAI (ideas)  → ~50 CardIdea[] → user edits → Slide[] (no images yet)
OpenAI (images) → per card → base64 data URL → slide.imageUrl
user draws      → CensorBox[] → slide.censorBoxes
buildStoredCategory → useCategories().add → playable
                   ↘ download JSON → manual PR
```

## Scope

### In Scope (Phase 12 MVP)
- Studio page, stepper, and the six-step wizard flow
- OpenAI credentials (key + optional custom base URL) in `localStorage` with a security warning
- OpenAI **chat** for category-name and card-idea generation (structured JSON output)
- **Batched** name generation with **prefetch** for lag-free rerolls
- ~50 card ideas with reroll-all / edit / delete / add
- **OpenAI image generation** per card (lazy + "generate all")
- **Manual censor-box drawing** with delete (the new interactive editor)
- Draft persistence + resume
- Save to local library + JSON download

### Out of Scope (Future Phases)
- Image **search** APIs (Unsplash/Pexels) — superseded by OpenAI generation
- In-browser **PAT-based PR submission** (feasible but token-in-browser + git bloat)
- **Cost tracking / spend limits**
- **Prompt templates** / difficulty presets
- **Import an existing category to edit** in the Studio
- Automatic censor-box generation (computer vision)
- Slide reorder, undo/redo, video/audio slides, multi-user collaboration, cloud sync

## Task Breakdown

| Task | Title | Builds |
|---|---|---|
| **[53](./task-53-studio-shell-and-state/PROMPT.md)** | Studio Shell, Navigation & Wizard State | `/studio` route, header button, `Studio.tsx`, `StudioStepper`, `types/studio.ts`, `useStudioState` reducer, `studio-drafts` IndexedDB store + resume |
| **[54](./task-54-credentials-management/PROMPT.md)** | Credentials Management | `useCredentials` (localStorage), `CredentialsStep`, security warning + Clear |
| **[55](./task-55-openai-service-layer/PROMPT.md)** | OpenAI Service Layer | `openai` dep, configured client (base URL + browser), `structuredChat`, name/card generators, typed `GenerationError` |
| **[56](./task-56-category-name-generation/PROMPT.md)** | Category Name Step — Batched Generation + Prefetch | `useBatchedGenerator<T>`, `CategoryNameStep`, dice/reroll, prefetch, error/retry |
| **[57](./task-57-card-ideas-editor/PROMPT.md)** | Card Ideas Step — Editable List | `generateCardIdeas(name, ~50)`, `CardsStep`/`CardListItem`, reroll-all/edit/delete/add, derive `Slide[]` |
| **[58](./task-58-image-generation/PROMPT.md)** | Image Step — OpenAI Image Generation | `generateImage` (`gpt-image-1` → data URL), `ImagesStep` lazy per-card + concurrency-limited "generate all" |
| **[59](./task-59-censor-box-editor/PROMPT.md)** | Censor Step — Draw & Delete Boxes | `censorGeometry` (px↔%), `CensorBoxEditor` (draw/select/delete, a11y, ResizeObserver), `CensorStep` |
| **[60](./task-60-save-and-export/PROMPT.md)** | Save & Export | `buildStoredCategory`, save via `useCategories().add`, duplicate-name check, clear draft, download JSON |

**Dependency graph:** 53 → 54 → 55; 55 → {56, 57, 58}; 53 underpins all step tasks; 60 depends on 53 (draft store) and consumes the output of 57/58/59.

## Technical Considerations

### LLM prompt engineering
Use OpenAI Structured Outputs (`response_format: { type: 'json_schema', ... }`) so parsing is deterministic.

- **Names** — request N short, punchy, distinct category titles for a guessing game; the app de-dups case-insensitively across batches.
- **Cards** — for a confirmed category, request N items shaped as:
  ```json
  { "answer": "The Terminator", "imageKeywords": "terminator 1984 cyborg", "imagePrompt": "a chrome humanoid endoskeleton, dramatic lighting" }
  ```
  `answer` is the correct guess; `imagePrompt` drives image generation; `imageKeywords` is retained for future search support.

### OpenAI image generation
- Model: `gpt-image-1` (returns base64 directly; convert to a `data:` URL for `slide.imageUrl`).
- **Honesty caveat to surface in the UI:** generated art may be less photo-accurate for *specific* real people, logos, or brands than a real photo would be. Prompts should describe the subject so the image is a recognizable *clue* without spelling out the answer in text.
- Images are generated **on demand per card** (and via a rate-limited "Generate all") to control cost and latency.

### Security
- The OpenAI key lives in plaintext in `localStorage`, readable by any script on the origin. The UI must warn the user, recommend a spend-limited key, and offer a Clear button. The key is sent only to the configured OpenAI endpoint and is never logged.

### Error handling
- Map OpenAI failures to a typed `GenerationError` (`auth | rateLimit | network | cors | parse | unknown`) and show actionable inline messages with retry. A failed *prefetch* must not break already-buffered candidates; a failed *image* must not block other cards.
- Custom base URLs may not send permissive CORS headers — detect and surface this clearly.

## UI/UX Design

### Studio layout (step-based)
```
┌───────────────────────────────────────────────────────────┐
│ The Floor — Studio            [Theme]  [Back to Dashboard]  │
├───────────────────────────────────────────────────────────┤
│  ① Key  →  ② Name  →  ③ Cards  →  ④ Images  →  ⑤ Censor → ⑥ Save │   ← StudioStepper
├───────────────────────────────────────────────────────────┤
│                                                             │
│   [ current step renders here ]                             │
│                                                             │
│   e.g. Name step:    “Cryptids”        🎲 Reroll            │
│                      [ Use this name → ]                    │
│                                                             │
├───────────────────────────────────────────────────────────┤
│                                  [ ← Back ]   [ Continue → ]│
└───────────────────────────────────────────────────────────┘
```

### Resume prompt
On load, if a draft exists: offer **Resume** (hydrate the draft) or **Start over** (clear it) — mirrors the Dashboard "Resume Duel" affordance.

## Success Criteria
- [ ] A user with an OpenAI key can create and save a playable category without leaving the app
- [ ] Category names reroll instantly (batched + prefetched)
- [ ] ~50 card ideas prepopulate; cards can be rerolled/edited/deleted/added
- [ ] Each card gets an OpenAI-generated image stored as a data URL
- [ ] Censor boxes can be drawn and deleted per slide
- [ ] Drafts survive a page refresh
- [ ] Categories save to the library and download as importable JSON
- [ ] API key management is local with a clear security warning
- [ ] `npm run build`, `npm test -- --run`, and `npm run lint` all pass

## Timeline Estimate
- Task 53 (Shell + state): 3–4 days
- Task 54 (Credentials): 1–2 days
- Task 55 (OpenAI service): 2–3 days
- Task 56 (Name + prefetch): 2 days
- Task 57 (Cards): 2–3 days
- Task 58 (Images): 2 days
- Task 59 (Censor editor): 3–4 days
- Task 60 (Save/export): 1–2 days

**Total:** ~16–22 days (3–4 weeks)

## Risks and Mitigations
- **API cost** — lazy image generation, confirm-gated "reroll all" / "generate all", spend-limited key guidance.
- **LLM output quality** — structured outputs + full user editing (reroll/edit/delete/add).
- **Image fidelity** — surface the generation caveat; the user can reroll a single image.
- **Complex state** — single reducer + serializable draft + IndexedDB persistence.
- **Draft data size** — drafts live in IndexedDB (not localStorage); debounce writes.

## Resources
- [OpenAI API Docs](https://platform.openai.com/docs)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [OpenAI Images (`gpt-image-1`)](https://platform.openai.com/docs/guides/images)
- [OpenAI Node SDK — browser usage / `baseURL`](https://github.com/openai/openai-node)

## Future Enhancements (Post-Phase 12)
- Image **search** source (Unsplash/Pexels) as an alternative to generation
- In-browser **PAT-based PR submission** (with git-bloat/token caveats addressed, ideally via a Cloudflare Pages Function)
- **Cost tracking** and spend limits
- **Prompt templates** and difficulty presets
- **Import an existing category** into the Studio for editing
- Slide reorder, undo/redo, automatic (CV) censor suggestions

## Notes
- This is a major feature that touches storage (new IndexedDB store), routing, and a brand-new interactive censor editor.
- The Studio is a separate route, so its OpenAI SDK can be code-split (`React.lazy`) off the gameplay hot path.
- The Studio's output uses the *existing* `Slide`/`Category` types, so categories it produces are indistinguishable from imported ones in gameplay.

## Dependencies from Other Phases
- **Task 30: Category Manager** — the IndexedDB category store the Studio saves into.
- **Task 50: Sample Categories** — establishes the ~50-slide norm and the import-compatible JSON shape.
- **Task 06: PPTX Import** — the prior content-authoring path the Studio complements.
