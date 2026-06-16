/**
 * CardListItem — a single editable card-idea row in the cards step.
 *
 * Presentational only: it renders the card's `answer` and `imagePrompt` as
 * editable fields, a delete button, and reorder controls (a drag handle plus
 * keyboard-accessible Move up/Move down buttons). It reports edits, deletes, and
 * reorders up to the parent ({@link CardsStep}) via callbacks. It holds no state
 * and never calls the OpenAI service — generation lives in the parent's single
 * async path, and the parent owns the live drag state.
 *
 * Reordering uses native HTML5 drag-and-drop (no drag library): the whole card
 * is `draggable`, with a visible grip and a drop-position indicator the parent
 * toggles via `isDropBefore`/`isDropAfter`. Native DnD is not keyboard-operable,
 * so Move up/Move down buttons (disabled at the ends) provide the accessible
 * reorder path — mirroring the repo's "pointer interaction + accessible
 * alternative" pattern (see {@link CensorBoxEditor}). Both paths ultimately
 * dispatch `SET_CARDS` in the parent; because slide image/censor data is keyed
 * by card `id`, reordering carries each card's eventual image with it.
 *
 * `imageKeywords` is retained on the model for future image-search support but
 * is not surfaced here (Phase 12 uses `imagePrompt` for generation). Per-card
 * image generation/status is Task 58 and intentionally absent.
 */

import { type DragEvent, useId } from 'react';
import type { CardIdea } from '@types';
import { Button } from '@components/common/Button';
import styles from './CardListItem.module.css';

export interface CardListItemProps {
  /** The card to render. Its `id` is the stable React key (set by the parent). */
  card: CardIdea;
  /** 1-based position shown to the user (purely cosmetic). */
  position: number;
  /** Total number of cards, used to disable Move down on the last card. */
  total: number;
  /** Edit one or more of the card's generated fields → `UPDATE_CARD`. */
  onChange: (changes: Partial<Omit<CardIdea, 'id'>>) => void;
  /** Remove this card → `DELETE_CARD`. The parent confirms before calling. */
  onDelete: () => void;
  /** Move this card one slot earlier (accessible reorder) → `SET_CARDS`. */
  onMoveUp: () => void;
  /** Move this card one slot later (accessible reorder) → `SET_CARDS`. */
  onMoveDown: () => void;
  /** True while this card is the one being dragged (dims the source row). */
  isDragging: boolean;
  /** Show a drop indicator above this row (drop target is before it). */
  isDropBefore: boolean;
  /** Show a drop indicator below this row (drop target is after it). */
  isDropAfter: boolean;
  /** Native DnD: the user began dragging this card. */
  onDragStart: (e: DragEvent<HTMLLIElement>) => void;
  /** Native DnD: a dragged card is hovering over this row. */
  onDragOver: (e: DragEvent<HTMLLIElement>) => void;
  /** Native DnD: a dragged card was dropped on this row. */
  onDrop: (e: DragEvent<HTMLLIElement>) => void;
  /** Native DnD: the drag ended (committed or cancelled); clears drag state. */
  onDragEnd: (e: DragEvent<HTMLLIElement>) => void;
}

export function CardListItem({
  card,
  position,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isDragging,
  isDropBefore,
  isDropAfter,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CardListItemProps) {
  const answerId = useId();
  const promptId = useId();

  const rowClass = styles['row'] ?? '';
  const draggingClass = isDragging ? (styles['dragging'] ?? '') : '';
  const dropBeforeClass = isDropBefore ? (styles['dropBefore'] ?? '') : '';
  const dropAfterClass = isDropAfter ? (styles['dropAfter'] ?? '') : '';
  const liClass = `${rowClass} ${draggingClass} ${dropBeforeClass} ${dropAfterClass}`.trim();
  const handleColClass = styles['handleCol'] ?? '';
  const gripClass = styles['grip'] ?? '';
  const positionClass = styles['position'] ?? '';
  const moveButtonsClass = styles['moveButtons'] ?? '';
  const fieldsClass = styles['fields'] ?? '';
  const fieldClass = styles['field'] ?? '';
  const answerRowClass = styles['answerRow'] ?? '';
  const answerFieldClass = `${fieldClass} ${styles['answerField'] ?? ''}`.trim();
  const labelClass = styles['label'] ?? '';
  const inputClass = styles['input'] ?? '';
  const promptInputClass = `${inputClass} ${styles['promptInput'] ?? ''}`.trim();
  const actionsClass = styles['actions'] ?? '';

  // Defensive runtime guard: the `CardIdea` type says these are always strings,
  // but a malformed card (e.g. a stale/persisted draft) must never crash the
  // render, so coalesce. The lint rule below trusts the static type and flags
  // the `??` as unnecessary; we keep it intentionally for resilience.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const answer = card.answer ?? '';
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const imagePrompt = card.imagePrompt ?? '';
  const answerLabel = answer.trim().length > 0 ? answer : `card ${String(position)}`;
  const isFirst = position <= 1;
  const isLast = position >= total;

  return (
    <li
      className={liClass}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className={handleColClass}>
        {/* The grip is a visual affordance for the native drag (the whole row
            is draggable); reordering by keyboard uses the Move buttons below. */}
        <span className={gripClass} aria-hidden="true">
          ⠿
        </span>
        <span className={positionClass} aria-hidden="true">
          {position}
        </span>
        <div className={moveButtonsClass}>
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label={`Move ${answerLabel} up`}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label={`Move ${answerLabel} down`}
          >
            ↓
          </Button>
        </div>
      </div>

      <div className={fieldsClass}>
        {/* Answer field and Delete button share the top row so Delete aligns
            with the answer input rather than floating. */}
        <div className={answerRowClass}>
          <div className={answerFieldClass}>
            <label className={labelClass} htmlFor={answerId}>
              Answer
            </label>
            <input
              id={answerId}
              className={inputClass}
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="The correct guess (1–3 words)"
              value={answer}
              onChange={(e) => {
                onChange({ answer: e.target.value });
              }}
            />
          </div>

          <div className={actionsClass}>
            <Button
              type="button"
              variant="danger"
              size="small"
              onClick={onDelete}
              aria-label={`Delete ${answerLabel}`}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor={promptId}>
            Image prompt
          </label>
          <textarea
            id={promptId}
            className={promptInputClass}
            rows={2}
            spellCheck={false}
            placeholder="What the generated image should depict (the censor step hides giveaways)"
            value={imagePrompt}
            onChange={(e) => {
              onChange({ imagePrompt: e.target.value });
            }}
          />
        </div>
      </div>
    </li>
  );
}
