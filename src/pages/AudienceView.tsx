import { useEffect, useState, useCallback, useRef } from 'react';
import { useDuelState } from '@hooks/useDuelState';
import { useContestants } from '@hooks/useIndexedDB';
import { useAuthoritativeTimer } from '@hooks/useAuthoritativeTimer';
import { useContestantSelectionListener } from '@hooks/useContestantSelectionListener';
import { SlideViewer } from '@components/slide/SlideViewer';
import { ClockBar } from '@components/duel/ClockBar';
import { FloorGrid } from '@components/floor/FloorGrid';
import { loadTimerState } from '@storage/timerState';
import { onAppReset } from '@utils/resetApp';
import type { Slide } from '@types';
import styles from './AudienceView.module.css';

/**
 * Full-screen audience display view for projection/display to audience and players.
 * Shows clock bar with player info and current slide with censor boxes.
 * This view is the AUTHORITATIVE source for game timing.
 */
function AudienceView() {
  const [duelState] = useDuelState();
  const [contestants] = useContestants();
  const { selectedIds: selectedContestantIds, selectedCategoryName } =
    useContestantSelectionListener();
  const [slideTransitioning, setSlideTransitioning] = useState(false);
  const [displaySlide, setDisplaySlide] = useState<Slide | undefined>(undefined);

  // Callbacks for authoritative timer
  const handlePlayerTimeout = useCallback((loser: 1 | 2) => {
    console.log('[AudienceView] Player timeout:', loser);
    // Timeout is broadcast to Master View, which handles duel end
  }, []);

  const handleSkipEnd = useCallback((switchToPlayer: 1 | 2) => {
    console.log('[AudienceView] Skip ended, switched to player:', switchToPlayer);
    // Skip end is broadcast to Master View
  }, []);

  // Initialize authoritative timer
  const authTimer = useAuthoritativeTimer({
    initialTime1: duelState?.timeRemaining1 ?? 30,
    initialTime2: duelState?.timeRemaining2 ?? 30,
    initialActivePlayer: duelState?.activePlayer ?? 1,
    onPlayerTimeout: handlePlayerTimeout,
    onSkipEnd: handleSkipEnd,
  });

  // Track if we've already resumed (to prevent re-sending START on re-renders)
  const hasResumedRef = useRef(false);

  // Listen for app reset from other windows
  useEffect(() => {
    const cleanup = onAppReset(() => {
      // Stay on audience view - just reload to show waiting page
      window.location.reload();
    });

    return cleanup;
  }, []);

  // Resume duel if opening mid-game (Case 8: Audience View Opens Mid-Duel)
  useEffect(() => {
    console.log('[AudienceView] Resume effect triggered', {
      hasDuelState: !!duelState,
      hasResumed: hasResumedRef.current,
    });

    if (!duelState) {
      console.log('[AudienceView] No duel state, skipping resume');
      return;
    }

    if (hasResumedRef.current) {
      console.log('[AudienceView] Already resumed, skipping');
      return;
    }

    // Check if there's a timer state from a running duel
    const timerState = loadTimerState();
    console.log('[AudienceView] Loaded timer state:', timerState);

    if (timerState) {
      console.log('[AudienceView] Resuming duel with timer state:', timerState);

      // IMPORTANT: Do NOT subtract elapsed time!
      // When Audience View is closed, contestants can't see slides, so time shouldn't advance.
      // Resume from exactly where we left off for fair gameplay.
      console.log('[AudienceView] Resuming from saved times (no time subtraction for fairness):', {
        time1: timerState.timeRemaining1,
        time2: timerState.timeRemaining2,
        activePlayer: timerState.activePlayer,
      });

      // Start timer directly (can't use BroadcastChannel to send to self)
      console.log('[AudienceView] Calling startTimer directly');
      authTimer.startTimer(
        timerState.timeRemaining1,
        timerState.timeRemaining2,
        timerState.activePlayer
      );

      hasResumedRef.current = true;
    }
  }, [duelState, authTimer]);

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

  // If no active duel, show grid view (or waiting screen if no contestants positioned)
  if (!duelState) {
    // Check if any contestants have grid positions
    const hasPositionedContestants = contestants.some(
      (c) => c.controlledSquares && c.controlledSquares.length > 0
    );

    if (hasPositionedContestants) {
      // Find selected contestants from IDs
      const selectedContestant1 = selectedContestantIds[0]
        ? contestants.find((c) => c.id === selectedContestantIds[0])
        : undefined;
      const selectedContestant2 = selectedContestantIds[1]
        ? contestants.find((c) => c.id === selectedContestantIds[1])
        : undefined;

      // Show grid view with contestant territories
      return (
        <div className={styles['container'] ?? ''}>
          {/* Always show ClockBar when grid is visible */}
          <ClockBar
            contestant1={selectedContestant1 ?? null}
            contestant2={selectedContestant2 ?? null}
            timeRemaining1={30}
            timeRemaining2={30}
            activePlayer={1}
            categoryName={selectedCategoryName ?? '—'}
          />
          <FloorGrid contestants={contestants} selectedContestantIds={selectedContestantIds} />
        </div>
      );
    }

    // Fall back to waiting screen if grid not initialized
    return (
      <div className={styles['container'] ?? ''}>
        <div className={styles['waiting-screen'] ?? ''}>
          <h1 className={styles['waiting-title'] ?? ''}>The Floor</h1>
          <p className={styles['waiting-message'] ?? ''}>Waiting for next duel...</p>
        </div>
      </div>
    );
  }

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
        timeRemaining1={authTimer.time1}
        timeRemaining2={authTimer.time2}
        activePlayer={authTimer.activePlayer}
        categoryName={duelState.selectedCategory.name}
        {...(authTimer.isSkipActive && authTimer.skipAnswer
          ? { skipAnswer: authTimer.skipAnswer }
          : {})}
      />

      {/* Slide display area */}
      <div className={slideAreaClasses}>
        {displaySlide ? (
          <SlideViewer slide={displaySlide} showAnswer={authTimer.isSkipActive} />
        ) : (
          <div className={noSlideClass}>No slide available</div>
        )}
      </div>
    </div>
  );
}

export default AudienceView;
