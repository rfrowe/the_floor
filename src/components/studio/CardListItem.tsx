/**
 * CardListItem — a single editable card-idea row in the cards step.
 *
 * Presentational only: it renders the card's `answer` and `imagePrompt` as
 * editable fields plus a delete button, and reports edits/deletes up to the
 * parent ({@link CardsStep}) via callbacks. It holds no state and never calls
 * the OpenAI service — generation lives in the parent's single async path.
 *
 * `imageKeywords` is retained on the model for future image-search support but
 * is not surfaced here (Phase 12 uses `imagePrompt` for generation). Per-card
 * image generation/status is Task 58 and intentionally absent.
 */

import { useId } from 'react';
import type { CardIdea } from '@types';
import { Button } from '@components/common/Button';
import styles from './CardListItem.module.css';

export interface CardListItemProps {
  /** The card to render. Its `id` is the stable React key (set by the parent). */
  card: CardIdea;
  /** 1-based position shown to the user (purely cosmetic). */
  position: number;
  /** Edit one or more of the card's generated fields → `UPDATE_CARD`. */
  onChange: (changes: Partial<Omit<CardIdea, 'id'>>) => void;
  /** Remove this card → `DELETE_CARD`. The parent confirms before calling. */
  onDelete: () => void;
}

export function CardListItem({ card, position, onChange, onDelete }: CardListItemProps) {
  const answerId = useId();
  const promptId = useId();

  const rowClass = styles['row'] ?? '';
  const positionClass = styles['position'] ?? '';
  const fieldsClass = styles['fields'] ?? '';
  const fieldClass = styles['field'] ?? '';
  const labelClass = styles['label'] ?? '';
  const inputClass = styles['input'] ?? '';
  const promptInputClass = `${inputClass} ${styles['promptInput'] ?? ''}`.trim();
  const actionsClass = styles['actions'] ?? '';

  const answerLabel = card.answer.trim().length > 0 ? card.answer : `card ${String(position)}`;

  return (
    <li className={rowClass}>
      <span className={positionClass} aria-hidden="true">
        {position}
      </span>

      <div className={fieldsClass}>
        <div className={fieldClass}>
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
            value={card.answer}
            onChange={(e) => {
              onChange({ answer: e.target.value });
            }}
          />
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
            placeholder="What the generated image should depict (no text in image)"
            value={card.imagePrompt}
            onChange={(e) => {
              onChange({ imagePrompt: e.target.value });
            }}
          />
        </div>
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
    </li>
  );
}
