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
import { useTimerCommands } from '@hooks/useTimerCommands';
import { useAudienceConnection } from '@hooks/useAudienceConnection';
import { SlideViewer } from '@components/slide/SlideViewer';
import { formatTime } from '@utils/time';
import { clearTimerState } from '@/storage/timerState';
import { consolidateTerritories } from '@utils/territoryConsolidation';
import { onAppReset } from '@utils/resetApp';
import { createLogger } from '@/utils/logger';
import type { Contestant } from '@types';
import styles from './MasterView.module.css';

const log = createLogger('MasterView');

function MasterView() {
  const navigate = useNavigate();
  const [duelState, setDuelState] = useDuelState();
  const [contestants, { update: updateContestant }] = useContestants();
  const [controlsDisabled, setControlsDisabled] = useState(false);

  // Listen for app reset from Dashboard
  useEffect(() => {
    const cleanup = onAppReset(() => {
      // Redirect to dashboard when app is reset
      void navigate('/');
    });

    return cleanup;
  }, [navigate]);

  // Audience connection detection
  const { isConnected: audienceConnected } = useAudienceConnection();

  // Flag to prevent duplicate duel end handling
  const duelEndingRef = useRef(false);

  // Timer commands ref (will be set after hook initialization)
  const timerCommandsRef = useRef<ReturnType<typeof useTimerCommands> | null>(null);

  // Get time warning level
  const getTimeClass = (seconds: number): string => {
    if (seconds <= 5) return 'danger';
    if (seconds <= 10) return 'warning';
    return '';
  };

  // Handle duel end
  const handleDuelEnd = useCallback(
    async (winner: Contestant, loser: Contestant) => {
      // Prevent duplicate execution
      if (duelEndingRef.current) {
        return;
      }
      duelEndingRef.current = true;

      // Ensure duelState exists
      if (!duelState) {
        log.error('Cannot end duel: duelState is null');
        return;
      }

      // Send duel end command to audience
      timerCommandsRef.current?.sendDuelEnd();

      try {
        // IMPORTANT: Winner inherits the category that was NOT played in the duel
        // If duel used contestant1's category → winner gets contestant2's category
        // If duel used contestant2's category → winner gets contestant1's category
        // This ensures winner always gets the unplayed category
        const inheritedCategory =
          duelState.selectedCategory.name === duelState.contestant1.category.name
            ? duelState.contestant2.category
            : duelState.contestant1.category;

        // Consolidate territories - winner absorbs loser's grid squares
        const updatedContestants = consolidateTerritories(winner, loser, contestants);

        // Find the updated winner and loser from consolidated list
        const updatedWinner = updatedContestants.find((c) => c.id === winner.id);
        const updatedLoser = updatedContestants.find((c) => c.id === loser.id);

        if (!updatedWinner || !updatedLoser) {
          throw new Error('Failed to find updated contestants after territory consolidation');
        }

        // Update winner with category inheritance AND territory consolidation
        await updateContestant({
          ...updatedWinner,
          category: inheritedCategory,
        });

        // Update loser (eliminated + territory cleared)
        await updateContestant(updatedLoser);

        // Clear duel state and timer state
        setDuelState(null);
        clearTimerState();

        // Navigate to dashboard
        void navigate('/');

        // Show completion message
        alert(`${winner.name} wins! They inherit "${inheritedCategory.name}" from ${loser.name}`);
      } catch (error) {
        log.error('Error ending duel:', error);
        alert('Error ending duel. Check console for details.');
      }
    },
    [duelState, contestants, updateContestant, setDuelState, navigate]
  );

  // Handle player timeout callback (from Audience View)
  const handlePlayerTimeout = useCallback(
    (loser: 1 | 2) => {
      if (!duelState) return;

      const loserContestant = loser === 1 ? duelState.contestant1 : duelState.contestant2;
      const winnerContestant = loser === 1 ? duelState.contestant2 : duelState.contestant1;

      void handleDuelEnd(winnerContestant, loserContestant);
    },
    [duelState, handleDuelEnd]
  );

  // Handle skip end callback (from Audience View)
  const handleSkipEndCallback = useCallback(
    (_switchToPlayer: 1 | 2) => {
      if (!duelState) return;

      // Advance slide
      const nextIndex = duelState.currentSlideIndex + 1;

      // Check if last slide - skipping player continues (NOT the switched player)
      if (nextIndex >= duelState.selectedCategory.slides.length) {
        // All slides completed - skipping player (current active player) wins
        const winner = duelState.activePlayer === 1 ? duelState.contestant1 : duelState.contestant2;
        const loser = duelState.activePlayer === 1 ? duelState.contestant2 : duelState.contestant1;
        void handleDuelEnd(winner, loser);
        return;
      }

      // Update duel state - keep control with the player who skipped (duelState.activePlayer)
      const currentCommands = timerCommandsRef.current;
      if (currentCommands) {
        setDuelState({
          ...duelState,
          currentSlideIndex: nextIndex,
          activePlayer: duelState.activePlayer, // Keep control with skipping player
          isSkipAnimationActive: false,
          timeRemaining1: currentCommands.currentTime1,
          timeRemaining2: currentCommands.currentTime2,
        });
      }

      // Re-enable controls after skip completes
      setControlsDisabled(false);
    },
    [duelState, handleDuelEnd, setDuelState]
  );

  // Initialize timer commands hook
  const timerCommands = useTimerCommands({
    onPlayerTimeout: handlePlayerTimeout,
    onSkipEnd: handleSkipEndCallback,
  });

  // Store in ref for callbacks
  timerCommandsRef.current = timerCommands;

  // Reset duel ending flag when duel changes
  useEffect(() => {
    duelEndingRef.current = false;
  }, [duelState?.contestant1.id, duelState?.contestant2.id]);

  // Handle exit duel
  const handleExitDuel = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  // Handle correct answer
  const handleCorrect = useCallback(() => {
    if (!duelState || controlsDisabled) return;

    // Advance to next slide
    const nextIndex = duelState.currentSlideIndex + 1;
    const nextPlayer = duelState.activePlayer === 1 ? 2 : 1;

    // Check if last slide - active player wins by completion
    if (nextIndex >= duelState.selectedCategory.slides.length) {
      const winner = duelState.activePlayer === 1 ? duelState.contestant1 : duelState.contestant2;
      const loser = duelState.activePlayer === 1 ? duelState.contestant2 : duelState.contestant1;
      void handleDuelEnd(winner, loser);
      return;
    }

    // Update duel state: increment slide, switch player
    setDuelState({
      ...duelState,
      currentSlideIndex: nextIndex,
      activePlayer: nextPlayer,
      timeRemaining1: timerCommands.currentTime1,
      timeRemaining2: timerCommands.currentTime2,
    });

    // Send switch command to Audience View
    timerCommands.sendSwitch(nextPlayer);
  }, [duelState, controlsDisabled, timerCommands, handleDuelEnd, setDuelState]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!duelState || controlsDisabled) return;

    // Disable controls during animation
    setControlsDisabled(true);

    // Get current slide answer
    const currentSlide = duelState.selectedCategory.slides[duelState.currentSlideIndex];
    const answer = currentSlide?.answer ?? 'Skipped';

    // Send skip command to Audience View (which will handle timing and broadcasting)
    timerCommands.sendSkipStart(answer, duelState.activePlayer);

    // Update local duel state to show skip animation (will be updated when skip ends)
    setDuelState({
      ...duelState,
      isSkipAnimationActive: true,
      timeRemaining1: timerCommands.currentTime1,
      timeRemaining2: timerCommands.currentTime2,
    });
  }, [duelState, controlsDisabled, timerCommands, setDuelState]);

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
    `${playerTimeClass} ${getTimeClass(timerCommands.currentTime1) === 'warning' ? warningClass : ''} ${getTimeClass(timerCommands.currentTime1) === 'danger' ? dangerClass : ''}`.trim();

  // Player 2 classes
  const player2Class = `${playerClass} ${activePlayer === 2 ? activeClass : ''}`.trim();
  const player2TimeClass =
    `${playerTimeClass} ${getTimeClass(timerCommands.currentTime2) === 'warning' ? warningClass : ''} ${getTimeClass(timerCommands.currentTime2) === 'danger' ? dangerClass : ''}`.trim();

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

      {/* Audience Disconnection Warning */}
      {!audienceConnected && (
        <div
          style={{
            backgroundColor: 'var(--status-danger)',
            color: 'white',
            padding: '1rem',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          ⚠️ Audience View Disconnected - Timer may not be accurate. Please reopen Audience View.
        </div>
      )}

      {/* Player Status */}
      <section className={playerStatusClass}>
        {/* Player 1 */}
        <div className={player1Class}>
          <div className={playerHeaderClass}>
            <h2 className={playerNameClass}>{duelState.contestant1.name}</h2>
            {activePlayer === 1 && <span className={activeIndicatorClass}>Active</span>}
          </div>
          <div className={player1TimeClass}>{formatTime(timerCommands.currentTime1)}</div>
        </div>

        {/* Player 2 */}
        <div className={player2Class}>
          <div className={playerHeaderClass}>
            <h2 className={playerNameClass}>{duelState.contestant2.name}</h2>
            {activePlayer === 2 && <span className={activeIndicatorClass}>Active</span>}
          </div>
          <div className={player2TimeClass}>{formatTime(timerCommands.currentTime2)}</div>
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
