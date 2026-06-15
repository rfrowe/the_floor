/**
 * ImagesStep — the fourth step of the LLM Studio wizard.
 *
 * One row per card; each shows its current slide image (or an empty placeholder)
 * and a Generate / Regenerate button. Generating a card calls `generateImage`
 * with the card's `imagePrompt` and dispatches `SET_SLIDE_IMAGE { index, … }` so
 * the resulting base64 data URL lands on the matching derived slide. A
 * concurrency-limited "Generate all" fills the remaining cards a few at a time
 * without overwhelming the API; per-card failures are isolated and retryable and
 * never block the others.
 *
 * INDEX ↔ ID BRIDGE: slides are derived per card and keyed by ARRAY INDEX
 * (`SET_SLIDE_IMAGE` takes an `index`), while cards carry a stable nanoid `id`.
 * We iterate `cards.map((card, index) => …)` so every row holds BOTH: the `id`
 * keys the transient status map (stable across edits/reorders), and the `index`
 * is what we dispatch and what we read the current image from (`slides[index]`).
 *
 * TRANSIENT STATE: per-card generate status lives in a `Map<cardId, CardStatus>`
 * in component state and is deliberately NOT persisted — only the resulting data
 * URL flows into the draft (via `SET_SLIDE_IMAGE`, debounced in Task 53). On a
 * resumed draft, statuses start empty and any already-generated images simply
 * render (treated as `done`).
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { CardIdea, Slide } from '@types';
import { Button } from '@components/common/Button';
import { useCredentials } from '@hooks/useCredentials';
import { generateImage, toGenerationError, type GenerationError } from '@services/openai';
import styles from './ImagesStep.module.css';

/** Max images generated at once by "Generate all". Keeps the API from being hammered. */
export const GENERATE_ALL_CONCURRENCY = 3;

/** Transient per-card generation status (never persisted). */
export type CardStatus = 'idle' | 'loading' | 'done' | 'error';

/** A per-card error message, keyed by card id (only present while status is `error`). */
type ErrorMap = ReadonlyMap<string, string>;

export interface ImagesStepProps {
  /** The card list (owned by the wizard draft); one slide is derived per card, in order. */
  cards: CardIdea[];
  /** The derived slides (one per card, by index); carries each card's current `imageUrl`. */
  slides: Slide[];
  /** Set one slide's image by its array index → `SET_SLIDE_IMAGE`. */
  onSetSlideImage: (index: number, imageUrl: string) => void;
  /** Advance to the censor step (the parent always allows it; some slides may be blank). */
  onContinue: () => void;
}

/**
 * Run `tasks` with at most `limit` in flight at once. A tiny hand-rolled queue
 * (no dependency): `limit` workers each pull the next index until the shared
 * cursor is exhausted. Each task is responsible for its own error handling — a
 * task must not reject, so one failure never aborts the pool.
 */
async function runWithConcurrency(
  tasks: readonly (() => Promise<void>)[],
  limit: number
): Promise<void> {
  const max = Math.max(1, Math.floor(limit));
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < tasks.length) {
      const index = cursor;
      cursor += 1;
      const task = tasks[index];
      if (task) {
        await task();
      }
    }
  };
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(max, tasks.length); i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);
}

