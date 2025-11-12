/**
 * DetailContent Component
 *
 * Detail view showing all slides in a category.
 * Fully self-contained with ViewStack state management.
 */

import { useState } from 'react';
import type { StoredCategory } from '@types';
import { SlidePreview } from '@components/slide/SlidePreview';
import styles from '../CategoryManager.module.css';

interface DetailContentProps {
  category: StoredCategory;
  expandedSlideIndex: number | null;
  setExpandedSlideIndex: (index: number | null | ((prev: number | null) => number | null)) => void;
}

export function DetailContent({ category, expandedSlideIndex, setExpandedSlideIndex }: DetailContentProps) {
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
      {localCategory.slides.map((slide, index) => (
        <SlidePreview
          key={index}
          slide={slide}
          slideNumber={index + 1}
          mode="edit"
          isExpanded={expandedSlideIndex === index}
          onToggleExpand={() => toggleSlideExpanded(index)}
          onAnswerChange={(newAnswer) => handleSlideAnswerChange(index, newAnswer)}
        />
      ))}
    </div>
  );
}
