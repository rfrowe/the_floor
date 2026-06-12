/**
 * CensorStep — the wizard step that hosts the {@link CensorBoxEditor}.
 *
 * Lets the user move across the draft's slides (filmstrip + prev/next),
 * draw/delete censor boxes on the active slide, and persists each change via
 * `SET_SLIDE_CENSOR_BOXES`. Slides with no image yet (the norm until Task 58
 * generates images) are clearly marked in the filmstrip and show an
 * "image pending" placeholder in the editor.
 */

import { useEffect, useState } from 'react';
import type { CensorBox, Slide } from '@types';
import { CensorBoxEditor } from '@components/studio/CensorBoxEditor';
import styles from './CensorStep.module.css';

export interface CensorStepProps {
  /** The slides to censor (derived from the draft's cards on entering images). */
  slides: Slide[];
  /** Persist the censor boxes for the slide at `index`. */
  onSlideCensorBoxesChange: (index: number, boxes: CensorBox[]) => void;
}

export function CensorStep({ slides, onSlideCensorBoxesChange }: CensorStepProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Keep the active index in range if the slide list shrinks.
  useEffect(() => {
    if (activeIndex > slides.length - 1) {
      setActiveIndex(Math.max(0, slides.length - 1));
    }
  }, [activeIndex, slides.length]);

  const containerClass = styles['container'] ?? '';
  const emptyClass = styles['empty'] ?? '';
  const filmstripClass = styles['filmstrip'] ?? '';
  const thumbClass = styles['thumb'] ?? '';
  const thumbActiveClass = styles['thumb-active'] ?? '';
  const thumbImageClass = styles['thumb-image'] ?? '';
  const thumbPendingClass = styles['thumb-pending'] ?? '';
  const thumbBadgeClass = styles['thumb-badge'] ?? '';
  const navClass = styles['nav'] ?? '';
  const navButtonClass = styles['nav-button'] ?? '';
  const positionClass = styles['position'] ?? '';
  const editorWrapClass = styles['editor-wrap'] ?? '';

  if (slides.length === 0) {
    return (
      <div className={containerClass}>
        <p className={emptyClass} role="status">
          No slides to censor yet. Add cards and generate images first.
        </p>
      </div>
    );
  }

  const activeSlide = slides[activeIndex];
  const goPrev = () => {
    setActiveIndex((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    setActiveIndex((i) => Math.min(slides.length - 1, i + 1));
  };

  return (
    <div className={containerClass}>
      <nav className={navClass} aria-label="Slide navigation">
        <button
          type="button"
          className={navButtonClass}
          onClick={goPrev}
          disabled={activeIndex <= 0}
          aria-label="Previous slide"
        >
          ← Prev
        </button>
        <span className={positionClass} aria-live="polite">
          Slide {activeIndex + 1} of {slides.length}
          {activeSlide?.answer ? ` — ${activeSlide.answer}` : ''}
        </span>
        <button
          type="button"
          className={navButtonClass}
          onClick={goNext}
          disabled={activeIndex >= slides.length - 1}
          aria-label="Next slide"
        >
          Next →
        </button>
      </nav>

      <ul className={filmstripClass} aria-label="Slides filmstrip">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const hasImage = slide.imageUrl.trim().length > 0;
          const hasBoxes = slide.censorBoxes.length > 0;
          return (
            <li key={`${slide.answer}-${String(index)}`}>
              <button
                type="button"
                className={`${thumbClass} ${isActive ? thumbActiveClass : ''}`.trim()}
                onClick={() => {
                  setActiveIndex(index);
                }}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`Slide ${String(index + 1)}${slide.answer ? `: ${slide.answer}` : ''}${
                  hasImage ? '' : ' (image pending)'
                }${hasBoxes ? `, ${String(slide.censorBoxes.length)} censor boxes` : ''}`}
              >
                {hasImage ? (
                  <img className={thumbImageClass} src={slide.imageUrl} alt="" draggable={false} />
                ) : (
                  <span className={thumbPendingClass}>No image</span>
                )}
                {hasBoxes && (
                  <span className={thumbBadgeClass} aria-hidden="true">
                    {slide.censorBoxes.length}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={editorWrapClass}>
        {activeSlide && (
          <CensorBoxEditor
            // Remount per slide so bounds/selection reset cleanly on navigation.
            key={activeIndex}
            slide={activeSlide}
            onChange={(boxes) => {
              onSlideCensorBoxesChange(activeIndex, boxes);
            }}
          />
        )}
      </div>
    </div>
  );
}
