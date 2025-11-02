/**
 * Tests for MasterView component
 *
 * Tests cover:
 * - Rendering with valid duel state
 * - No active duel state handling
 * - Player display and active indicator
 * - Answer display
 * - Control buttons
 * - Keyboard shortcuts
 * - Navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import MasterView from './MasterView';
import type { DuelState } from '@types';

// Mock hooks
vi.mock('@hooks/useDuelState', () => ({
  useDuelState: vi.fn(),
}));

vi.mock('@hooks/useIndexedDB', () => ({
  useContestants: vi.fn(),
}));

vi.mock('@hooks/useGameTimer', () => ({
  useGameTimer: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Import mocked hooks
import { useDuelState } from '@hooks/useDuelState';
import { useContestants } from '@hooks/useIndexedDB';
import { useGameTimer } from '@hooks/useGameTimer';

// Mock duel state
const mockDuelState: DuelState = {
  contestant1: {
    id: '1',
    name: 'Alice',
    category: {
      name: 'Math',
      slides: [
        {
          imageUrl: '/slides/math-1.jpg',
          answer: 'The answer is 42',
          censorBoxes: [],
        },
        {
          imageUrl: '/slides/math-2.jpg',
          answer: 'Pi equals 3.14159',
          censorBoxes: [],
        },
      ],
    },
    eliminated: false,
    wins: 0,
  },
  contestant2: {
    id: '2',
    name: 'Bob',
    category: {
      name: 'History',
      slides: [
        {
          imageUrl: '/slides/history-1.jpg',
          answer: '1776',
          censorBoxes: [],
        },
      ],
    },
    eliminated: false,
    wins: 0,
  },
  selectedCategory: {
    name: 'Math',
    slides: [
      {
        imageUrl: '/slides/math-1.jpg',
        answer: 'The answer is 42',
        censorBoxes: [],
      },
      {
        imageUrl: '/slides/math-2.jpg',
        answer: 'Pi equals 3.14159',
        censorBoxes: [],
      },
    ],
  },
  activePlayer: 1,
  timeRemaining1: 28.5,
  timeRemaining2: 30.0,
  currentSlideIndex: 0,
  isSkipAnimationActive: false,
};

describe('MasterView', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    // Mock useContestants
    vi.mocked(useContestants).mockReturnValue([
      [],
      {
        add: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn(),
        refresh: vi.fn(),
      },
    ]);

    // Mock useGameTimer
    vi.mocked(useGameTimer).mockReturnValue({
      timeRemaining1: 28.5,
      timeRemaining2: 30.0,
      isRunning: true,
      pause: vi.fn(),
      resume: vi.fn(),
      updateTime: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Rendering with Duel State', () => {
    beforeEach(() => {
      vi.mocked(useDuelState).mockReturnValue([mockDuelState, vi.fn()]);
    });

    it('should render with valid duel state', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Math')).toBeInTheDocument();
    });

    it('should display contestant names correctly', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should display category name', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('Math')).toBeInTheDocument();
    });

    it('should display slide progress', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText(/Slide 1 \/ 2/)).toBeInTheDocument();
    });

    it('should display formatted time for both players', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      // Time is formatted as MM:SS.s
      expect(screen.getByText('28.5s')).toBeInTheDocument(); // Player 1
      expect(screen.getByText('30.0s')).toBeInTheDocument(); // Player 2
    });

    it('should show active indicator for active player', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      const activeIndicators = screen.getAllByText('Active');
      expect(activeIndicators).toHaveLength(1);
    });

    it('should highlight active player (Player 1)', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      // Find the player container (parent of player-header)
      const aliceHeader = screen.getByText('Alice');
      const playerContainer = aliceHeader.closest('div')?.parentElement;
      expect(playerContainer?.className).toContain('active');
    });

    it('should highlight active player (Player 2)', () => {
      const player2ActiveState = {
        ...mockDuelState,
        activePlayer: 2 as const,
      };
      vi.mocked(useDuelState).mockReturnValue([player2ActiveState, vi.fn()]);

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      // Find the player container (parent of player-header)
      const bobHeader = screen.getByText('Bob');
      const playerContainer = bobHeader.closest('div')?.parentElement;
      expect(playerContainer?.className).toContain('active');
    });
  });

  describe('Answer Display', () => {
    beforeEach(() => {
      vi.mocked(useDuelState).mockReturnValue([mockDuelState, vi.fn()]);
    });

    it('should display the current slide answer', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('The answer is 42')).toBeInTheDocument();
    });

    it('should display answer label', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('Answer:')).toBeInTheDocument();
    });

    it('should update answer when slide changes', () => {
      const { rerender } = render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('The answer is 42')).toBeInTheDocument();

      // Update to second slide
      const updatedState = {
        ...mockDuelState,
        currentSlideIndex: 1,
      };
      vi.mocked(useDuelState).mockReturnValue([updatedState, vi.fn()]);

      rerender(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('Pi equals 3.14159')).toBeInTheDocument();
    });
  });

  describe('Control Buttons', () => {
    beforeEach(() => {
      vi.mocked(useDuelState).mockReturnValue([mockDuelState, vi.fn()]);
    });

    it('should render Correct button', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText(/✓ Correct/)).toBeInTheDocument();
    });

    it('should render Skip button', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText(/⊗ Skip/)).toBeInTheDocument();
    });

    it('should show keyboard hints on buttons', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('Press Space')).toBeInTheDocument();
      expect(screen.getByText('Press S')).toBeInTheDocument();
    });

    // Note: Actual button functionality is tested in integration tests
    // These buttons now trigger real duel logic (Task 16)
  });

  describe('Duel Control Logic (Task 16)', () => {
    let mockSetDuelState: ReturnType<typeof vi.fn>;
    let mockUpdateContestant: ReturnType<typeof vi.fn>;
    let mockTimerPause: ReturnType<typeof vi.fn>;
    let mockTimerResume: ReturnType<typeof vi.fn>;
    let mockTimerUpdateTime: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockSetDuelState = vi.fn();
      mockUpdateContestant = vi.fn().mockResolvedValue(undefined);
      mockTimerPause = vi.fn();
      mockTimerResume = vi.fn();
      mockTimerUpdateTime = vi.fn();

      vi.mocked(useDuelState).mockReturnValue([mockDuelState, mockSetDuelState]);
      vi.mocked(useContestants).mockReturnValue([
        [],
        {
          add: vi.fn(),
          update: mockUpdateContestant,
          remove: vi.fn(),
          refresh: vi.fn(),
        },
      ]);
      vi.mocked(useGameTimer).mockReturnValue({
        timeRemaining1: 28.5,
        timeRemaining2: 30.0,
        isRunning: true,
        pause: mockTimerPause,
        resume: mockTimerResume,
        updateTime: mockTimerUpdateTime,
      });
    });

    describe('Correct Button', () => {
      it('should advance slide and switch players when Correct is clicked', () => {
        render(
          <MemoryRouter>
            <MasterView />
          </MemoryRouter>
        );

        const correctButton = screen.getByText(/✓ Correct/).closest('button');
        if (correctButton) {
          fireEvent.click(correctButton);
        }

        // Should pause timer
        expect(mockTimerPause).toHaveBeenCalled();

        // Should advance slide and switch player
        expect(mockSetDuelState).toHaveBeenCalledWith(
          expect.objectContaining({
            currentSlideIndex: 1,
            activePlayer: 2,
          })
        );

        // Should resume timer
        expect(mockTimerResume).toHaveBeenCalled();
      });

      it('should end duel when last slide is answered correctly', async () => {
        const lastSlideDuelState = {
          ...mockDuelState,
          currentSlideIndex: 1, // Last slide (2 slides total)
        };

        vi.mocked(useDuelState).mockReturnValue([lastSlideDuelState, mockSetDuelState]);

        // Mock window.alert
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

        render(
          <MemoryRouter>
            <MasterView />
          </MemoryRouter>
        );

        const correctButton = screen.getByText(/✓ Correct/).closest('button');
        if (correctButton) {
          fireEvent.click(correctButton);
        }

        // Wait for async operations
        await vi.waitFor(() => {
          expect(mockTimerPause).toHaveBeenCalled();
        });

        // Should update winner
        await vi.waitFor(() => {
          expect(mockUpdateContestant).toHaveBeenCalledWith(
            expect.objectContaining({
              id: '1',
              wins: 1,
              category: expect.objectContaining({ name: 'History' }) as object, // Inherits loser's category
            }) as object
          );
        });

        // Should eliminate loser
        await vi.waitFor(() => {
          expect(mockUpdateContestant).toHaveBeenCalledWith(
            expect.objectContaining({
              id: '2',
              eliminated: true,
            })
          );
        });

        // Should clear duel state
        expect(mockSetDuelState).toHaveBeenCalledWith(null);

        // Should navigate to dashboard
        expect(mockNavigate).toHaveBeenCalledWith('/');

        // Should show completion alert
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Alice wins'));

        alertSpy.mockRestore();
      });
    });

    describe('Skip Button', () => {
      it('should disable controls and set skip animation flag', () => {
        render(
          <MemoryRouter>
            <MasterView />
          </MemoryRouter>
        );

        const skipButton = screen.getByText(/⊗ Skip/).closest('button');
        if (skipButton) {
          fireEvent.click(skipButton);
        }

        // Should pause timer
        expect(mockTimerPause).toHaveBeenCalled();

        // Should set skip animation flag
        expect(mockSetDuelState).toHaveBeenCalledWith(
          expect.objectContaining({
            isSkipAnimationActive: true,
          })
        );

        // Buttons should be disabled (via disabled attribute)
        const correctButton = screen.getByText(/✓ Correct/).closest('button');
        expect(correctButton).toBeDisabled();
        expect(skipButton).toBeDisabled();
      });

      it('should apply 3-second penalty and advance slide after animation', async () => {
        render(
          <MemoryRouter>
            <MasterView />
          </MemoryRouter>
        );

        const skipButton = screen.getByText(/⊗ Skip/).closest('button');
        if (skipButton) {
          fireEvent.click(skipButton);
        }

        // Advance timers by 3 seconds
        await vi.advanceTimersByTimeAsync(3000);

        // Should apply 3-second penalty
        expect(mockTimerUpdateTime).toHaveBeenCalledWith(1, expect.any(Number));
        const callArg = vi.mocked(mockTimerUpdateTime).mock.calls[0]?.[1] as number | undefined;
        if (callArg !== undefined) {
          expect(callArg).toBeLessThan(28.5); // Original time minus 3
        }

        // Should advance slide and switch player
        expect(mockSetDuelState).toHaveBeenCalledWith(
          expect.objectContaining({
            currentSlideIndex: 1,
            activePlayer: 2,
            isSkipAnimationActive: false,
          })
        );

        // Should resume timer
        expect(mockTimerResume).toHaveBeenCalled();
      });

      it('should end duel if skip penalty causes time expiration', async () => {
        // Set timer to have only 2 seconds left
        vi.mocked(useGameTimer).mockReturnValue({
          timeRemaining1: 2.0,
          timeRemaining2: 30.0,
          isRunning: true,
          pause: mockTimerPause,
          resume: mockTimerResume,
          updateTime: mockTimerUpdateTime,
        });

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

        render(
          <MemoryRouter>
            <MasterView />
          </MemoryRouter>
        );

        const skipButton = screen.getByText(/⊗ Skip/).closest('button');
        if (skipButton) {
          fireEvent.click(skipButton);
        }

        // Advance timers by 3 seconds
        await vi.advanceTimersByTimeAsync(3000);

        // Should end duel (2s - 3s penalty = -1s)
        await vi.waitFor(() => {
          expect(mockUpdateContestant).toHaveBeenCalledWith(
            expect.objectContaining({
              id: '2',
              wins: 1, // Player 2 wins
            })
          );
        });

        // Should eliminate player 1 (ran out of time)
        await vi.waitFor(() => {
          expect(mockUpdateContestant).toHaveBeenCalledWith(
            expect.objectContaining({
              id: '1',
              eliminated: true,
            })
          );
        });

        alertSpy.mockRestore();
      });
    });

    describe('Keyboard Shortcuts', () => {
      it('should trigger Correct on Space key', () => {
        render(
          <MemoryRouter>
            <MasterView />
          </MemoryRouter>
        );

        fireEvent.keyDown(document, { key: ' ' });

        expect(mockTimerPause).toHaveBeenCalled();
        expect(mockSetDuelState).toHaveBeenCalled();
      });

      it('should trigger Skip on S key', () => {
        render(
          <MemoryRouter>
            <MasterView />
          </MemoryRouter>
        );

        fireEvent.keyDown(document, { key: 's' });

        expect(mockTimerPause).toHaveBeenCalled();
        expect(mockSetDuelState).toHaveBeenCalledWith(
          expect.objectContaining({
            isSkipAnimationActive: true,
          })
        );
      });

      it('should not trigger actions when controls are disabled', () => {
        render(
          <MemoryRouter>
            <MasterView />
          </MemoryRouter>
        );

        // Trigger skip to disable controls
        const skipButton = screen.getByText(/⊗ Skip/).closest('button');
        if (skipButton) {
          fireEvent.click(skipButton);
        }

        vi.clearAllMocks();

        // Try to trigger correct while disabled
        fireEvent.keyDown(document, { key: ' ' });

        // Should not call setDuelState again (already called once for skip)
        expect(mockSetDuelState).not.toHaveBeenCalled();
      });
    });

    describe('Category Inheritance', () => {
      it('should give winner the loser category (UNPLAYED category)', async () => {
        const lastSlideDuelState = {
          ...mockDuelState,
          currentSlideIndex: 1, // Last slide
        };

        vi.mocked(useDuelState).mockReturnValue([lastSlideDuelState, mockSetDuelState]);

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

        render(
          <MemoryRouter>
            <MasterView />
          </MemoryRouter>
        );

        const correctButton = screen.getByText(/✓ Correct/).closest('button');
        if (correctButton) {
          fireEvent.click(correctButton);
        }

        // Winner (Alice, player 1) should inherit loser's (Bob) category (History)
        await vi.waitFor(() => {
          expect(mockUpdateContestant).toHaveBeenCalledWith(
            expect.objectContaining({
              id: '1',
              category: expect.objectContaining({ name: 'History' }) as object,
            }) as object
          );
        });

        alertSpy.mockRestore();
      });
    });
  });

  describe('No Active Duel State', () => {
    beforeEach(() => {
      vi.mocked(useDuelState).mockReturnValue([null, vi.fn()]);
    });

    it('should render no active duel message', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('No Active Duel')).toBeInTheDocument();
    });

    it('should show return to dashboard message', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText(/There is currently no duel in progress/)).toBeInTheDocument();
    });

    it('should render return to dashboard button', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('Return to Dashboard')).toBeInTheDocument();
    });

    it('should navigate to dashboard when button is clicked', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      const button = screen.getByText('Return to Dashboard');
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(useDuelState).mockReturnValue([mockDuelState, vi.fn()]);
    });

    it('should render exit duel button', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('← Exit Duel')).toBeInTheDocument();
    });

    it('should navigate to dashboard when exit button is clicked', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      const exitButton = screen.getByText('← Exit Duel');
      fireEvent.click(exitButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      vi.mocked(useDuelState).mockReturnValue([mockDuelState, vi.fn()]);
    });

    // Note: Keyboard shortcuts for Correct (Space) and Skip (S) now trigger real duel logic
    // Actual functionality is tested in integration tests (Task 16)

    it('should navigate to dashboard on Escape key', () => {
      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should not trigger shortcuts when typing in input', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: ' ' });

      expect(consoleSpy).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });

  describe('Time Formatting', () => {
    it('should format time correctly for values under 1 minute', () => {
      const shortTimeState = {
        ...mockDuelState,
        timeRemaining1: 45.5,
      };
      vi.mocked(useDuelState).mockReturnValue([shortTimeState, vi.fn()]);
      vi.mocked(useGameTimer).mockReturnValue({
        timeRemaining1: 45.5,
        timeRemaining2: 30.0,
        isRunning: true,
        pause: vi.fn(),
        resume: vi.fn(),
        updateTime: vi.fn(),
      });

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('45.5s')).toBeInTheDocument();
    });

    it('should format time correctly for values over 1 minute', () => {
      const longTimeState = {
        ...mockDuelState,
        timeRemaining1: 125.3,
      };
      vi.mocked(useDuelState).mockReturnValue([longTimeState, vi.fn()]);
      vi.mocked(useGameTimer).mockReturnValue({
        timeRemaining1: 125.3,
        timeRemaining2: 30.0,
        isRunning: true,
        pause: vi.fn(),
        resume: vi.fn(),
        updateTime: vi.fn(),
      });

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('2:05.2')).toBeInTheDocument();
    });

    it('should pad seconds correctly', () => {
      const paddedTimeState = {
        ...mockDuelState,
        timeRemaining1: 5.5,
      };
      vi.mocked(useDuelState).mockReturnValue([paddedTimeState, vi.fn()]);
      vi.mocked(useGameTimer).mockReturnValue({
        timeRemaining1: 5.5,
        timeRemaining2: 30.0,
        isRunning: true,
        pause: vi.fn(),
        resume: vi.fn(),
        updateTime: vi.fn(),
      });

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('5.5s')).toBeInTheDocument();
    });
  });
});
