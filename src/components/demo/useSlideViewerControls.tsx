/**
 * Shared slide viewer controls hook
 * Provides common controls for SlideViewer and SlidePreview demos
 */

import { useState, useCallback } from 'react';
import type { ControlConfig } from '@pages/ComponentController';

export function useSlideViewerControls() {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const controls: ControlConfig[] = [
    {
      type: 'group',
      label: 'Pick Slide',
      controls: [
        {
          type: 'button',
          label: selectedSlideIndex === 0 ? '✓ Sample' : 'Sample',
          onClick: () => {
            setSelectedSlideIndex(0);
          },
          variant: selectedSlideIndex === 0 ? 'primary' : 'secondary',
        },
        {
          type: 'button',
          label: selectedSlideIndex === 1 ? '✓ Quadrants' : 'Quadrants',
          onClick: () => {
            setSelectedSlideIndex(1);
          },
          variant: selectedSlideIndex === 1 ? 'primary' : 'secondary',
        },
        {
          type: 'button',
          label: selectedSlideIndex === 2 ? '✓ Scattered' : 'Scattered',
          onClick: () => {
            setSelectedSlideIndex(2);
          },
          variant: selectedSlideIndex === 2 ? 'primary' : 'secondary',
        },
        {
          type: 'button',
          label: selectedSlideIndex === 3 ? '✓ Edges' : 'Edges',
          onClick: () => {
            setSelectedSlideIndex(3);
          },
          variant: selectedSlideIndex === 3 ? 'primary' : 'secondary',
        },
      ],
    },
    {
      type: 'button',
      label: showAnswer ? '🙈 Hide Answer' : '👁️ Show Answer',
      onClick: () => {
        setShowAnswer(!showAnswer);
      },
      variant: 'primary',
    },
  ];

  const reset = useCallback(() => {
    setShowAnswer(false);
    setSelectedSlideIndex(0);
  }, []);

  return {
    selectedSlideIndex,
    showAnswer,
    controls,
    reset,
  };
}
