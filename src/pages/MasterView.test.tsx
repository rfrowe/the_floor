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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Import mocked hooks
import { useDuelState } from '@hooks/useDuelState';

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
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    cleanup();
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
      expect(screen.getByText('0:28.5')).toBeInTheDocument(); // Player 1
      expect(screen.getByText('0:30.0')).toBeInTheDocument(); // Player 2
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

    it('should log placeholder message when Correct is clicked', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      const correctButton = screen.getByText(/✓ Correct/).closest('button');
      if (correctButton) {
        fireEvent.click(correctButton);
      }

      expect(consoleSpy).toHaveBeenCalledWith('[MasterView] Correct answer (placeholder)');
    });

    it('should log placeholder message when Skip is clicked', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      const skipButton = screen.getByText(/⊗ Skip/).closest('button');
      if (skipButton) {
        fireEvent.click(skipButton);
      }

      expect(consoleSpy).toHaveBeenCalledWith('[MasterView] Skip (placeholder)');
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

    it('should trigger correct action on Space key', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      fireEvent.keyDown(document, { key: ' ' });

      expect(consoleSpy).toHaveBeenCalledWith('[MasterView] Correct button (placeholder)');
    });

    it('should trigger skip action on S key', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      fireEvent.keyDown(document, { key: 's' });

      expect(consoleSpy).toHaveBeenCalledWith('[MasterView] Skip button (placeholder)');
    });

    it('should trigger skip action on uppercase S key', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      fireEvent.keyDown(document, { key: 'S' });

      expect(consoleSpy).toHaveBeenCalledWith('[MasterView] Skip button (placeholder)');
    });

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

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('0:45.5')).toBeInTheDocument();
    });

    it('should format time correctly for values over 1 minute', () => {
      const longTimeState = {
        ...mockDuelState,
        timeRemaining1: 125.3,
      };
      vi.mocked(useDuelState).mockReturnValue([longTimeState, vi.fn()]);

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('2:05.3')).toBeInTheDocument();
    });

    it('should pad seconds correctly', () => {
      const paddedTimeState = {
        ...mockDuelState,
        timeRemaining1: 5.5,
      };
      vi.mocked(useDuelState).mockReturnValue([paddedTimeState, vi.fn()]);

      render(
        <MemoryRouter>
          <MasterView />
        </MemoryRouter>
      );

      expect(screen.getByText('0:05.5')).toBeInTheDocument();
    });
  });
});
