import { useState, useCallback } from 'react';
import { SlideList } from '@components/slide/SlideList';
import { ComponentController } from '@pages/ComponentController';
import { quadrantTestSlides } from './testSlides';
import { useSharedBaseballData } from './useSharedBaseballData';
import type { Slide } from '@types';
import styles from '@pages/ComponentsDemo.module.css';

export default function SlideListDemo() {
  const [slides, setSlides] = useState<Slide[]>(quadrantTestSlides);
  const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'readonly' | 'edit'>('edit');

  const { slides: baseballSlides, loading: baseballLoading } = useSharedBaseballData();

  const handleToggleExpand = useCallback((index: number) => {
    setExpandedSlideIndex((current) => (current === index ? null : index));
  }, []);

  const handleAnswerChange = useCallback((slideIndex: number, newAnswer: string) => {
    console.log(`Slide ${String(slideIndex)} answer changed to:`, newAnswer);
    setSlides((prev) =>
      prev.map((slide, idx) => (idx === slideIndex ? { ...slide, answer: newAnswer } : slide))
    );
  }, []);

  const handleAddSlide = useCallback(() => {
    if (baseballSlides && baseballSlides.length > 0) {
      const randomSlide = baseballSlides[Math.floor(Math.random() * baseballSlides.length)];
      if (randomSlide) {
        setSlides((prev) => [...prev, randomSlide]);
      }
    }
  }, [baseballSlides]);

  const handleRemoveSlide = useCallback(() => {
    setSlides((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const handleReset = useCallback(() => {
    setSlides(quadrantTestSlides);
    setExpandedSlideIndex(null);
    setMode('edit');
  }, []);

  return (
    <section className={styles['section']} id="slide-list">
      <h2>
        <code>&lt;SlideList /&gt;</code>
      </h2>
      <p>
        Displays a list of slides with expand/collapse functionality. Used in category detail view
        and import preview.
      </p>

      <ComponentController
        controls={[
          {
            type: 'group',
            label: 'Display Mode',
            controls: [
              {
                type: 'button',
                label: mode === 'readonly' ? '✓ Read-Only' : 'Read-Only',
                onClick: () => {
                  setMode('readonly');
                },
                variant: mode === 'readonly' ? 'primary' : 'secondary',
              },
              {
                type: 'button',
                label: mode === 'edit' ? '✓ Edit' : 'Edit',
                onClick: () => {
                  setMode('edit');
                },
                variant: mode === 'edit' ? 'primary' : 'secondary',
              },
            ],
          },
          {
            type: 'group',
            label: 'Manage Slides',
            controls: [
              {
                type: 'button',
                label: baseballLoading ? '⏳ Loading...' : '➕ Add',
                onClick: handleAddSlide,
                variant: 'primary',
                disabled: baseballLoading || !baseballSlides || baseballSlides.length === 0,
              },
              {
                type: 'button',
                label: '🗑️ Remove',
                onClick: handleRemoveSlide,
                variant: 'danger',
                disabled: slides.length === 0,
              },
            ],
          },
        ]}
        onReset={handleReset}
      />

      <SlideList
        slides={slides}
        expandedSlideIndex={expandedSlideIndex}
        onToggleExpand={handleToggleExpand}
        onAnswerChange={handleAnswerChange}
        mode={mode}
      />
    </section>
  );
}
