import { useEffect, useState } from 'react';
import { useDuelState } from '@hooks/useDuelState';
import { useGameTimer } from '@hooks/useGameTimer';
import { SlideViewer } from '@components/slide/SlideViewer';
import { ClockBar } from '@components/duel/ClockBar';
import { loadTimerState } from '@/storage/timerState';
import type { Slide } from '@types';
import styles from './AudienceView.module.css';

/**
 * Full-screen audience display view for projection/display to audience and players.
 * Shows clock bar with player info and current slide with censor boxes.
 * Updates in real-time as master view makes changes via localStorage polling.
 */
function AudienceView() {
  const [duelState] = useDuelState();
  const [pollingTick, setPollingTick] = useState(0);
  const [slideTransitioning, setSlideTransitioning] = useState(false);
  const [displaySlide, setDisplaySlide] = useState<Slide | undefined>(undefined);

  // Store timer initial values as state to trigger proper re-renders
  const [initialTime1, setInitialTime1] = useState(0);
  const [initialTime2, setInitialTime2] = useState(0);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);

  // Initialize timer values on mount
  useEffect(() => {
    const timerState = loadTimerState();
    if (timerState) {
      setInitialTime1(timerState.timeRemaining1);
      setInitialTime2(timerState.timeRemaining2);
      setActivePlayer(timerState.activePlayer);
    } else if (duelState) {
      setInitialTime1(duelState.timeRemaining1);
      setInitialTime2(duelState.timeRemaining2);
      setActivePlayer(duelState.activePlayer);
    }
  }, []); // Only on mount

  // Update timer state whenever polling ticks (every 200ms)
  useEffect(() => {
    const loaded = loadTimerState();
    if (loaded) {
      setInitialTime1(loaded.timeRemaining1);
      setInitialTime2(loaded.timeRemaining2);
      setActivePlayer(loaded.activePlayer);
    } else if (duelState) {
      setInitialTime1(duelState.timeRemaining1);
      setInitialTime2(duelState.timeRemaining2);
      setActivePlayer(duelState.activePlayer);
    }
  }, [pollingTick, duelState]);

  // Initialize game timer for live countdown (updates every 100ms)
  const timer = useGameTimer({
    initialTime1,
    initialTime2,
    activePlayer,
    onTimeExpired: () => {
      // Audience view is read-only, no action needed
    },
  });

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
  const slideAreaClass = styles['slide-area'] ?? '';
  const transitioningClass = slideTransitioning ? (styles['transitioning'] ?? '') : '';
  const noSlideClass = styles['no-slide'] ?? '';

  const slideAreaClasses = `${slideAreaClass} ${transitioningClass}`.trim();

  return (
    <div className={containerClass}>
      {/* Clock bar with player info and timers */}
      <ClockBar
        contestant1={duelState.contestant1}
        contestant2={duelState.contestant2}
        timeRemaining1={timer.timeRemaining1}
        timeRemaining2={timer.timeRemaining2}
        activePlayer={activePlayer}
        categoryName={duelState.selectedCategory.name}
        {...(duelState.isSkipAnimationActive ? { skipAnswer } : {})}
      />

      {/* Slide display area */}
      <div className={slideAreaClasses}>
        {displaySlide ? (
          <SlideViewer slide={displaySlide} showAnswer={duelState.isSkipAnimationActive} />
        ) : (
          <div className={noSlideClass}>No slide available</div>
        )}
      </div>
    </div>
  );
}

export default AudienceView;
