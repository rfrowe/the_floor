/**
 * DetailContent Component
 *
 * Detail view showing all slides in a category.
 * Loaded lazily when view is pushed to stack.
 */

import { useState, useEffect } from 'react';
import type { StoredCategory } from '@types';
import { SlidePreview } from '@components/slide/SlidePreview';
import { getCategoryById } from '@storage/indexedDB';
import styles from '../CategoryManager.module.css';

interface DetailContentProps {
  categoryId: string;
}

export function DetailContent({ categoryId }: DetailContentProps) {
  const [category, setCategory] = useState<StoredCategory | null>(null);
  const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCategory() {
      try {
        const fullCategory = await getCategoryById<StoredCategory>(categoryId);
        setCategory(fullCategory);
      } catch (error) {
        console.error('Failed to load category:', error);
        alert('Failed to load category details');
      } finally {
        setIsLoading(false);
      }
    }

    void loadCategory();
  }, [categoryId]);

  const handleSlideAnswerChange = (slideIndex: number, newAnswer: string) => {
    if (!category) return;

    const updatedSlides = category.slides.map((slide, index) =>
      index === slideIndex ? { ...slide, answer: newAnswer } : slide
    );

    setCategory({
      ...category,
      slides: updatedSlides,
    });
    // TODO: Persist changes to storage if needed
  };

  const toggleSlideExpanded = (slideIndex: number) => {
    setExpandedSlideIndex((prev) => (prev === slideIndex ? null : slideIndex));
  };

  if (isLoading) {
    return <div>Loading category...</div>;
  }

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div className={styles['slides-viewer']}>
      {category.slides.map((slide, index) => (
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
