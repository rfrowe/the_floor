/**
 * DetailContent Component
 *
 * Detail view showing all slides in a category.
 * Fully self-contained with ViewStack state management.
 */

import { useState } from 'react';
import type { StoredCategory } from '@types';
import { SlideList } from '@components/slide/SlideList';
import styles from '../CategoryManager.module.css';

interface DetailContentProps {
  category: StoredCategory;
  expandedSlideIndex: number | null;
  setExpandedSlideIndex: (index: number | null | ((prev: number | null) => number | null)) => void;
}

export function DetailContent({
  category,
  expandedSlideIndex,
  setExpandedSlideIndex,
}: DetailContentProps) {
  const [localCategory, setLocalCategory] = useState(category);

  const handleSlideAnswerChange = (slideIndex: number, newAnswer: string) => {
    const updatedSlides = localCategory.slides.map((slide, index) =>
      index === slideIndex ? { ...slide, answer: newAnswer } : slide
    );

    setLocalCategory({
      ...localCategory,
      slides: updatedSlides,
    });
    // TODO: Persist changes to storage if needed
  };

  const toggleSlideExpanded = (slideIndex: number) => {
    setExpandedSlideIndex((prev) => (prev === slideIndex ? null : slideIndex));
  };

  return (
    <div className={styles['slides-viewer']}>
      <SlideList
        slides={localCategory.slides}
        expandedSlideIndex={expandedSlideIndex}
        onToggleExpand={toggleSlideExpanded}
        onAnswerChange={handleSlideAnswerChange}
        mode="edit"
      />
    </div>
  );
}
