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
 * Besides AI generation, each card offers a "find a real photo" path: a Google
 * Images button (opens an image search for the card's answer in a new tab) paired
 * with drag-and-drop / upload of a downloaded image FILE onto the card's image
 * area. A dropped/selected file is DOWNSCALED to a capped-long-edge JPEG `data:`
 * URL via {@link downscaleImageToDataUrl} (so a 12 MP phone photo doesn't bloat
 * the persisted draft or the exported category JSON) and dispatched through the
 * same `SET_SLIDE_IMAGE` path. Generated images are NOT touched by this path.
 *
 * CONCURRENCY: a SINGLE shared limiter ({@link createLimiter}, cap
 * {@link GENERATE_ALL_CONCURRENCY}) governs EVERY `generateImage` call — both the
 * single-button path and "Generate all" — so total concurrent OpenAI image
 * requests never exceed the cap no matter how rapidly the user clicks.
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
import { downscaleImageToDataUrl } from '@utils/downscaleImage';
import { createLimiter } from '@utils/concurrencyLimit';
import { buildGoogleImagesUrl } from '@utils/googleImages';
import styles from './ImagesStep.module.css';

/** Max OpenAI image requests in flight at once across the whole step. */
export const GENERATE_ALL_CONCURRENCY = 3;

/**
 * The SINGLE shared limiter for the step. Module-level (not per-render) so every
 * `generateImage` call — single-card clicks AND "Generate all" — competes for the
 * same {@link GENERATE_ALL_CONCURRENCY} slots and the cap holds globally.
 */
const imageLimiter = createLimiter(GENERATE_ALL_CONCURRENCY);

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

export function ImagesStep({ cards, slides, onSetSlideImage, onContinue }: ImagesStepProps) {
  const [config, { isConfigured }] = useCredentials();

  // Transient, NON-persisted per-card status + error, keyed by stable card id.
  const [statuses, setStatuses] = useState<ReadonlyMap<string, CardStatus>>(() => new Map());
  const [errors, setErrors] = useState<ErrorMap>(() => new Map());
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  // Card id currently under a drag-over (for the drop-target visual state).
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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
   * `generateImage(card.imagePrompt)` THROUGH THE SHARED LIMITER, dispatches
   * `SET_SLIDE_IMAGE { index }`, then `done`; any failure sets `error` (and a
   * retryable message) WITHOUT rethrowing, so a pooled run is never aborted by
   * one bad card. Because every call routes through `imageLimiter`, rapid
   * single-card clicks and "Generate all" together never exceed the cap.
   */
  const generateOne = useCallback(
    async (id: string, index: number, imagePrompt: string): Promise<void> => {
      setStatus(id, 'loading');
      setError(id, null);
      try {
        const dataUrl = await imageLimiter(() => generateImage(imagePrompt, configRef.current));
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

  /**
   * Apply an image FILE (drag-drop or upload) to a card: verify it's an image,
   * DOWNSCALE it to a capped-long-edge JPEG `data:` URL via
   * {@link downscaleImageToDataUrl}, then dispatch `SET_SLIDE_IMAGE` for that
   * card's index. Downscaling at ingest keeps a large phone photo from bloating
   * the persisted draft AND the exported category JSON (the smaller data URL is
   * what flows downstream). Non-image files are rejected with a per-card message;
   * this is the OS-file path that pairs with Google Images (dragging an <img> from
   * a tab yields a CORS-blocked cross-origin URL, so we only accept files).
   */
  const applyImageFile = useCallback(
    async (id: string, index: number, file: File): Promise<void> => {
      if (!file.type.startsWith('image/')) {
        setError(id, 'That file isn’t an image. Drop or choose a PNG, JPG, or similar.');
        return;
      }
      setError(id, null);
      try {
        const dataUrl = await downscaleImageToDataUrl(file);
        onSetSlideImage(index, dataUrl);
        setStatus(id, 'done');
      } catch {
        setStatus(id, 'error');
        setError(id, 'Couldn’t process that image file. Try another.');
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
      // Each call self-limits through the shared `imageLimiter`, so firing them
      // all at once still caps concurrency at GENERATE_ALL_CONCURRENCY; the rest
      // queue. generateOne never rejects, so one bad card can't abort the batch.
      await Promise.all(
        pending.map(({ card, index }) => generateOne(card.id, index, card.imagePrompt))
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
  const thumbDragOverClass = styles['thumbDragOver'] ?? '';
  const thumbImgClass = styles['thumbImg'] ?? '';
  const placeholderClass = styles['placeholder'] ?? '';
  const loadingClass = styles['loading'] ?? '';
  const dropHintClass = styles['dropHint'] ?? '';
  const cardBodyClass = styles['cardBody'] ?? '';
  const answerClass = styles['answer'] ?? '';
  const cardErrorClass = styles['cardError'] ?? '';
  const cardActionsClass = styles['cardActions'] ?? '';
  const uploadLabelClass = styles['uploadLabel'] ?? '';
  const visuallyHiddenClass = styles['visuallyHidden'] ?? '';
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
        Generate all to fill the rest a few at a time. Prefer a real photo? Open Google Images, then
        drag the downloaded file onto the card (or use “Upload”).
      </p>

      <p className={caveatClass}>
        Heads-up: AI art can be less photo-accurate for specific real people or logos. If an image
        misses, just reroll that single card — or drop in a real photo.
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
          const googleUrl = buildGoogleImagesUrl(card.answer, card.imageKeywords);
          const isDragOver = dragOverId === card.id;
          const thumbClassName = `${thumbClass} ${isDragOver ? thumbDragOverClass : ''}`.trim();

          return (
            <li key={card.id} className={cardClass}>
              {/*
                File-drop target. preventDefault on dragover is required to allow
                a drop; we read dataTransfer.files[0] on drop. Pointer-only, so
                the "Upload" label below provides an equivalent keyboard path.
              */}
              <div
                className={thumbClassName}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverId !== card.id) setDragOverId(card.id);
                }}
                onDragLeave={() => {
                  setDragOverId((current) => (current === card.id ? null : current));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverId(null);
                  const file = e.dataTransfer.files[0];
                  if (file) void applyImageFile(card.id, index, file);
                }}
              >
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
                {isDragOver && (
                  <div className={dropHintClass} aria-hidden="true">
                    Drop image to use
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

                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    onClick={() => {
                      if (googleUrl) {
                        window.open(googleUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    disabled={googleUrl === null}
                  >
                    Google Images
                  </Button>

                  {/*
                    Keyboard-accessible equivalent of the file drop: a real <label>
                    wrapping a visually-hidden <input type="file">. Clicking the
                    label (or activating it via keyboard once focused) opens the OS
                    file picker and runs the same blob→dataURL→SET_SLIDE_IMAGE path.
                  */}
                  <label className={uploadLabelClass}>
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className={visuallyHiddenClass}
                      aria-label={`Upload an image for ${answerLabel}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void applyImageFile(card.id, index, file);
                        // Reset so re-selecting the same file fires onChange again.
                        e.target.value = '';
                      }}
                    />
                  </label>
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
