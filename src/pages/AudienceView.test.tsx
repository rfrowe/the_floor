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
    showAnswer,
  }: {
    slide: { imageUrl: string; answer: string };
    showAnswer: boolean;
  }) => (
    <div data-testid="slide-viewer">
      <span data-testid="slide-url">{slide.imageUrl}</span>
      <span data-testid="slide-answer">{slide.answer}</span>
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

    it('should render timers with one decimal place', () => {
      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      // ClockBar uses formatTime which shows 1 decimal place
      // useGameTimer starts counting down immediately, so after one 100ms tick:
      // timeRemaining1 = 28.7 - 0.1 = 28.6 -> "28.6s"
      // timeRemaining2 = 30.2 - 0.0 = 30.1 -> "30.1s" (inactive player doesn't count)
      expect(screen.getByText(/28\.\ds/)).toBeInTheDocument();
      expect(screen.getByText(/30\.\ds/)).toBeInTheDocument();
    });

    it('should render category name', () => {
      mockUseDuelState.mockReturnValue([mockDuelState, vi.fn()]);

      render(<AudienceView />);

      expect(screen.getByText('Math')).toBeInTheDocument();
    });

    it('should highlight active player 1', () => {
      const duelWithPlayer1Active = { ...mockDuelState, activePlayer: 1 as const };
      mockUseDuelState.mockReturnValue([duelWithPlayer1Active, vi.fn()]);

      render(<AudienceView />);

      // ClockBar applies active class to the player-section div, not the name element
      // Find Alice's name and check parent section for active class
      const aliceElement = screen.getByText('Alice');
      expect(aliceElement).toBeInTheDocument();
      const aliceSection = aliceElement.parentElement;
      expect(aliceSection?.className).toContain('active');

      // Bob's section should have inactive class
      const bobElement = screen.getByText('Bob');
      const bobSection = bobElement.parentElement;
      expect(bobSection?.className).toContain('inactive');
    });

    it('should highlight active player 2', () => {
      const duelWithPlayer2Active = { ...mockDuelState, activePlayer: 2 as const };
      mockUseDuelState.mockReturnValue([duelWithPlayer2Active, vi.fn()]);

      render(<AudienceView />);

      // Bob's section should have active class
      const bobElement = screen.getByText('Bob');
      expect(bobElement).toBeInTheDocument();
      const bobSection = bobElement.parentElement;
      expect(bobSection?.className).toContain('active');

      // Alice's section should have inactive class
      const aliceElement = screen.getByText('Alice');
      const aliceSection = aliceElement.parentElement;
      expect(aliceSection?.className).toContain('inactive');
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

      // Initial render + useEffect for loadTimerState
      const initialCalls = mockUseDuelState.mock.calls.length;

      // Advance timer by 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should trigger re-render (polling tick + timer state reload)
      expect(mockUseDuelState.mock.calls.length).toBeGreaterThan(initialCalls);
      const afterFirstPoll = mockUseDuelState.mock.calls.length;

      // Advance by another 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should have more calls after second poll
      expect(mockUseDuelState.mock.calls.length).toBeGreaterThan(afterFirstPoll);
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

  describe('Skip Animation', () => {
    const mockDuelStateBase: DuelState = {
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
            imageUrl: '/test-slide.png',
            answer: 'The Eiffel Tower',
            censorBoxes: [],
          },
        ],
      },
      isSkipAnimationActive: false,
    };

    it('should not display skip answer overlay when isSkipAnimationActive is false', () => {
      mockUseDuelState.mockReturnValue([mockDuelStateBase, vi.fn()]);

      const { container } = render(<AudienceView />);

      // Query for the skip answer overlay specifically, not the SlideViewer mock
      const skipOverlay = container.querySelector('[class*="skip-answer-overlay"]');
      expect(skipOverlay).not.toBeInTheDocument();
    });

    it('should display skip answer overlay when isSkipAnimationActive is true', () => {
      const mockDuelStateWithSkip = {
        ...mockDuelStateBase,
        isSkipAnimationActive: true,
      };

      mockUseDuelState.mockReturnValue([mockDuelStateWithSkip, vi.fn()]);

      const { container } = render(<AudienceView />);

      // Query for the skip answer overlay specifically
      const skipOverlay = container.querySelector('[class*="skip-answer-overlay"]');
      expect(skipOverlay).toBeInTheDocument();
      expect(skipOverlay).toHaveTextContent('The Eiffel Tower');
    });

    it('should display "Skipped" when no slide answer is available', () => {
      const mockDuelStateNoSlides = {
        ...mockDuelStateBase,
        currentSlideIndex: 5, // Out of bounds
        selectedCategory: {
          name: 'Math',
          slides: [], // No slides
        },
        isSkipAnimationActive: true,
      };

      mockUseDuelState.mockReturnValue([mockDuelStateNoSlides, vi.fn()]);

      render(<AudienceView />);

      expect(screen.getByText('Skipped')).toBeInTheDocument();
    });

    it('should synchronize with duel state changes', () => {
      mockUseDuelState.mockReturnValue([mockDuelStateBase, vi.fn()]);

      const { rerender, container } = render(<AudienceView />);

      // Initially no overlay
      let skipOverlay = container.querySelector('[class*="skip-answer-overlay"]');
      expect(skipOverlay).not.toBeInTheDocument();

      // Activate skip animation
      const mockDuelStateActive = {
        ...mockDuelStateBase,
        isSkipAnimationActive: true,
      };
      mockUseDuelState.mockReturnValue([mockDuelStateActive, vi.fn()]);

      rerender(<AudienceView />);

      // Overlay should appear
      skipOverlay = container.querySelector('[class*="skip-answer-overlay"]');
      expect(skipOverlay).toBeInTheDocument();
      expect(skipOverlay).toHaveTextContent('The Eiffel Tower');

      // Deactivate skip animation
      mockUseDuelState.mockReturnValue([mockDuelStateBase, vi.fn()]);

      rerender(<AudienceView />);

      // Overlay should disappear
      skipOverlay = container.querySelector('[class*="skip-answer-overlay"]');
      expect(skipOverlay).not.toBeInTheDocument();
    });

    it('should pass showAnswer=true to SlideViewer during skip animation', () => {
      const mockDuelStateWithSkip = {
        ...mockDuelStateBase,
        isSkipAnimationActive: true,
      };

      mockUseDuelState.mockReturnValue([mockDuelStateWithSkip, vi.fn()]);

      render(<AudienceView />);

      // Check that SlideViewer receives showAnswer=true
      expect(screen.getByTestId('show-answer')).toHaveTextContent('true');
    });

    it('should display answer in clock bar overlay element', () => {
      const mockDuelStateWithSkip = {
        ...mockDuelStateBase,
        isSkipAnimationActive: true,
      };

      mockUseDuelState.mockReturnValue([mockDuelStateWithSkip, vi.fn()]);

      const { container } = render(<AudienceView />);

      // Find the overlay element
      const skipOverlay = container.querySelector('[class*="skip-answer-overlay"]');
      expect(skipOverlay).toBeInTheDocument();
      expect(skipOverlay).toHaveTextContent('The Eiffel Tower');

      // Verify it's within the clock bar structure
      const clockBar = container.querySelector('[class*="clock-bar"]');
      expect(clockBar).toContainElement(skipOverlay as HTMLElement);
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
