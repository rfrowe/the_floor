/**
 * SlidePreview Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlidePreview } from './SlidePreview';
import type { Slide } from '@types';

const mockSlide: Slide = {
  imageUrl: 'data:image/svg+xml,%3Csvg width="800" height="600"%3E%3C/svg%3E',
  answer: 'Test Answer',
  censorBoxes: [
    {
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      color: '#FF0000',
    },
  ],
};

describe('SlidePreview', () => {
  describe('Basic Rendering', () => {
    it('renders slide number in header', () => {
      render(<SlidePreview slide={mockSlide} slideNumber={5} mode="readonly" isExpanded={true} />);

      expect(screen.getByText('Slide 5')).toBeInTheDocument();
    });

    it('renders collapsed by default when isExpanded is false', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="readonly" isExpanded={false} />
      );

      const image = container.querySelector('img');
      expect(image).not.toBeInTheDocument();
    });

    it('shows image when expanded', () => {
      render(<SlidePreview slide={mockSlide} slideNumber={1} mode="readonly" isExpanded={true} />);

      const image = screen.getByAltText('Slide 1');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockSlide.imageUrl);
    });
  });

  describe('Expand/Collapse', () => {
    it('shows expand indicator when onToggleExpand is provided', () => {
      const onToggleExpand = vi.fn();
      render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="readonly"
          isExpanded={false}
          onToggleExpand={onToggleExpand}
        />
      );

      expect(screen.getByText('▶')).toBeInTheDocument();
    });

    it('shows collapse indicator when expanded', () => {
      const onToggleExpand = vi.fn();
      render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="readonly"
          isExpanded={true}
          onToggleExpand={onToggleExpand}
        />
      );

      expect(screen.getByText('▼')).toBeInTheDocument();
    });

    it('calls onToggleExpand when header is clicked', () => {
      const onToggleExpand = vi.fn();
      render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="readonly"
          isExpanded={false}
          onToggleExpand={onToggleExpand}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it('works in both readonly and edit modes', () => {
      const onToggleExpand = vi.fn();
      const { rerender } = render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="readonly"
          isExpanded={false}
          onToggleExpand={onToggleExpand}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onToggleExpand).toHaveBeenCalledTimes(1);

      rerender(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="edit"
          isExpanded={false}
          onToggleExpand={onToggleExpand}
        />
      );

      const button = screen.getAllByRole('button')[0];
      if (!button) throw new Error('Test setup error: button not found');
      fireEvent.click(button);
      expect(onToggleExpand).toHaveBeenCalledTimes(2);
    });
  });

  describe('Censor Boxes', () => {
    it('renders censor boxes when expanded', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="readonly" isExpanded={true} />
      );

      const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(1);
    });

    it('does not render censor boxes when collapsed', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="readonly" isExpanded={false} />
      );

      const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(0);
    });

    it('uses CensorBox component which strips alpha', () => {
      const slideWithAlpha: Slide = {
        ...mockSlide,
        censorBoxes: [
          {
            x: 10,
            y: 10,
            width: 20,
            height: 20,
            color: 'rgba(255, 0, 0, 0.5)',
          },
        ],
      };

      const { container } = render(
        <SlidePreview slide={slideWithAlpha} slideNumber={1} mode="readonly" isExpanded={true} />
      );

      const censorBox = container.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(censorBox).toHaveStyle({
        backgroundColor: 'rgb(255, 0, 0)',
      });
    });
  });

  describe('Click to Reveal Image', () => {
    it('hides censor boxes when image is clicked', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />
      );

      // Initially censor boxes are visible
      let censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(1);

      // Click the image container
      const imageContainer = container.querySelector('[aria-label="Click to reveal slide"]');
      expect(imageContainer).toBeInTheDocument();
      if (!imageContainer) throw new Error('Test setup error: imageContainer not found');
      fireEvent.click(imageContainer);

      // Censor boxes should be hidden
      censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(0);
    });

    it('shows censor boxes again on mouse leave', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />
      );

      const imageContainer = container.querySelector('[aria-label="Click to reveal slide"]');
      if (!imageContainer) throw new Error('Test setup error: imageContainer not found');
      fireEvent.click(imageContainer);

      // Boxes hidden
      let censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(0);

      // Mouse leave
      fireEvent.mouseLeave(imageContainer);

      // Boxes visible again
      censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(1);
    });

    it('works in readonly mode', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="readonly" isExpanded={true} />
      );

      const imageContainer = container.querySelector('[aria-label="Click to reveal slide"]');
      if (!imageContainer) throw new Error('Test setup error: imageContainer not found');
      fireEvent.click(imageContainer);

      const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(0);
    });

    it('supports keyboard interaction', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />
      );

      const imageContainer = container.querySelector('[aria-label="Click to reveal slide"]');
      if (!imageContainer) throw new Error('Test setup error: imageContainer not found');

      fireEvent.keyDown(imageContainer, { key: 'Enter' });
      let censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(0);

      fireEvent.mouseLeave(imageContainer);
      fireEvent.keyDown(imageContainer, { key: ' ' });
      censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(0);
    });
  });

  describe('Answer Display and Editing', () => {
    it('shows censored answer in readonly mode', () => {
      render(<SlidePreview slide={mockSlide} slideNumber={1} mode="readonly" isExpanded={true} />);

      // Answer should be censored (black blocks)
      const censoredAnswer = screen.getByText(/█+/);
      expect(censoredAnswer).toBeInTheDocument();
    });

    it('reveals answer on hover in readonly mode', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="readonly" isExpanded={true} />
      );

      // Get the answer display button (not the image button)
      const answerDisplay = container.querySelector('.answer-display, [class*="answer-display"]');
      expect(answerDisplay).toBeInTheDocument();
      if (!answerDisplay) throw new Error('Test setup error: answerDisplay not found');
      fireEvent.click(answerDisplay);

      expect(screen.getByText('Test Answer')).toBeInTheDocument();
    });

    it('shows answer input in edit mode when clicked', () => {
      const onAnswerChange = vi.fn();
      const { container } = render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="edit"
          isExpanded={true}
          onAnswerChange={onAnswerChange}
        />
      );

      // Get the answer display button specifically (not the image button)
      const answerDisplay = container.querySelector('.answer-display, [class*="answer-display"]');
      if (!answerDisplay) throw new Error('Test setup error: answerDisplay not found');
      fireEvent.click(answerDisplay);

      const input = screen.getByPlaceholderText('Enter answer for this slide');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Test Answer');
    });

    it('calls onAnswerChange when answer is edited', () => {
      const onAnswerChange = vi.fn();
      const { container } = render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="edit"
          isExpanded={true}
          onAnswerChange={onAnswerChange}
        />
      );

      // Get the answer display button specifically (not the image button)
      const answerDisplay = container.querySelector('.answer-display, [class*="answer-display"]');
      if (!answerDisplay) throw new Error('Test setup error: answerDisplay not found');
      fireEvent.click(answerDisplay);

      const input = screen.getByPlaceholderText('Enter answer for this slide');
      fireEvent.change(input, { target: { value: 'New Answer' } });

      expect(onAnswerChange).toHaveBeenCalledWith('New Answer');
    });
  });

  describe('Censor Box Information', () => {
    it('displays censor box details when expanded', () => {
      render(<SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />);

      expect(screen.getByText(/Censor Boxes \(1\):/)).toBeInTheDocument();
      expect(screen.getByText(/Box 1: 10.0%, 20.0%/)).toBeInTheDocument();
    });

    it('shows color swatch for each censor box', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />
      );

      const swatch = container.querySelector('[style*="background-color"]');
      expect(swatch).toBeInTheDocument();
    });
  });

  describe('Mode Differences', () => {
    it('readonly mode shows censored answer by default', () => {
      render(<SlidePreview slide={mockSlide} slideNumber={1} mode="readonly" isExpanded={true} />);

      expect(screen.getByText(/█+/)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter answer for this slide')).not.toBeInTheDocument();
    });

    it('edit mode shows censored answer until clicked', () => {
      render(<SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />);

      expect(screen.getByText(/█+/)).toBeInTheDocument();
    });

    it('edit mode can switch to answer input', () => {
      const { container } = render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="edit"
          isExpanded={true}
          onAnswerChange={vi.fn()}
        />
      );

      // Get the answer display button specifically (not the image button)
      const answerDisplay = container.querySelector('.answer-display, [class*="answer-display"]');
      if (!answerDisplay) throw new Error('Test setup error: answerDisplay not found');
      fireEvent.click(answerDisplay);

      expect(screen.getByPlaceholderText('Enter answer for this slide')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('resets reveal states when collapsed', () => {
      const { rerender, container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />
      );

      // Click image to reveal
      const imageContainer = container.querySelector('[aria-label="Click to reveal slide"]');
      if (!imageContainer) throw new Error('Test setup error: imageContainer not found');
      fireEvent.click(imageContainer);

      let censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(0);

      // Collapse
      rerender(<SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={false} />);

      // Expand again
      rerender(<SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />);

      // Censor boxes should be visible again (state reset)
      censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on image container', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />
      );

      const imageContainer = container.querySelector('[aria-label="Click to reveal answer"]');
      if (!imageContainer) throw new Error('Test setup error: imageContainer not found');
      expect(imageContainer).toHaveAttribute('role', 'button');
      expect(imageContainer).toHaveAttribute('tabIndex', '0');
    });

    it('has clickable header with role when onToggleExpand provided', () => {
      const onToggleExpand = vi.fn();
      render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="readonly"
          isExpanded={false}
          onToggleExpand={onToggleExpand}
        />
      );

      const container = screen.getByRole('button');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('supports keyboard expand/collapse', () => {
      const onToggleExpand = vi.fn();
      render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="edit"
          isExpanded={false}
          onToggleExpand={onToggleExpand}
        />
      );

      const container = screen.getAllByRole('button')[0];
      if (!container) throw new Error('Test setup error: container not found');
      fireEvent.keyDown(container, { key: 'Enter' });
      expect(onToggleExpand).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(container, { key: ' ' });
      expect(onToggleExpand).toHaveBeenCalledTimes(2);
    });
  });

  describe('Interactive Effects', () => {
    it('applies interactive class for hover effects', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />
      );

      // CSS modules transform class names, so check for the pattern
      const imageContainer = container.querySelector('[class*="interactive"]');
      expect(imageContainer).toBeInTheDocument();
    });

    it('has pointer cursor on image container', () => {
      const { container } = render(
        <SlidePreview slide={mockSlide} slideNumber={1} mode="edit" isExpanded={true} />
      );

      const imageContainer = container.querySelector('[aria-label="Click to reveal slide"]');
      if (!imageContainer) throw new Error('Test setup error: imageContainer not found');
      expect((imageContainer as HTMLElement).style.cursor).toBe('pointer');
    });
  });

  describe('External Answer Control (showAnswer prop)', () => {
    it('shows answer when showAnswer prop is true in readonly mode', () => {
      render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="readonly"
          isExpanded={true}
          showAnswer={true}
        />
      );

      expect(screen.getByText('Test Answer')).toBeInTheDocument();
      expect(screen.queryByText(/█+/)).not.toBeInTheDocument();
    });

    it('hides answer when showAnswer prop is false in readonly mode', () => {
      render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="readonly"
          isExpanded={true}
          showAnswer={false}
        />
      );

      expect(screen.queryByText('Test Answer')).not.toBeInTheDocument();
      expect(screen.getByText(/█+/)).toBeInTheDocument();
    });

    it('shows answer input when showAnswer prop is true in edit mode', () => {
      render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="edit"
          isExpanded={true}
          showAnswer={true}
          onAnswerChange={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter answer for this slide');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Test Answer');
    });

    it('works in combination with click reveal (OR logic)', () => {
      const { container } = render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="readonly"
          isExpanded={true}
          showAnswer={false}
        />
      );

      // Initially censored
      expect(screen.getByText(/█+/)).toBeInTheDocument();

      // Click to reveal (internal state)
      const answerDisplay = container.querySelector('.answer-display, [class*="answer-display"]');
      if (!answerDisplay) throw new Error('Test setup error: answerDisplay not found');
      fireEvent.click(answerDisplay);

      // Now revealed via click
      expect(screen.getByText('Test Answer')).toBeInTheDocument();
    });

    it('maintains answer visibility when showAnswer is true even after mouse leave', () => {
      const { container } = render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="readonly"
          isExpanded={true}
          showAnswer={true}
        />
      );

      // Answer shown via prop
      expect(screen.getByText('Test Answer')).toBeInTheDocument();

      // Click and mouse leave (would normally hide internal state)
      const answerDisplay = container.querySelector('.answer-display, [class*="answer-display"]');
      if (!answerDisplay) throw new Error('Test setup error: answerDisplay not found');
      fireEvent.click(answerDisplay);
      fireEvent.mouseLeave(answerDisplay);

      // Answer still shown because showAnswer prop is true
      expect(screen.getByText('Test Answer')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles slides with no censor boxes', () => {
      const slideNoCensors: Slide = {
        imageUrl: mockSlide.imageUrl,
        answer: 'Test',
        censorBoxes: [],
      };

      const { container } = render(
        <SlidePreview slide={slideNoCensors} slideNumber={1} mode="edit" isExpanded={true} />
      );

      const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(0);
    });

    it('handles empty answer gracefully', () => {
      const slideNoAnswer: Slide = {
        imageUrl: mockSlide.imageUrl,
        answer: '',
        censorBoxes: [],
      };

      render(
        <SlidePreview slide={slideNoAnswer} slideNumber={1} mode="readonly" isExpanded={true} />
      );

      // Should show censored blocks even for empty answer
      expect(screen.getByText(/█+/)).toBeInTheDocument();
    });

    it('stops propagation when image is clicked', () => {
      const onToggleExpand = vi.fn();
      const { container } = render(
        <SlidePreview
          slide={mockSlide}
          slideNumber={1}
          mode="edit"
          isExpanded={true}
          onToggleExpand={onToggleExpand}
        />
      );

      const imageContainer = container.querySelector('[aria-label="Click to reveal slide"]');
      if (!imageContainer) throw new Error('Test setup error: imageContainer not found');
      fireEvent.click(imageContainer);

      // onToggleExpand should NOT be called (propagation stopped)
      expect(onToggleExpand).not.toHaveBeenCalled();
    });
  });
});
