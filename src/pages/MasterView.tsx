/**
 * Master View - Duel Control Interface
 *
 * This is the game master's control panel for managing active duels.
 * Displays current duel state, shows answers, and provides control buttons.
 *
 * Based on Task 14 requirements.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDuelState } from '@hooks/useDuelState';
import { useContestants } from '@hooks/useIndexedDB';
import { useGameTimer } from '@hooks/useGameTimer';
import { SlideViewer } from '@components/slide/SlideViewer';
import { formatTime } from '@utils/time';
import { saveTimerState, clearTimerState } from '@/storage/timerState';
import type { Contestant } from '@types';
import styles from './MasterView.module.css';

function MasterView() {
  const navigate = useNavigate();
  const [duelState, setDuelState] = useDuelState();
  const [, { update: updateContestant }] = useContestants();
  const [controlsDisabled, setControlsDisabled] = useState(false);

  // Skip timeout ref for cleanup
  const skipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flag to prevent duplicate duel end handling
  const duelEndingRef = useRef(false);

  // Get time warning level
  const getTimeClass = (seconds: number): string => {
    if (seconds <= 5) return 'danger';
    if (seconds <= 10) return 'warning';
    return '';
  };

  // Handle duel end
  // Note: timer accessed in closure but not in deps to avoid circular dependency
  const handleDuelEnd = useCallback(
    async (winner: Contestant, loser: Contestant) => {
      // Prevent duplicate execution
      if (duelEndingRef.current) {
        return;
      }
      duelEndingRef.current = true;

      // Pause timer
      timer.pause();

      // Cancel any pending skip animation
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
        skipTimeoutRef.current = null;
      }

      try {
        // Winner inherits the loser's category (the UNPLAYED category)
        const inheritedCategory = loser.category;

        await updateContestant({
          ...winner,
          wins: winner.wins + 1,
          category: inheritedCategory,
        });

        // Eliminate loser
        await updateContestant({
          ...loser,
          eliminated: true,
        });

        // Clear duel state and timer state
        setDuelState(null);
        clearTimerState();

        // Navigate to dashboard
        void navigate('/');

        // Show completion message
        alert(`${winner.name} wins! They inherit "${inheritedCategory.name}" from ${loser.name}`);
      } catch (error) {
        console.error('Error ending duel:', error);
        alert('Error ending duel. Check console for details.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateContestant, setDuelState, navigate]
  );

  // Handle time expiration
  const handleTimeExpired = useCallback(
    (player: 1 | 2) => {
      if (!duelState) return;

      // Player who ran out of time loses
      const loser = player === 1 ? duelState.contestant1 : duelState.contestant2;
      const winner = player === 1 ? duelState.contestant2 : duelState.contestant1;

      void handleDuelEnd(winner, loser);
    },
    [duelState, handleDuelEnd]
  );

  // Initialize game timer if duel is active
  const timer = useGameTimer({
    initialTime1: duelState?.timeRemaining1 ?? 0,
    initialTime2: duelState?.timeRemaining2 ?? 0,
    activePlayer: duelState?.activePlayer ?? 1,
    onTimeExpired: handleTimeExpired,
  });

  // Store timer in ref for interval access
  const timerRef = useRef(timer);
  timerRef.current = timer;

  // Sync timer values to separate storage every 200ms for AudienceView
  // This doesn't affect duelState, so no re-renders!
  useEffect(() => {
    if (!duelState) {
      return;
    }

    // Save timer state every 200ms (matches AudienceView polling)
    const syncInterval = setInterval(() => {
      saveTimerState({
        timeRemaining1: timerRef.current.timeRemaining1,
        timeRemaining2: timerRef.current.timeRemaining2,
        activePlayer: duelState.activePlayer,
        lastUpdate: Date.now(),
      });
    }, 200);

    return () => {
      clearInterval(syncInterval);
    };
  }, [duelState]);

  // Reset duel ending flag when duel changes
  useEffect(() => {
    duelEndingRef.current = false;
  }, [duelState?.contestant1?.id, duelState?.contestant2?.id]);

  // Cleanup skip timeout on unmount
  useEffect(() => {
    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
    };
  }, []);

  // Handle exit duel
  const handleExitDuel = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  // Handle correct answer
  const handleCorrect = useCallback(() => {
    if (!duelState || controlsDisabled) return;

    // Advance to next slide
    const nextIndex = duelState.currentSlideIndex + 1;

    // Check if last slide - active player wins by completion
    if (nextIndex >= duelState.selectedCategory.slides.length) {
      timer.pause();
      const winner = duelState.activePlayer === 1 ? duelState.contestant1 : duelState.contestant2;
      const loser = duelState.activePlayer === 1 ? duelState.contestant2 : duelState.contestant1;
      void handleDuelEnd(winner, loser);
      return;
    }

    // Update duel state: increment slide, switch player
    // Timer continues running - the activePlayer change will make it switch to the new player
    setDuelState({
      ...duelState,
      currentSlideIndex: nextIndex,
      activePlayer: duelState.activePlayer === 1 ? 2 : 1,
      timeRemaining1: timer.timeRemaining1,
      timeRemaining2: timer.timeRemaining2,
    });
  }, [duelState, controlsDisabled, timer, handleDuelEnd, setDuelState]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!duelState || controlsDisabled) return;

    // Disable controls during animation
    setControlsDisabled(true);

    // Pause timer during skip animation
    timer.pause();

    // Set skip animation flag
    setDuelState({
      ...duelState,
      isSkipAnimationActive: true,
      timeRemaining1: timer.timeRemaining1,
      timeRemaining2: timer.timeRemaining2,
    });

    // Start 3-second countdown
    skipTimeoutRef.current = setTimeout(() => {
      // Deduct 3 seconds from current player
      const currentTime =
        duelState.activePlayer === 1 ? timer.timeRemaining1 : timer.timeRemaining2;
      const newTime = currentTime - 3;

      // Check if time expired due to penalty
      if (newTime <= 0) {
        const loser = duelState.activePlayer === 1 ? duelState.contestant1 : duelState.contestant2;
        const winner = duelState.activePlayer === 1 ? duelState.contestant2 : duelState.contestant1;
        void handleDuelEnd(winner, loser);
        return;
      }

      // Update time via timer hook
      timer.updateTime(duelState.activePlayer, newTime);

      // Advance slide and switch player
      const nextIndex = duelState.currentSlideIndex + 1;

      // Check if last slide - active player wins by completion
      if (nextIndex >= duelState.selectedCategory.slides.length) {
        const winner = duelState.activePlayer === 1 ? duelState.contestant1 : duelState.contestant2;
        const loser = duelState.activePlayer === 1 ? duelState.contestant2 : duelState.contestant1;
        void handleDuelEnd(winner, loser);
        return;
      }

      // Update duel state
      setDuelState({
        ...duelState,
        currentSlideIndex: nextIndex,
        activePlayer: duelState.activePlayer === 1 ? 2 : 1,
        isSkipAnimationActive: false,
        timeRemaining1: duelState.activePlayer === 1 ? newTime : timer.timeRemaining1,
        timeRemaining2: duelState.activePlayer === 2 ? newTime : timer.timeRemaining2,
      });

      // Re-enable controls and resume timer
      setControlsDisabled(false);
      timer.resume();
    }, 3000);
  }, [duelState, controlsDisabled, timer, handleDuelEnd, setDuelState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Space: Correct
      if (e.key === ' ') {
        e.preventDefault();
        if (!controlsDisabled) {
          handleCorrect();
        }
      }

      // S: Skip
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (!controlsDisabled) {
          handleSkip();
        }
      }

      // Escape: Exit duel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExitDuel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleExitDuel, handleCorrect, handleSkip, controlsDisabled]);

  // No active duel state
  if (!duelState) {
    const noDuelClass = styles['no-duel'] ?? '';
    const noDuelIconClass = styles['no-duel-icon'] ?? '';
    const noDuelButtonClass = styles['no-duel-button'] ?? '';

    return (
      <div className={noDuelClass}>
        <div className={noDuelIconClass}>⚔️</div>
        <h2>No Active Duel</h2>
        <p>There is currently no duel in progress. Return to the dashboard to start a new duel.</p>
        <button onClick={handleExitDuel} className={noDuelButtonClass}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Get current slide and answer
  const currentSlide = duelState.selectedCategory.slides[duelState.currentSlideIndex];
  const answer = currentSlide?.answer ?? 'No answer available';

  // Determine active player
  const activePlayer = duelState.activePlayer;

  // Extract CSS classes
  const masterViewClass = styles['master-view'] ?? '';
  const headerClass = styles['header'] ?? '';
  const headerLeftClass = styles['header-left'] ?? '';
  const exitButtonClass = styles['exit-button'] ?? '';
  const categoryInfoClass = styles['category-info'] ?? '';
  const categoryLabelClass = styles['category-label'] ?? '';
  const categoryNameClass = styles['category-name'] ?? '';
  const slideProgressClass = styles['slide-progress'] ?? '';
  const playerStatusClass = styles['player-status'] ?? '';
  const playerClass = styles['player'] ?? '';
  const activeClass = styles['active'] ?? '';
  const playerHeaderClass = styles['player-header'] ?? '';
  const playerNameClass = styles['player-name'] ?? '';
  const activeIndicatorClass = styles['active-indicator'] ?? '';
  const playerTimeClass = styles['player-time'] ?? '';
  const warningClass = styles['warning'] ?? '';
  const dangerClass = styles['danger'] ?? '';
  const contentClass = styles['content'] ?? '';
  const slidePreviewClass = styles['slide-preview'] ?? '';
  const slidePreviewLabelClass = styles['slide-preview-label'] ?? '';
  const answerSectionClass = styles['answer-section'] ?? '';
  const answerLabelClass = styles['answer-label'] ?? '';
  const answerTextClass = styles['answer-text'] ?? '';
  const controlsClass = styles['controls'] ?? '';
  const controlButtonClass = styles['control-button'] ?? '';
  const correctButtonClass = styles['correct-button'] ?? '';
  const skipButtonClass = styles['skip-button'] ?? '';
  const buttonHintClass = styles['button-hint'] ?? '';

  // Player 1 classes
  const player1Class = `${playerClass} ${activePlayer === 1 ? activeClass : ''}`.trim();
  const player1TimeClass =
    `${playerTimeClass} ${getTimeClass(timer.timeRemaining1) === 'warning' ? warningClass : ''} ${getTimeClass(timer.timeRemaining1) === 'danger' ? dangerClass : ''}`.trim();

  // Player 2 classes
  const player2Class = `${playerClass} ${activePlayer === 2 ? activeClass : ''}`.trim();
  const player2TimeClass =
    `${playerTimeClass} ${getTimeClass(timer.timeRemaining2) === 'warning' ? warningClass : ''} ${getTimeClass(timer.timeRemaining2) === 'danger' ? dangerClass : ''}`.trim();

  return (
    <div className={masterViewClass}>
      {/* Header */}
      <header className={headerClass}>
        <div className={headerLeftClass}>
          <button onClick={handleExitDuel} className={exitButtonClass}>
            ← Exit Duel
          </button>
          <div className={categoryInfoClass}>
            <span className={categoryLabelClass}>Category</span>
            <span className={categoryNameClass}>{duelState.selectedCategory.name}</span>
          </div>
        </div>
        <div className={slideProgressClass}>
          Slide {duelState.currentSlideIndex + 1} / {duelState.selectedCategory.slides.length}
        </div>
      </header>

      {/* Player Status */}
      <section className={playerStatusClass}>
        {/* Player 1 */}
        <div className={player1Class}>
          <div className={playerHeaderClass}>
            <h2 className={playerNameClass}>{duelState.contestant1.name}</h2>
            {activePlayer === 1 && <span className={activeIndicatorClass}>Active</span>}
          </div>
          <div className={player1TimeClass}>{formatTime(timer.timeRemaining1)}</div>
        </div>

        {/* Player 2 */}
        <div className={player2Class}>
          <div className={playerHeaderClass}>
            <h2 className={playerNameClass}>{duelState.contestant2.name}</h2>
            {activePlayer === 2 && <span className={activeIndicatorClass}>Active</span>}
          </div>
          <div className={player2TimeClass}>{formatTime(timer.timeRemaining2)}</div>
        </div>
      </section>

      {/* Main Content */}
      <main className={contentClass}>
        {/* Optional Slide Preview */}
        {currentSlide && (
          <div className={slidePreviewClass}>
            <div className={slidePreviewLabelClass}>Current Slide (Preview)</div>
            <SlideViewer slide={currentSlide} showAnswer={false} />
          </div>
        )}

        {/* Answer Display */}
        <section className={answerSectionClass}>
          <div className={answerLabelClass}>Answer:</div>
          <div className={answerTextClass}>{answer}</div>
        </section>

        {/* Control Buttons */}
        <div className={controlsClass}>
          <button
            className={`${controlButtonClass} ${correctButtonClass}`.trim()}
            onClick={handleCorrect}
            disabled={controlsDisabled}
            style={{
              opacity: controlsDisabled ? 0.5 : 1,
              cursor: controlsDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            ✓ Correct
            <span className={buttonHintClass}>Press Space</span>
          </button>
          <button
            className={`${controlButtonClass} ${skipButtonClass}`.trim()}
            onClick={handleSkip}
            disabled={controlsDisabled}
            style={{
              opacity: controlsDisabled ? 0.5 : 1,
              cursor: controlsDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            ⊗ Skip
            <span className={buttonHintClass}>Press S</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default MasterView;
