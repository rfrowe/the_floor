# Task 58: Image Step — OpenAI Image Generation

**Status**: 📋 NOT STARTED
**Priority**: HIGH
**Complexity**: Medium
**Estimated effort**: 2 days

## Objective

Build the images step: generate an image per card with OpenAI (`gpt-image-1`), store each as a base64 data URL on the corresponding slide, with lazy per-card generation, a concurrency-limited "Generate all", and per-card loading/error/retry.

## Background

Image source is **OpenAI generation** (locked decision) — same key, no second API or attribution handling. Slides store images as base64 data URLs (`slide.imageUrl`, validated to start with `data:image/` in `src/utils/jsonImport.ts:62-75`), which is exactly what `gpt-image-1` can produce. Images are generated **lazily** so the user doesn't pay for 50 images up front.

## Acceptance Criteria

- [ ] Add `generateImage(prompt)` → `Promise<string /* data URL */>` to the OpenAI service (`src/services/openai/images.ts`), using `gpt-image-1` and converting the returned base64 to a `data:image/...;base64,...` URL.
- [ ] `ImagesStep` lists slides/cards; each shows its current image (or an empty placeholder) and a **Generate / Regenerate** button.
- [ ] Generating a card flips its status to `loading`, awaits `generateImage(card.imagePrompt)`, dispatches `SET_SLIDE_IMAGE { index, dataUrl }`, then `done`; failures set `error` with retry.
- [ ] **Generate all** runs generation across cards with a **concurrency limit** (e.g. 3 at a time); per-card failures are isolated and retryable without blocking others.
- [ ] Per-card status lives in transient component state (`Map<cardId, 'idle'|'loading'|'done'|'error'>`); only the resulting data URL is persisted (via the draft).
- [ ] A short, honest caveat is shown: generated art may be less photo-accurate for specific real people/logos; reroll a single image if needed.
- [ ] Continue is allowed even if some slides lack images (the user decides); show how many remain blank.

## Implementation Guidance

### Files to create
- `src/services/openai/images.ts` — `generateImage`.
- `src/services/images/toDataUrl.ts` — `b64ToDataUrl(b64, mime)` and/or `blobToDataUrl(blob)` helpers.
- `src/components/studio/steps/ImagesStep.tsx` (+ `.module.css`)

### Service sketch
```ts
export async function generateImage(prompt: string, config: OpenAIConfig): Promise<string> {
  try {
    const client = getOpenAI(config);
    const res = await client.images.generate({ model: 'gpt-image-1', prompt, size: '1024x1024' });
    const b64 = res.data[0]?.b64_json;
    if (!b64) throw new GenerationError('parse', 'No image returned');
    return `data:image/png;base64,${b64}`;
  } catch (err) {
    throw toGenerationError(err);
  }
}
```

### Concurrency limiter
- A small `pLimit`-style helper (or a hand-rolled queue of size 3). Don't pull in a dependency if a ~15-line limiter suffices. Update each card's status as its task starts/finishes.

### Rendering current image
- Reuse `SlideViewer` (`src/components/slide/SlideViewer.tsx`) to show the slide image (it also previews any censor boxes from a later step), or a plain `<img>` for the grid thumbnail.

### Image prompt guidance (from SAMPLE_CATEGORY_ANALYSIS.md)
The image is generated from `card.imagePrompt`, which Task 56's `cardIdeas.ts` already shapes to
the sample-category style. To keep generated clues fair, this step must reinforce the same rules
(see `docs/tasks/phase-12-llm-studio/SAMPLE_CATEGORY_ANALYSIS.md`, section 6 and the "Images"
prompt-writing directives):

- **One centered subject.** Depict exactly one subject — prominent and centered, instantly
  recognizable to a general audience as the intended thing (for a pun answer, the literal
  referent the player must leap from). No collages or split frames — one subject per image.
- **Fair clue, not answer-key.** The image should make a knowledgeable player *recognize* the
  subject, not hand them the spelled-out answer.
- **Append a hard no-text suffix to every generated prompt.** Before calling `gpt-image-1`, wrap
  `card.imagePrompt` with a suffix such as:
  > "Photorealistic, single centered subject, plain uncluttered background, absolutely no text,
  > letters, words, captions, logos, or watermarks anywhere in the image."

  This is the single most important constraint: keeping text out of the image is what lets the
  game skip manual censoring (censor boxes), so a clean, text-free image needs no censoring at all.

## Dependencies
**Required:** [Task 55](../task-55-openai-service-layer/PROMPT.md) (client/errors), [Task 57](../task-57-card-ideas-editor/PROMPT.md) (cards → derived slides), [Task 54](../task-54-credentials-management/PROMPT.md) (config), [Task 53](../task-53-studio-shell-and-state/PROMPT.md) (`SET_SLIDE_IMAGE`).
**Enables:** [Task 59](../task-59-censor-box-editor/PROMPT.md) (images are the canvas for censoring).

## Out of Scope
- Image **search** APIs (future).
- Uploading a custom image or pasting a URL (future).
- Censor boxes (Task 59).

## Testing Strategy
- `images.test.ts` — mock the client; assert `gpt-image-1` request shape, base64→data-URL conversion, and `GenerationError` on empty/failed responses.
- `toDataUrl.test.ts` — base64/blob → `data:` URL correctness.
- `ImagesStep.test.tsx` — generating one card sets its image; a failing card shows retry without affecting others; "Generate all" respects the concurrency cap (assert max in-flight via a controllable mock).

## Success Criteria
- Each card can get a generated image stored as a data URL; "Generate all" fills the set without overwhelming the API; failures are recoverable per card.
- `npm run build`, `npm test -- --run`, `npm run lint` pass.

## Notes
- Generated images are large; they flow into the draft (IndexedDB) — keep the debounce from Task 53 in mind so a burst of `SET_SLIDE_IMAGE` doesn't thrash writes.
- `gpt-image-1` returns base64 directly; if a custom base URL points at a backend that returns a URL instead, fall back to fetching it and converting via `blobToDataUrl` (CORS permitting).

## Related Tasks
- [Task 57](../task-57-card-ideas-editor/PROMPT.md), [Task 59](../task-59-censor-box-editor/PROMPT.md)
