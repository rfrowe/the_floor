/**
 * Tests for AudienceView component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react';
import AudienceView from './AudienceView';
import type { DuelState } from '@types';

// Create mock function at module level using vi.hoisted
const { mockUseDuelState } = vi.hoisted(() => ({
  mockUseDuelState: vi.fn(),
}));

// Mock the hooks and components
vi.mock('@hooks/useDuelState', () => ({
  useDuelState: mockUseDuelState,
}));

vi.mock('@components/slide/SlideViewer', () => ({
  SlideViewer: ({
    slide,
    fullscreen,
    showAnswer,
  }: {
    slide: { imageUrl: string; answer: string };
    fullscreen: boolean;
    showAnswer: boolean;
  }) => (
    <div data-testid="slide-viewer">
      <span data-testid="slide-url">{slide.imageUrl}</span>
      <span data-testid="slide-answer">{slide.answer}</span>
      <span data-testid="fullscreen">{fullscreen ? 'true' : 'false'}</span>
      <span data-testid="show-answer">{showAnswer ? 'true' : 'false'}</span>
    </div>
  ),
}));

describe('AudienceView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock document.exitFullscreen
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Waiting Screen', () => {
    it('should render waiting screen when no duel state', () => {
      mockUseDuelState.mockReturnValue([null, vi.fn()]);

      render(<AudienceView />);

      expect(screen.getByText('The Floor')).toBeInTheDocument();
      expect(screen.getByText('Waiting for next duel...')).toBeInTheDocument();
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
    });

    it('should not render clock bar when no duel state', () => {
      mockUseDuelState.mockReturnValue([null, vi.fn()]);

      render(<AudienceView />);

      expect(screen.queryByText(/◀▶/)).not.toBeInTheDocument();
    });
  });

  describe('Clock Bar with Duel State', () => {
    const mockDuelState: DuelState = {
      contestant1: {
        id: 'alice-1',
        name: 'Alice',
        category: {
          name: 'Math',
          slides: [
            {
              imageUrl: '/test-slide.png',
              answer: 'Test Answer',
              censorBoxes: [],
            },
          ],
        },
        wins: 2,
        eliminated: false,
      },
      contestant2: {
        id: 'bob-2',
        name: 'Bob',
        category: {
          name: 'Science',
          slides: [],
        },
        wins: 1,
        eliminated: false,
      },
      activePlayer: 1,
      timeRemaining1: 28.7,
      timeRemaining2: 30.2,
      currentSlideIndex: 0,
      selectedCategory: {
        name: 'Math',
        slides: [
          {
            imageUrl: '/test-slide.png',
            answer: 'Test Answer',
            censorBoxes: [],
          },
        ],
      },
      isSkipAnimationActive: false,
    };

    it('should render clock bar with player names', () => {
      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should render timers with rounded up values', () => {
      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      // timeRemaining1 = 28.7 -> Math.ceil = 29
      // timeRemaining2 = 30.2 -> Math.ceil = 31
      expect(screen.getByText('29s')).toBeInTheDocument();
      expect(screen.getByText('31s')).toBeInTheDocument();
    });

    it('should render category name', () => {
      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      expect(screen.getByText('Math')).toBeInTheDocument();
    });

    it('should render separator', () => {
      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      expect(screen.getByText('◀▶')).toBeInTheDocument();
    });

    it('should highlight active player 1', () => {
      const duelWithPlayer1Active = { ...mockDuelState, activePlayer: 1 as const };
      mockUseDuelState.mockReturnValue([duelWithPlayer1Active, vi.fn()]);

      render(<AudienceView />);

      // Find Alice's name element and check if it has the active class
      const aliceElement = screen.getByText('Alice');
      expect(aliceElement).toBeInTheDocument();
      expect(aliceElement.className).toContain('active');

      // Bob should not have active class
      const bobElement = screen.getByText('Bob');
      expect(bobElement.className).not.toContain('active');
    });

    it('should highlight active player 2', () => {
      const duelWithPlayer2Active = { ...mockDuelState, activePlayer: 2 as const };
      mockUseDuelState.mockReturnValue([duelWithPlayer2Active, vi.fn()]);

      render(<AudienceView />);

      // Bob should have active class
      const bobElement = screen.getByText('Bob');
      expect(bobElement.className).toContain('active');

      // Alice should not have active class
      const aliceElement = screen.getByText('Alice');
      expect(aliceElement.className).not.toContain('active');
    });
  });

  describe('Slide Display', () => {
    it('should render SlideViewer with current slide', () => {
      const mockDuelState: DuelState = {
        contestant1: {
          id: 'alice-1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
        },
        contestant2: {
          id: 'bob-2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 0,
          eliminated: false,
        },
        activePlayer: 1,
        timeRemaining1: 30,
        timeRemaining2: 30,
        currentSlideIndex: 0,
        selectedCategory: {
          name: 'Math',
          slides: [
            {
              imageUrl: '/slide1.png',
              answer: 'Answer 1',
              censorBoxes: [],
            },
          ],
        },
        isSkipAnimationActive: false,
      };

      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('slide-url')).toHaveTextContent('/slide1.png');
      expect(screen.getByTestId('fullscreen')).toHaveTextContent('true');
    });

    it('should pass showAnswer prop based on isSkipAnimationActive', () => {
      const mockDuelState: DuelState = {
        contestant1: {
          id: 'alice-1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
        },
        contestant2: {
          id: 'bob-2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 0,
          eliminated: false,
        },
        activePlayer: 1,
        timeRemaining1: 30,
        timeRemaining2: 30,
        currentSlideIndex: 0,
        selectedCategory: {
          name: 'Math',
          slides: [
            {
              imageUrl: '/slide1.png',
              answer: 'Answer 1',
              censorBoxes: [],
            },
          ],
        },
        isSkipAnimationActive: true,
      };

      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      expect(screen.getByTestId('show-answer')).toHaveTextContent('true');
    });

    it('should handle no current slide gracefully', () => {
      const mockDuelState: DuelState = {
        contestant1: {
          id: 'alice-1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
        },
        contestant2: {
          id: 'bob-2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 0,
          eliminated: false,
        },
        activePlayer: 1,
        timeRemaining1: 30,
        timeRemaining2: 30,
        currentSlideIndex: 5, // Out of bounds
        selectedCategory: {
          name: 'Math',
          slides: [], // Empty slides array
        },
        isSkipAnimationActive: false,
      };

      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      expect(screen.getByText('No slide available')).toBeInTheDocument();
      expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
    });
  });

  describe('Polling for Updates', () => {
    it('should poll localStorage every 200ms', () => {
      const mockSetState = vi.fn();
      mockUseDuelState.mockReturnValue([null, mockSetState]);

      render(<AudienceView />);

      // Initially no polling calls
      expect(mockUseDuelState).toHaveBeenCalledTimes(1);

      // Advance timer by 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should trigger re-render
      expect(mockUseDuelState).toHaveBeenCalledTimes(2);

      // Advance by another 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockUseDuelState).toHaveBeenCalledTimes(3);
    });

    it('should clean up polling interval on unmount', () => {
      mockUseDuelState.mockReturnValue([null, vi.fn()]);

      const { unmount } = render(<AudienceView />);

      const initialCallCount = mockUseDuelState.mock.calls.length;

      unmount();

      // Advance timers after unmount
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should not call useDuelState after unmount
      expect(mockUseDuelState).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('Image Preloading', () => {
    it('should preload next slide image when current slide is displayed', () => {
      const mockDuelState: DuelState = {
        contestant1: {
          id: 'alice-1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
        },
        contestant2: {
          id: 'bob-2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 0,
          eliminated: false,
        },
        activePlayer: 1,
        timeRemaining1: 30,
        timeRemaining2: 30,
        currentSlideIndex: 0,
        selectedCategory: {
          name: 'Math',
          slides: [
            {
              imageUrl: 'data:image/png;base64,slide1data',
              answer: 'Answer 1',
              censorBoxes: [],
            },
            {
              imageUrl: 'data:image/png;base64,slide2data',
              answer: 'Answer 2',
              censorBoxes: [],
            },
          ],
        },
        isSkipAnimationActive: false,
      };

      // Spy on Image constructor
      const imageSrcSpy = vi.fn();
      const OriginalImage = window.Image;
      window.Image = class extends OriginalImage {
        constructor() {
          super();
          Object.defineProperty(this, 'src', {
            set: imageSrcSpy,
          });
        }
      } as typeof Image;

      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      // Should preload slide 2 (next after slide 1)
      expect(imageSrcSpy).toHaveBeenCalledWith('data:image/png;base64,slide2data');

      // Restore original Image
      window.Image = OriginalImage;
    });

    it('should not preload when there is no next slide', () => {
      const mockDuelState: DuelState = {
        contestant1: {
          id: 'alice-1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
        },
        contestant2: {
          id: 'bob-2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 0,
          eliminated: false,
        },
        activePlayer: 1,
        timeRemaining1: 30,
        timeRemaining2: 30,
        currentSlideIndex: 0,
        selectedCategory: {
          name: 'Math',
          slides: [
            {
              imageUrl: 'data:image/png;base64,slide1data',
              answer: 'Answer 1',
              censorBoxes: [],
            },
          ],
        },
        isSkipAnimationActive: false,
      };

      // Spy on Image constructor
      const imageSrcSpy = vi.fn();
      const OriginalImage = window.Image;
      window.Image = class extends OriginalImage {
        constructor() {
          super();
          Object.defineProperty(this, 'src', {
            set: imageSrcSpy,
          });
        }
      } as typeof Image;

      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      // Should not preload anything - we're on the last slide
      expect(imageSrcSpy).not.toHaveBeenCalled();

      // Restore original Image
      window.Image = OriginalImage;
    });

    it('should preload new next slide when current slide changes', () => {
      const mockDuelStateSlide0: DuelState = {
        contestant1: {
          id: 'alice-1',
          name: 'Alice',
          category: { name: 'Math', slides: [] },
          wins: 0,
          eliminated: false,
        },
        contestant2: {
          id: 'bob-2',
          name: 'Bob',
          category: { name: 'Science', slides: [] },
          wins: 0,
          eliminated: false,
        },
        activePlayer: 1,
        timeRemaining1: 30,
        timeRemaining2: 30,
        currentSlideIndex: 0,
        selectedCategory: {
          name: 'Math',
          slides: [
            {
              imageUrl: 'data:image/png;base64,slide1data',
              answer: 'Answer 1',
              censorBoxes: [],
            },
            {
              imageUrl: 'data:image/png;base64,slide2data',
              answer: 'Answer 2',
              censorBoxes: [],
            },
            {
              imageUrl: 'data:image/png;base64,slide3data',
              answer: 'Answer 3',
              censorBoxes: [],
            },
          ],
        },
        isSkipAnimationActive: false,
      };

      // Spy on Image constructor
      const imageSrcSpy = vi.fn();
      const OriginalImage = window.Image;
      window.Image = class extends OriginalImage {
        constructor() {
          super();
          Object.defineProperty(this, 'src', {
            set: imageSrcSpy,
          });
        }
      } as typeof Image;

      mockUseDuelState.mockReturnValue([mockDuelStateSlide0, vi.fn()]);

      const { rerender } = render(<AudienceView />);

      // Should preload slide 2
      expect(imageSrcSpy).toHaveBeenCalledWith('data:image/png;base64,slide2data');

      imageSrcSpy.mockClear();

      // Move to slide 1
      const mockDuelStateSlide1 = {
        ...mockDuelStateSlide0,
        currentSlideIndex: 1,
      };
      mockUseDuelState.mockReturnValue([mockDuelStateSlide1, vi.fn()]);

      rerender(<AudienceView />);

      // Should now preload slide 3
      expect(imageSrcSpy).toHaveBeenCalledWith('data:image/png;base64,slide3data');

      // Restore original Image
      window.Image = OriginalImage;
    });
  });

  describe('Escape Key Handler', () => {
    it('should call exitFullscreen when Escape is pressed in fullscreen mode', () => {
      mockUseDuelState.mockReturnValue([null, vi.fn()]);

      // Set fullscreen element
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.createElement('div'),
      });

      render(<AudienceView />);

      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should not call exitFullscreen when Escape is pressed outside fullscreen', () => {
      mockUseDuelState.mockReturnValue([null, vi.fn()]);

      // Not in fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      });

      render(<AudienceView />);

      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(document.exitFullscreen).not.toHaveBeenCalled();
    });

    it('should not call exitFullscreen for other keys', () => {
      mockUseDuelState.mockReturnValue([null, vi.fn()]);

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.createElement('div'),
      });

      render(<AudienceView />);

      // Simulate other key presses
      const eventSpace = new KeyboardEvent('keydown', { key: ' ' });
      const eventEnter = new KeyboardEvent('keydown', { key: 'Enter' });

      document.dispatchEvent(eventSpace);
      document.dispatchEvent(eventEnter);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(document.exitFullscreen).not.toHaveBeenCalled();
    });

    it('should handle exitFullscreen errors gracefully', async () => {
      // Use real timers for this async test
      vi.useRealTimers();

      mockUseDuelState.mockReturnValue([null, vi.fn()]);

      // Mock exitFullscreen to reject
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty - suppressing console.error during test
      });
      document.exitFullscreen = vi.fn().mockRejectedValue(new Error('Fullscreen error'));

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.createElement('div'),
      });

      render(<AudienceView />);

      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      // Wait for promise rejection handling
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error exiting fullscreen:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();

      // Restore fake timers for other tests
      vi.useFakeTimers();
    });

    it('should clean up event listener on unmount', () => {
      mockUseDuelState.mockReturnValue([null, vi.fn()]);

      const { unmount } = render(<AudienceView />);

      unmount();

      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.createElement('div'),
      });

      // Simulate Escape key press after unmount
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      // Should not call exitFullscreen
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(document.exitFullscreen).not.toHaveBeenCalled();
    });
  });
});
