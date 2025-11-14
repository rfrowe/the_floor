import { useState, useCallback, useMemo } from 'react';
import { SlidePreview } from '@components/slide/SlidePreview';
import { ComponentController, type ControlConfig } from '@pages/ComponentController';
import { demoSlide, quadrantTestSlides } from './testSlides';
import { useSlideViewerControls } from './useSlideViewerControls';
import styles from '@pages/ComponentsDemo.module.css';

export default function SlidePreviewDemo() {
  const [mode, setMode] = useState<'readonly' | 'edit'>('edit');
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    selectedSlideIndex,
    showAnswer,
    controls: slideControls,
    reset: resetSlideControls,
  } = useSlideViewerControls();

  const currentSlide = useMemo(() => {
    return selectedSlideIndex === 0
      ? demoSlide
      : (quadrantTestSlides[selectedSlideIndex - 1] ?? demoSlide);
  }, [selectedSlideIndex]);

  const handleAnswerChange = useCallback((newAnswer: string) => {
    console.log('Answer changed to:', newAnswer);
  }, []);

  const modeControls: ControlConfig[] = [
    {
      type: 'group',
      label: 'Display Mode',
      controls: [
        {
          type: 'button',
          label: mode === 'readonly' ? '✓ Read-Only' : 'Read-Only',
          onClick: () => {
            setMode('readonly');
            setIsExpanded(true);
          },
          variant: mode === 'readonly' ? 'primary' : 'secondary',
        },
        {
          type: 'button',
          label: mode === 'edit' ? '✓ Edit' : 'Edit',
          onClick: () => {
            setMode('edit');
            setIsExpanded(true);
          },
          variant: mode === 'edit' ? 'primary' : 'secondary',
        },
      ],
    },
  ];

  // Extract hide answer and collapse from slideControls
  const [pickSlideGroup, hideAnswerButton] = slideControls;

  // Rearrange: Pick Slide group, Mode group, then Hide Answer and Collapse at end
  const allControls = [
    pickSlideGroup,
    ...modeControls,
    hideAnswerButton,
    {
      type: 'button',
      label: isExpanded ? '📖 Collapse' : '📕 Expand',
      onClick: () => {
        setIsExpanded(!isExpanded);
      },
      variant: 'secondary',
    },
  ] as ControlConfig[];

  return (
    <section className={styles['section']} id="slide-preview">
      <h2>
        <code>&lt;SlidePreview /&gt;</code>
      </h2>
      <p>
        A component for displaying slides with read-only or edit modes. Both modes support
        expand/collapse and <strong>click the slide image to reveal the answer</strong> (hides on
        mouse leave or tap outside). Edit mode adds answer editing capability.
      </p>

      <ComponentController
        controls={allControls}
        onReset={() => {
          resetSlideControls();
          setMode('edit');
          setIsExpanded(true);
        }}
        highlights={
          <p>
            <strong>Both modes:</strong> Click header to expand/collapse. Click the slide image to
            temporarily reveal the answer (hides on mouse leave or tap outside). Hover effects show
            the image is interactive.
          </p>
        }
      />

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {mode === 'readonly' ? (
          <SlidePreview
            slide={currentSlide}
            slideNumber={1}
            mode="readonly"
            isExpanded={isExpanded}
            onToggleExpand={() => {
              setIsExpanded(!isExpanded);
            }}
            showAnswer={showAnswer}
          />
        ) : (
          <SlidePreview
            slide={currentSlide}
            slideNumber={1}
            mode="edit"
            isExpanded={isExpanded}
            onToggleExpand={() => {
              setIsExpanded(!isExpanded);
            }}
            onAnswerChange={handleAnswerChange}
            showAnswer={showAnswer}
          />
        )}
      </div>
    </section>
  );
}
