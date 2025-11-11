# Task 49: Slide Preview Improvements

## Status
**COMPLETED** - Retroactive documentation for work completed on 2025-11-10

## Objective
Create a unified SlidePreview component with accordion behavior, answer censoring, and improved UX for reviewing and editing slide content in both CategoryManager and CategoryImporter views.

## Problem Statement

**Before this task:**
- CategoryManager and CategoryImporter had different slide display implementations
- All slides were always expanded, creating overwhelming long lists (50+ slides)
- Answers were visible by default, spoiling content during review
- Slides were being cut off in modal views due to overflow issues
- No way to focus on one slide at a time
- Editing answers required seeing spoilers

**User Pain Points:**
1. **Cognitive Overload:** Scrolling through 50 fully-expanded slides is overwhelming
2. **Spoilers:** Seeing all answers at once spoils the game content
3. **Poor Scannability:** Can't quickly scan through slide numbers
4. **Layout Issues:** Slides cut off horizontally in some views
5. **Inconsistent UX:** Different behavior in import vs manage views

## Acceptance Criteria

### SlidePreview Component
- [x] Create unified `SlidePreview` component used by both CategoryManager and CategoryImporter
- [x] Support two modes: `edit` (allows answer editing) and `readonly` (click to reveal)
- [x] Compact collapsed state showing only slide number
- [x] Expand to show full slide image, censor boxes, and answer
- [x] Visual expand/collapse indicator (chevron)

### Accordion Behavior
- [x] Only one slide can be expanded at a time
- [x] Clicking a new slide automatically collapses the previous one
- [x] Clicking the same slide again collapses it
- [x] State resets when navigating away or closing modal

### Answer Censoring
- [x] Answers censored by default (shows ████████)
- [x] **Edit mode:** Click censored area → reveals input field with autoFocus
- [x] **Edit mode:** Input blur → returns to censored state
- [x] **Readonly mode:** Click censored area → reveals answer text
- [x] **Readonly mode:** Mouse leave → hides answer
- [x] Censor resets when slide collapses

### Modal Overflow Fixes
- [x] Fix slides being cut off horizontally in modals
- [x] Add `overflow-x: hidden` to modal body
- [x] Change image container from `inline-block` to `block` with `width: 100%`
- [x] Add `box-sizing: border-box` to prevent overflow
- [x] Ensure slides fill modal width properly

### Batch Import File Size
- [x] Display file size for each file during batch import review
- [x] Show format: `filename.json 14.4 MB (File 1 of 3)`
- [x] Warn for files > 30MB with ⚠️ indicator

## Implementation Summary

### Components Created

**`src/components/slide/SlidePreview.tsx`:**
```typescript
interface SlidePreviewProps {
  slide: Slide;
  slideNumber: number;
  mode: 'readonly' | 'edit';
  onAnswerChange?: (newAnswer: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}
```

Key features:
- `useState` for `isAnswerRevealed` with blur/leave handlers
- `useEffect` to reset censor when slide collapses
- Conditional rendering based on `isExpanded` and `isAnswerRevealed`
- Chevron indicator (▶/▼) in edit mode

**`src/components/slide/SlidePreview.module.css`:**
- Compact collapsed state: `padding: 0.75rem 1rem`
- Expanded state: `padding: 1rem` with margin-bottom on header
- Smooth transitions for expand/collapse
- Answer censorship styling

### Components Updated

**`src/components/category/CategoryManager.tsx`:**
- Changed from `Set<number>` to `number | null` for `expandedSlideIndex`
- Accordion toggle: `setExpandedSlideIndex(prev => prev === index ? null : index)`
- Added `handleSlideAnswerChange` for edit mode
- Changed SlidePreview from `mode="readonly"` to `mode="edit"`

**`src/components/CategoryImporter.tsx`:**
- Changed from `Set<number>` to `number | null` for `expandedSlideIndex`
- Accordion toggle matching CategoryManager
- Added file size display to batch import review
- File counter: `(File X of Y)` shown inline with file name

**`src/components/common/Modal.module.css`:**
- Added `overflow-x: hidden` to `.body`
- Added `box-sizing: border-box` to `.body`

**`src/components/category/CategoryManager.module.css`:**
- Added `overflow-x: hidden` to `.slides-viewer`
- Added `width: 100%` and `box-sizing: border-box` to `.slides-viewer`

## Dependencies

**Required (must be complete):**
- Task 30: Category Manager ✅ (base component structure)

## Out of Scope

- **Slide reordering:** Keep slides in import order
- **Bulk editing:** Edit one slide at a time
- **Slide deletion:** Don't allow removing individual slides
- **Answer validation:** No constraints on answer format
- **Multiple selection:** Can only expand one slide at a time

## Testing

**Manual Testing Performed:**
- ✅ Accordion behavior in CategoryImporter
- ✅ Accordion behavior in CategoryManager detail view
- ✅ Answer censoring in edit mode with blur behavior
- ✅ Answer censoring in readonly mode with mouse leave
- ✅ Modal overflow fixes - slides no longer cut off
- ✅ File size display in batch import
- ✅ Censor resets when collapsing slide
- ✅ Censor resets when navigating back/away

## Success Criteria

- [x] Both CategoryManager and CategoryImporter use identical SlidePreview component
- [x] Accordion behavior works consistently (one slide at a time)
- [x] Answers censored by default, reveal on click, hide on blur/leave
- [x] Slides not cut off in any modal view
- [x] File sizes shown during batch import review
- [x] Compact collapsed state improves scannability of 50+ slides
- [x] Smooth transitions for expand/collapse

## Notes

**Why this enhancement was needed:**
1. **User Feedback:** During development, reviewing 50 slides was overwhelming
2. **Spoiler Prevention:** Content creators need to review without spoiling answers
3. **Layout Issues:** Slides were being cut off, hiding critical content
4. **Consistency:** Two different implementations led to confusion

**Design Decisions:**
- **Accordion (not multi-select):** Keeps focus on one slide at a time
- **Blur to hide in edit mode:** Prevents accidental spoilers while typing
- **Mouse leave in readonly:** Quick peek without permanent reveal
- **Chevron indicator:** Clear affordance for expand/collapse
- **Compact collapsed:** Just slide number, minimal space

**Performance Impact:**
- Minimal - only rendering one expanded slide at a time
- Image loading deferred until slide expands
- No virtualization needed (DOM nodes are lightweight when collapsed)

## References

- Task 30: Category Manager (base implementation)
- CSS Modules documentation
- React hooks best practices (useState, useEffect)
