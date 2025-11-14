/**
 * SlideList Component
 *
 * Displays a list of slides with expand/collapse functionality.
 * Used in both category detail view and import preview.
 */

import type { Slide } from '@types';
import { SlidePreview } from './SlidePreview';
import styles from './SlideList.module.css';

interface SlideListProps {
  slides: Slide[];
  expandedSlideIndex: number | null;
  onToggleExpand: (index: number) => void;
  onAnswerChange: (slideIndex: number, newAnswer: string) => void;
  mode?: 'readonly' | 'edit';
}

export function SlideList({
  slides,
  expandedSlideIndex,
  onToggleExpand,
  onAnswerChange,
  mode = 'edit',
}: SlideListProps) {
  return (
    <div className={styles['slide-list-container']}>
      <h4>Slides: {slides.length}</h4>
      <p className={styles['helper-text']}>Click on any slide to expand and view details.</p>
      <div className={styles['slides-list']}>
        {slides.map((slide, index) => (
          <SlidePreview
            key={index}
            slide={slide}
            slideNumber={index + 1}
            mode={mode}
            isExpanded={expandedSlideIndex === index}
            onToggleExpand={() => {
              onToggleExpand(index);
            }}
            onAnswerChange={(newAnswer) => {
              onAnswerChange(index, newAnswer);
            }}
          />
        ))}
      </div>
    </div>
  );
}