export function ImagesStep({ cards, slides, onSetSlideImage, onContinue }: ImagesStepProps) {
  const [config, { isConfigured }] = useCredentials();

  // Transient, NON-persisted per-card status + error, keyed by stable card id.
  const [statuses, setStatuses] = useState<ReadonlyMap<string, CardStatus>>(() => new Map());
  const [errors, setErrors] = useState<ErrorMap>(() => new Map());
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Latest props for use inside async callbacks without re-binding them on every
  // edit (the generate closures read these refs, not the captured props).
  const configRef = useRef(config);
  configRef.current = config;

  const setStatus = useCallback((id: string, status: CardStatus): void => {
    setStatuses((current) => {
      const next = new Map(current);
      next.set(id, status);
      return next;
    });
  }, []);

  const setError = useCallback((id: string, message: string | null): void => {
    setErrors((current) => {
      const next = new Map(current);
      if (message === null) {
        next.delete(id);
      } else {
        next.set(id, message);
      }
      return next;
    });
  }, []);

  /**
   * Generate one card's image. Pure per-card unit reused by the single-button
   * path and by "Generate all": it flips status to `loading`, awaits
   * `generateImage(card.imagePrompt)`, dispatches `SET_SLIDE_IMAGE { index }`,
   * then `done`; any failure sets `error` (and a retryable message) WITHOUT
   * rethrowing, so a pooled run is never aborted by one bad card.
   */
  const generateOne = useCallback(
    async (id: string, index: number, imagePrompt: string): Promise<void> => {
      setStatus(id, 'loading');
      setError(id, null);
      try {
        const dataUrl = await generateImage(imagePrompt, configRef.current);
        onSetSlideImage(index, dataUrl);
        setStatus(id, 'done');
      } catch (caught) {
        const err: GenerationError = toGenerationError(caught);
        setStatus(id, 'error');
        setError(id, err.message);
      }
    },
    [onSetSlideImage, setError, setStatus]
  );

  const handleGenerateAll = useCallback(async (): Promise<void> => {
    if (!isConfigured || isGeneratingAll) return;
    // Only (re)generate cards that don't already have an image; an explicit
    // per-card Regenerate handles replacing an existing one.
    const pending = cards
      .map((card, index) => ({ card, index }))
      .filter(({ index }) => (slides[index]?.imageUrl ?? '').length === 0);
    if (pending.length === 0) return;

    setIsGeneratingAll(true);
    try {
      await runWithConcurrency(
        pending.map(
          ({ card, index }) =>
            () =>
              generateOne(card.id, index, card.imagePrompt)
        ),
        GENERATE_ALL_CONCURRENCY
      );
    } finally {
      setIsGeneratingAll(false);
    }
  }, [cards, slides, isConfigured, isGeneratingAll, generateOne]);

  const blankCount = useMemo(
    () => cards.filter((_card, index) => (slides[index]?.imageUrl ?? '').length === 0).length,
    [cards, slides]
  );

  const stepClass = styles['step'] ?? '';
  const introClass = styles['intro'] ?? '';
  const caveatClass = styles['caveat'] ?? '';
  const toolbarClass = styles['toolbar'] ?? '';
  const countClass = styles['count'] ?? '';
  const toolbarActionsClass = styles['toolbarActions'] ?? '';
  const gridClass = styles['grid'] ?? '';
  const cardClass = styles['card'] ?? '';
  const thumbClass = styles['thumb'] ?? '';
  const thumbImgClass = styles['thumbImg'] ?? '';
  const placeholderClass = styles['placeholder'] ?? '';
  const loadingClass = styles['loading'] ?? '';
  const cardBodyClass = styles['cardBody'] ?? '';
  const answerClass = styles['answer'] ?? '';
  const cardErrorClass = styles['cardError'] ?? '';
  const cardActionsClass = styles['cardActions'] ?? '';
  const footerClass = styles['footer'] ?? '';

  if (!isConfigured) {
    return (
      <div className={stepClass}>
        <p className={introClass}>
          Add your OpenAI key on the credentials step to generate images for your cards.
        </p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className={stepClass}>
        <p className={introClass}>
          No cards yet — go back to the cards step and add at least one before generating images.
        </p>
      </div>
    );
  }

  return (
    <div className={stepClass}>
      <p className={introClass}>
        Generate an image for each card. Images are created one at a time as you click — or use
        Generate all to fill the rest a few at a time.
      </p>

      <p className={caveatClass}>
        Heads-up: AI art can be less photo-accurate for specific real people or logos. If an image
        misses, just reroll that single card.
      </p>

      <div className={toolbarClass}>
        <span className={countClass} role="status">
          {blankCount === 0
            ? 'All cards have an image.'
            : `${String(blankCount)} of ${String(cards.length)} ${
                blankCount === 1 ? 'card is' : 'cards are'
              } still blank.`}
        </span>
        <div className={toolbarActionsClass}>
          <Button
            type="button"
            variant="primary"
            size="small"
            onClick={() => {
              void handleGenerateAll();
            }}
            disabled={isGeneratingAll || blankCount === 0}
            loading={isGeneratingAll}
          >
            Generate all
          </Button>
        </div>
      </div>

      <ul className={gridClass}>
        {cards.map((card, index) => {
          const slide = slides[index];
          const imageUrl = slide?.imageUrl ?? '';
          const hasImage = imageUrl.length > 0;
          const status: CardStatus = statuses.get(card.id) ?? (hasImage ? 'done' : 'idle');
          const isLoading = status === 'loading';
          const errorMessage = errors.get(card.id) ?? null;
          const answerLabel = card.answer.trim().length > 0 ? card.answer : 'Untitled card';

          return (
            <li key={card.id} className={cardClass}>
              <div className={thumbClass}>
                {isLoading ? (
                  <div className={loadingClass} role="status" aria-live="polite">
                    <span aria-hidden="true">⏳</span>
                    <span>Generating…</span>
                  </div>
                ) : hasImage ? (
                  <img src={imageUrl} alt={answerLabel} className={thumbImgClass} />
                ) : (
                  <div className={placeholderClass} aria-hidden="true">
                    No image yet
                  </div>
                )}
              </div>

              <div className={cardBodyClass}>
                <span className={answerClass} title={answerLabel}>
                  {String(index + 1)}. {answerLabel}
                </span>

                {errorMessage !== null && (
                  <p className={cardErrorClass} role="alert">
                    {errorMessage}
                  </p>
                )}

                <div className={cardActionsClass}>
                  <Button
                    type="button"
                    variant={hasImage ? 'secondary' : 'primary'}
                    size="small"
                    onClick={() => {
                      void generateOne(card.id, index, card.imagePrompt);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? 'Generating…'
                      : status === 'error'
                        ? 'Retry'
                        : hasImage
                          ? 'Regenerate'
                          : 'Generate'}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className={footerClass}>
        <Button type="button" variant="primary" onClick={onContinue}>
          Continue →
        </Button>
      </div>
    </div>
  );
}
