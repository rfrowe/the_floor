import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SlideViewer } from './SlideViewer';
import type { Slide } from '@types';

// Mock getBoundingClientRect for layout calculations
const mockGetBoundingClientRect = vi.fn(() => ({
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  bottom: 600,
  right: 800,
  x: 0,
  y: 0,
  toJSON: () => {
    // Required by DOMRect interface
  },
}));

describe('SlideViewer', () => {
  const mockSlide: Slide = {
    imageUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    answer: 'Test Answer',
    censorBoxes: [
      {
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        color: '#FF0000',
      },
      {
        x: 50,
        y: 60,
        width: 20,
        height: 15,
        color: 'rgba(0, 0, 255, 0.8)',
      },
    ],
  };

  beforeEach(() => {
    // Mock getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = mockGetBoundingClientRect;
  });

  it('renders loading state initially', () => {
    render(<SlideViewer slide={mockSlide} />);
    expect(screen.getByText('Loading slide...')).toBeInTheDocument();
  });

  it('renders image after loading', async () => {
    render(<SlideViewer slide={mockSlide} />);

    const img = screen.getByAltText('Slide content');
    expect(img).toBeInTheDocument();

    // Trigger load event
    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    // Wait for image to be displayed
    await waitFor(() => {
      expect(img).toHaveStyle({ display: 'block' });
    });
  });

  it('renders censorship boxes after image loads', async () => {
    const { container } = render(<SlideViewer slide={mockSlide} />);

    const img = screen.getByAltText('Slide content');

    // Mock natural dimensions
    Object.defineProperty(img, 'naturalWidth', {
      get: () => 1600,
      configurable: true,
    });
    Object.defineProperty(img, 'naturalHeight', {
      get: () => 900,
      configurable: true,
    });

    // Trigger load event
    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    // Wait for image to be displayed
    await waitFor(() => {
      expect(img).toHaveStyle({ display: 'block' });
    });

    // Check for censorship boxes
    await waitFor(() => {
      const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('positions censorship boxes with correct percentages', async () => {
    const { container } = render(<SlideViewer slide={mockSlide} />);

    const img = screen.getByAltText('Slide content');

    // Mock natural dimensions
    Object.defineProperty(img, 'naturalWidth', {
      get: () => 1600,
      configurable: true,
    });
    Object.defineProperty(img, 'naturalHeight', {
      get: () => 900,
      configurable: true,
    });

    // Trigger load event
    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(img).toHaveStyle({ display: 'block' });
    });

    // Wait for boxes to render
    await waitFor(() => {
      const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBeGreaterThanOrEqual(2);
    });

    const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
    const firstBox = censorBoxes[0] as HTMLElement;
    const secondBox = censorBoxes[1] as HTMLElement;

    // Check first box positioning
    expect(firstBox).toHaveStyle({
      left: '10%',
      top: '20%',
      width: '30%',
      height: '40%',
      backgroundColor: '#FF0000',
    });

    // Check second box positioning
    expect(secondBox).toHaveStyle({
      left: '50%',
      top: '60%',
      width: '20%',
      height: '15%',
      backgroundColor: 'rgba(0, 0, 255, 0.8)',
    });
  });

  it('handles slide with no censorship boxes', async () => {
    const slideWithoutBoxes: Slide = {
      imageUrl: mockSlide.imageUrl,
      answer: 'Test',
      censorBoxes: [],
    };

    const { container } = render(<SlideViewer slide={slideWithoutBoxes} />);

    const img = screen.getByAltText('Slide content');

    // Trigger load event
    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(img).toHaveStyle({ display: 'block' });
    });

    const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
    expect(censorBoxes).toHaveLength(0);
  });

  it('hides censorship boxes when showAnswer is true', async () => {
    const { container } = render(<SlideViewer slide={mockSlide} showAnswer={true} />);

    const img = screen.getByAltText('Slide content');

    // Trigger load event
    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(img).toHaveStyle({ display: 'block' });
    });

    const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');

    // Boxes should have 'hidden' class
    censorBoxes.forEach((box) => {
      expect(box.className).toContain('hidden');
    });
  });

  it('applies fullscreen class when fullscreen prop is true', () => {
    const { container } = render(<SlideViewer slide={mockSlide} fullscreen={true} />);

    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv.className).toContain('fullscreen');
  });

  it('applies custom className', () => {
    const { container } = render(<SlideViewer slide={mockSlide} className="custom-class" />);

    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv.className).toContain('custom-class');
  });

  it('handles image load error', async () => {
    const slideWithBadImage: Slide = {
      imageUrl: 'invalid-url',
      answer: 'Test',
      censorBoxes: [],
    };

    render(<SlideViewer slide={slideWithBadImage} />);

    const img = screen.getByAltText('Slide content');

    // Trigger error event
    act(() => {
      img.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load slide image')).toBeInTheDocument();
    });
  });

  it('resets state when slide changes', async () => {
    const { rerender } = render(<SlideViewer slide={mockSlide} />);

    const img = screen.getByAltText('Slide content');

    // Trigger load event
    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(img).toHaveStyle({ display: 'block' });
    });

    // Change slide
    const newSlide: Slide = {
      imageUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      answer: 'New Answer',
      censorBoxes: [],
    };

    rerender(<SlideViewer slide={newSlide} />);

    // Should show loading state again
    expect(screen.getByText('Loading slide...')).toBeInTheDocument();
  });

  it('handles missing image ref gracefully', () => {
    const slideWithEmptyUrl: Slide = {
      imageUrl: '',
      answer: 'Test',
      censorBoxes: [],
    };

    const { container } = render(<SlideViewer slide={slideWithEmptyUrl} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('calculates image bounds correctly for wide images', async () => {
    const { container } = render(<SlideViewer slide={mockSlide} />);

    const img = screen.getByAltText('Slide content');

    // Mock natural dimensions for a wide image (16:9)
    Object.defineProperty(img, 'naturalWidth', {
      get: () => 1600,
      configurable: true,
    });
    Object.defineProperty(img, 'naturalHeight', {
      get: () => 900,
      configurable: true,
    });

    // Trigger load event
    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(img).toHaveStyle({ display: 'block' });
    });

    // Overlay container should be rendered
    const overlayContainer = container.querySelector('[style*="width"]');
    expect(overlayContainer).toBeInTheDocument();
  });

  it('calculates image bounds correctly for tall images', async () => {
    const { container } = render(<SlideViewer slide={mockSlide} />);

    const img = screen.getByAltText('Slide content');

    // Mock natural dimensions for a tall image (9:16)
    Object.defineProperty(img, 'naturalWidth', {
      get: () => 900,
      configurable: true,
    });
    Object.defineProperty(img, 'naturalHeight', {
      get: () => 1600,
      configurable: true,
    });

    // Trigger load event
    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(img).toHaveStyle({ display: 'block' });
    });

    // Overlay container should be rendered
    const overlayContainer = container.querySelector('[style*="width"]');
    expect(overlayContainer).toBeInTheDocument();
  });
});
