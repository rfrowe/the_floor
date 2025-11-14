import { useMemo } from 'react';
import { SlideViewer } from '@components/slide/SlideViewer';
import { ComponentController } from '@pages/ComponentController';
import { DemoDescription, DemoHighlights } from '@pages/DemoControlsContent';
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
        description={
          <DemoDescription>
            <p>
              Displays slide images with censorship boxes overlaid at precise positions. Handles
              aspect ratio preservation with letterboxing and responsive sizing. Used in both duel
              gameplay (MasterView, AudienceView) and import workflows.
            </p>
          </DemoDescription>
        }
        highlights={
          <DemoHighlights title="Try These Controls:">
            - <strong>Slide dropdown:</strong> Switch between demo and test slides
            <br />- <strong>Show Answer toggle:</strong> Reveal/hide the answer
            <br />- <strong>Censor boxes sliders:</strong> Adjust box positions
            <br />- <strong>Box count:</strong> Add/remove censorship boxes
            <br />- Watch how boxes maintain precise positions as you adjust them
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
