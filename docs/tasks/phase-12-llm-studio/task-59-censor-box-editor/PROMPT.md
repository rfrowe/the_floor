# Task 59: Censor Step — Draw & Delete Boxes

**Status**: 📋 NOT STARTED
**Priority**: HIGH
**Complexity**: High (new interactive component)
**Estimated effort**: 3–4 days

## Objective

Build an interactive censor-box editor and the step that hosts it: the user draws censor boxes on each slide's image by dragging a rectangle, can select a box and delete it (mistaken boxes), and the boxes persist on the slide in the existing `%`-coordinate model. Today the app only *renders* censor boxes — this task adds the first draw/edit UI.

## Background

`CensorBox` (`src/components/slide/CensorBox.tsx`) renders a box positioned with CSS `%` (x/y/width/height, 0–100). `SlideViewer` (`src/components/slide/SlideViewer.tsx`) computes the rendered image's pixel `imageBounds` from `getBoundingClientRect()` (reset/cached path `:31-60`, `handleImageLoad` `:62-80`) and overlays boxes within those bounds (`:101-148`). The editor must reuse this exact math so authored boxes render identically in gameplay. The data model is unchanged: `Slide.censorBoxes: CensorBox[]`.

The repo's ESLint enforces `jsx-a11y` (`click-events-have-key-events`); see the interactive-overlay pattern in `CLAUDE.md`. Using real `<button>` elements for selectable boxes satisfies this for free.

## Acceptance Criteria

### `censorGeometry` (pure math — the testable core)
- [ ] `normalizeRect(start, end)` → positive-dimension `{ x, y, w, h }` (handles dragging in any direction).
- [ ] `pxRectToCensorBox(rect, boundsW, boundsH, color)` → `CensorBox` with each field as a clamped `%` (0–100), `x+width ≤ 100`, `y+height ≤ 100` — the exact inverse of `CensorBox.tsx:40-44`.
- [ ] `censorBoxToPxRect(box, boundsW, boundsH)` → pixel rect (for hit-testing/handles).
- [ ] A minimum-size threshold (e.g. <1% w/h) so stray clicks don't create boxes.

### `CensorBoxEditor`
- [ ] Props `{ slide: Slide; defaultColor?: string; onChange: (boxes: CensorBox[]) => void }`.
- [ ] Renders the image + an absolutely-positioned overlay sized to `imageBounds` (reuse the `SlideViewer` approach) and recomputes bounds on resize (`ResizeObserver`).
- [ ] Pointer flow on the overlay: `pointerdown` records the start (via `getBoundingClientRect()` + `setPointerCapture`), `pointermove` shows an in-progress rectangle, `pointerup` converts to a `CensorBox` (discarding sub-threshold draws) and calls `onChange`.
- [ ] Committed boxes render with `CensorBox` for visual parity, each wrapped in a focusable `<button>` (same `%` placement) for selection.
- [ ] Selecting a box (click/focus) highlights it; **Delete/Backspace** on a selected box removes it; an explicit **Delete box** button (enabled only when selected) also removes it.
- [ ] **Undo last** and **Clear all** affordances.

### `CensorStep`
- [ ] Filmstrip / prev-next navigation across slides; per slide, renders `CensorBoxEditor` and dispatches `SET_SLIDE_CENSOR_BOXES { index, boxes }`.
- [ ] Slides with no image are skipped or clearly marked.

## Implementation Guidance

### Files to create
- `src/utils/censorGeometry.ts`
- `src/components/studio/CensorBoxEditor.tsx` (+ `CensorBoxEditor.module.css`)
- `src/components/studio/steps/CensorStep.tsx` (+ `.module.css`)

### Coordinate conversion sketch
```ts
export function pxRectToCensorBox(r: Rect, bw: number, bh: number, color: string): CensorBox {
  const x = clamp((r.x / bw) * 100, 0, 100);
  const y = clamp((r.y / bh) * 100, 0, 100);
  const width = clamp((r.w / bw) * 100, 0, 100 - x);
  const height = clamp((r.h / bh) * 100, 0, 100 - y);
  return { x, y, width, height, color };
}
```

### a11y
- Committed boxes are `<button type="button" aria-label={`Censor box ${i + 1}`}>` — native keyboard handling, no manual `role`/`tabIndex` dance.
- The drawing overlay is a non-button surface: follow the `CLAUDE.md` interactive-overlay pattern (role/tabIndex/onKeyDown) or keep it pointer-only with an accessible alternative (the explicit Delete button + Clear all) so keyboard users can still manage boxes.

### Reuse
- Copy the two-RAF `imageBounds` measurement from `SlideViewer.tsx:62-80` and the cached-image path `:37-55`. Add a `ResizeObserver` (the editor is interactive; the window/layout can change).

## Dependencies
**Required:** [Task 58](../task-58-image-generation/PROMPT.md) (slides have images), [Task 53](../task-53-studio-shell-and-state/PROMPT.md) (`SET_SLIDE_CENSOR_BOXES`).
**Enables:** [Task 60](../task-60-save-and-export/PROMPT.md).

## Out of Scope
- Resizing/moving an existing box via handles (MVP = draw + delete + undo + clear).
- Automatic / CV-based censor suggestions (future).
- Censoring non-image content.

## Testing Strategy
- `censorGeometry.test.ts` (highest value — pure math): px→%→px round-trips; edge clamping; negative-direction drag normalization; sub-threshold rejection.
- `CensorBoxEditor.test.tsx`: stub `getBoundingClientRect` (jsdom returns zeros — mirror the existing `SlideViewer.test.tsx` mocking); simulate `pointerdown`/`pointermove`/`pointerup` and assert the emitted box's `%`; click a box to select; press Delete to remove; Delete button disabled when nothing is selected.

## Success Criteria
- A user can draw boxes that visually match how they render in `SlideViewer`, select and delete mistakes, and the boxes persist on the slide.
- `npm run build`, `npm test -- --run`, `npm run lint` pass.

## Notes
- The `%` model means boxes are resolution-independent — authored once, correct at any display size (the whole reason `SlideViewer` stores `%`).
- Keep `censorGeometry` free of React so it's trivially unit-testable and reusable.

## Related Tasks
- [Task 58](../task-58-image-generation/PROMPT.md), [Task 60](../task-60-save-and-export/PROMPT.md)
- Rendering parity: `src/components/slide/CensorBox.tsx`, `src/components/slide/SlideViewer.tsx`.
