# Task 57: Card Ideas Step — Editable List

**Status**: 📋 NOT STARTED
**Priority**: HIGH
**Complexity**: Medium
**Estimated effort**: 2–3 days

## Objective

Build the cards step: prepopulate ~50 card ideas for the confirmed category via one LLM call, then let the user reroll all, edit an individual card, delete a card, or add a blank card. On leaving the step, the draft holds the finalized `CardIdea[]` (and derived `Slide[]`) ready for image generation.

## Background

Sample categories carry ~50 slides (41–52; 50 is the norm) — see `src/utils/sampleCategories.ts` and the counts noted in [PHASE_PROPOSAL.md](../PHASE_PROPOSAL.md). The default card count is **~50** (locked decision); the count is editable. `generateCardIdeas(name, count)` (Task 55) returns the batch in one call (cheap text generation — images are deferred to Task 58).

## Acceptance Criteria

- [ ] On entering the step with no cards, call `generateCardIdeas(categoryName, 50)` once and populate the list (loading overlay while pending).
- [ ] **Reroll all** — confirm-gated; replaces the whole list with a fresh `generateCardIdeas` call.
- [ ] **Edit** — inline edit of a card's `answer` (and optionally `imagePrompt`/`imageKeywords`) → `UPDATE_CARD`.
- [ ] **Delete** — remove a card → `DELETE_CARD`.
- [ ] **Add** — append a blank card (nanoid id, empty fields) for manual entry → `ADD_CARD`.
- [ ] Each card row uses its stable `nanoid` `id` as the React key (correct behavior when deleting/adding mid-list).
- [ ] The card count is shown; a soft warning appears if it drifts far from ~50.
- [ ] Continue is enabled only when ≥1 card has a non-empty `answer`.

## Implementation Guidance

### Files to create
- `src/components/studio/steps/CardsStep.tsx` (+ `.module.css`)
- `src/components/studio/CardListItem.tsx` — presentational editable row (answer field, prompt field, delete button).

### Behavior
- Reroll-all and the initial generation share one async path; both dispatch `SET_CARDS`. Show a single overlay spinner; surface `GenerationError` with retry.
- Per-card image *status* is NOT handled here — that's Task 58's transient `Map<cardId, status>`. This step only edits idea text.
- Derive slides via the reducer when advancing to `images` (`SET_STEP` → derivation defined in Task 53): one `Slide` per card, order preserved.

### Reuse
- `SlideList` (`src/components/slide/SlideList.tsx`) demonstrates an edit-mode list with answer editing — reference for interaction/markup, though cards here have no image yet.
- Use the common `Button` component for actions; danger variant for delete/reroll-all confirmation.

## Dependencies
**Required:** [Task 55](../task-55-openai-service-layer/PROMPT.md) (`generateCardIdeas`), [Task 56](../task-56-category-name-generation/PROMPT.md) (confirmed name), [Task 53](../task-53-studio-shell-and-state/PROMPT.md) (`SET_CARDS`/`UPDATE_CARD`/`DELETE_CARD`/`ADD_CARD`, slide derivation).
**Enables:** [Task 58](../task-58-image-generation/PROMPT.md).

## Out of Scope
- Image generation/preview (Task 58).
- Slide reorder, undo/redo (future).
- Regenerating a *single* card's text (MVP supports edit + delete + add + reroll-all only).

## Testing Strategy
- `CardsStep.test.tsx` (mock `generateCardIdeas`):
  - initial entry generates once and renders the list;
  - reroll-all (after confirm) replaces the list with a single call;
  - edit mutates one card; delete removes the right card; add appends a blank;
  - deleting a middle card preserves the other cards' content (stable keys);
  - Continue disabled when all answers are empty.

## Success Criteria
- A confirmed category yields ~50 editable cards; the user can curate them freely; advancing carries the cards (and derived empty slides) forward.
- `npm run build`, `npm test -- --run`, `npm run lint` pass.

## Notes
- Keep the LLM call count to exactly one per (re)generation — never one call per card for *ideas*.
- Persisting cards is automatic via the draft (Task 53 debounced persistence).

## Related Tasks
- [Task 56](../task-56-category-name-generation/PROMPT.md), [Task 58](../task-58-image-generation/PROMPT.md)
