import { useMemo } from 'react';
import { SlideViewer } from '@components/slide/SlideViewer';
import { ComponentController } from '@pages/ComponentController';
import { DemoHighlights } from '@pages/DemoControlsContent';
import { demoSlide, quadrantTestSlides } from './testSlides';
import { useSlideViewerControls } from './useSlideViewerControls';
import styles from '@pages/ComponentsDemo.module.css';

export default function SlideViewerDemo() {
  const { selectedSlideIndex, showAnswer, controls, reset } = useSlideViewerControls();

  const currentSlide = useMemo(() => {
    return selectedSlideIndex === 0
      ? demoSlide
      : (quadrantTestSlides[selectedSlideIndex - 1] ?? demoSlide);
  }, [selectedSlideIndex]);

  return (
    <section className={styles['section']} id="slide-viewer">
      <h2>
        <code>&lt;SlideViewer /&gt;</code>
      </h2>
      <p>
        The SlideViewer component displays slide images with censorship boxes overlaid at precise
        positions. It handles aspect ratio preservation with letterboxing.
      </p>

      <ComponentController
        controls={controls}
        onReset={reset}
        highlights={
          <DemoHighlights title="Key Features:">
            - Maintains image aspect ratio with letterboxing
            <br />
            - Precisely positioned censorship boxes using percentage coordinates
            <br />
            - White background for transparent images
            <br />
            - Smooth transitions when hiding/showing boxes
            <br />
            - Loading and error states
            <br />- Responsive sizing to fit any container
          </DemoHighlights>
        }
      />

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ height: '500px', border: '2px solid var(--border-default)' }}>
          <SlideViewer slide={currentSlide} showAnswer={showAnswer} />
        </div>
      </div>
    </section>
  );
}
