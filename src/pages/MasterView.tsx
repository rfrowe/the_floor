/**
 * Master View - Duel Control Interface
 *
 * This is the game master's control panel for managing active duels.
 * Displays current duel state, shows answers, and provides control buttons.
 *
 * Based on Task 14 requirements.
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDuelState } from '@hooks/useDuelState';
import { SlideViewer } from '@components/slide/SlideViewer';
import { formatTime } from '@utils/time';
import styles from './MasterView.module.css';

function MasterView() {
  const navigate = useNavigate();
  const [duelState] = useDuelState();

  // Get time warning level
  const getTimeClass = (seconds: number): string => {
    if (seconds <= 5) return 'danger';
    if (seconds <= 10) return 'warning';
    return '';
  };

  // Handle exit duel
  const handleExitDuel = useCallback(() => {
    void navigate('/');
  }, [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Space: Correct (placeholder for Task 16)
      if (e.key === ' ') {
        e.preventDefault();
        console.log('[MasterView] Correct button (placeholder)');
        // TODO: Task 16 - Implement correct answer logic
      }

      // S: Skip (placeholder for Task 16)
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        console.log('[MasterView] Skip button (placeholder)');
        // TODO: Task 16 - Implement skip logic
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
  }, [handleExitDuel]);

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
    `${playerTimeClass} ${getTimeClass(duelState.timeRemaining1) === 'warning' ? warningClass : ''} ${getTimeClass(duelState.timeRemaining1) === 'danger' ? dangerClass : ''}`.trim();

  // Player 2 classes
  const player2Class = `${playerClass} ${activePlayer === 2 ? activeClass : ''}`.trim();
  const player2TimeClass =
    `${playerTimeClass} ${getTimeClass(duelState.timeRemaining2) === 'warning' ? warningClass : ''} ${getTimeClass(duelState.timeRemaining2) === 'danger' ? dangerClass : ''}`.trim();

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
          <div className={player1TimeClass}>{formatTime(duelState.timeRemaining1)}</div>
        </div>

        {/* Player 2 */}
        <div className={player2Class}>
          <div className={playerHeaderClass}>
            <h2 className={playerNameClass}>{duelState.contestant2.name}</h2>
            {activePlayer === 2 && <span className={activeIndicatorClass}>Active</span>}
          </div>
          <div className={player2TimeClass}>{formatTime(duelState.timeRemaining2)}</div>
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
            onClick={() => {
              console.log('[MasterView] Correct answer (placeholder)');
              // TODO: Task 16 - Implement correct answer logic
            }}
          >
            ✓ Correct
            <span className={buttonHintClass}>Press Space</span>
          </button>
          <button
            className={`${controlButtonClass} ${skipButtonClass}`.trim()}
            onClick={() => {
              console.log('[MasterView] Skip (placeholder)');
              // TODO: Task 16 - Implement skip logic
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
