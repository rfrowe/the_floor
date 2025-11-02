import { useEffect, useState } from 'react';
import { useDuelState } from '@hooks/useDuelState';
import { SlideViewer } from '@components/slide/SlideViewer';
import type { Slide } from '@types';
import styles from './AudienceView.module.css';

/**
 * Full-screen audience display view for projection/display to audience and players.
 * Shows clock bar with player info and current slide with censor boxes.
 * Updates in real-time as master view makes changes via localStorage polling.
 */
function AudienceView() {
  const [duelState] = useDuelState();
  const [, setPollingTick] = useState(0);
  const [slideTransitioning, setSlideTransitioning] = useState(false);
  const [displaySlide, setDisplaySlide] = useState<Slide | undefined>(undefined);

  // Poll localStorage every 200ms for real-time updates
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // Force re-read from localStorage by triggering a state update
      setPollingTick((tick) => tick + 1);
    }, 200);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Handle Escape key to exit fullscreen (browser fullscreen API support)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch((err: unknown) => {
          console.error('Error exiting fullscreen:', err);
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Preload next slide image for smooth transitions
  useEffect(() => {
    if (!duelState) {
      return;
    }

    const nextSlideIndex = duelState.currentSlideIndex + 1;
    const nextSlide = duelState.selectedCategory.slides[nextSlideIndex];

    if (nextSlide) {
      // Preload the next slide's image
      const img = new Image();
      img.src = nextSlide.imageUrl;
      // No need to do anything with the image - browser will cache it
    }
  }, [duelState]);

  // Handle slide transitions with fade effect
  useEffect(() => {
    if (!duelState) {
      setDisplaySlide(undefined);
      return undefined;
    }

    const currentSlide: Slide | undefined =
      duelState.selectedCategory.slides[duelState.currentSlideIndex];

    // If no slide is displayed yet (initial render), show it immediately
    if (currentSlide && !displaySlide) {
      setDisplaySlide(currentSlide);
      return undefined;
    }

    // If slide changed, trigger transition
    if (currentSlide && currentSlide !== displaySlide) {
      // Fade out
      setSlideTransitioning(true);

      // After fade out, change slide and fade in
      const timeout = setTimeout(() => {
        setDisplaySlide(currentSlide);
        setSlideTransitioning(false);
      }, 250); // 250ms transition duration

      return () => {
        clearTimeout(timeout);
      };
    }

    return undefined;
  }, [duelState, displaySlide]);

  // If no active duel, show waiting screen
  if (!duelState) {
    return (
      <div className={styles['container'] ?? ''}>
        <div className={styles['waiting-screen'] ?? ''}>
          <h1 className={styles['waiting-title'] ?? ''}>The Floor</h1>
          <p className={styles['waiting-message'] ?? ''}>Waiting for next duel...</p>
        </div>
      </div>
    );
  }

  // Get the answer to display during skip animation
  const skipAnswer = displaySlide?.answer ?? 'Skipped';

  // Build class names
  const containerClass = styles['container'] ?? '';
  const clockBarClass = styles['clock-bar'] ?? '';
  const playerInfoClass = styles['player-info'] ?? '';
  const playerNameClass = styles['player-name'] ?? '';
  const activeClass = styles['active'] ?? '';
  const timerClass = styles['timer'] ?? '';
  const separatorClass = styles['separator'] ?? '';
  const categoryClass = styles['category'] ?? '';
  const skipAnswerOverlayClass = styles['skip-answer-overlay'] ?? '';
  const skipAnswerTextClass = styles['skip-answer-text'] ?? '';
  const slideAreaClass = styles['slide-area'] ?? '';
  const transitioningClass = slideTransitioning ? (styles['transitioning'] ?? '') : '';
  const noSlideClass = styles['no-slide'] ?? '';

  const slideAreaClasses = `${slideAreaClass} ${transitioningClass}`.trim();

  const player1NameClasses =
    duelState.activePlayer === 1 ? `${playerNameClass} ${activeClass}`.trim() : playerNameClass;
  const player2NameClasses =
    duelState.activePlayer === 2 ? `${playerNameClass} ${activeClass}`.trim() : playerNameClass;

  return (
    <div className={containerClass}>
      {/* Clock bar with player info and timers */}
      <div className={clockBarClass}>
        <div className={playerInfoClass}>
          <span className={player1NameClasses}>{duelState.contestant1.name}</span>
          <span className={timerClass}>{Math.ceil(duelState.timeRemaining1)}s</span>
        </div>

        <div className={separatorClass}>◀▶</div>

        <div className={playerInfoClass}>
          <span className={timerClass}>{Math.ceil(duelState.timeRemaining2)}s</span>
          <span className={player2NameClasses}>{duelState.contestant2.name}</span>
        </div>

        <div className={categoryClass}>{duelState.selectedCategory.name}</div>

        {/* Skip answer overlay - appears in center when skip animation is active */}
        {duelState.isSkipAnimationActive && (
          <div className={skipAnswerOverlayClass}>
            <div className={skipAnswerTextClass}>{skipAnswer}</div>
          </div>
        )}
      </div>

      {/* Slide display area */}
      <div className={slideAreaClasses}>
        {displaySlide ? (
          <SlideViewer
            slide={displaySlide}
            fullscreen={true}
            showAnswer={duelState.isSkipAnimationActive}
          />
        ) : (
          <div className={noSlideClass}>No slide available</div>
        )}
      </div>
    </div>
  );
}

export default AudienceView;
