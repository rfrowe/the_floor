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

    // Check second box positioning (note: rgba converted to rgb by ensureOpaqueColor)
    expect(secondBox).toHaveStyle({
      left: '50%',
      top: '60%',
      width: '20%',
      height: '15%',
      backgroundColor: 'rgb(0, 0, 255)',
    });
  });

  it('ensures censor boxes are always opaque via CensorBox component', async () => {
    const slideWithTransparentBoxes: Slide = {
      imageUrl: mockSlide.imageUrl,
      answer: 'Test',
      censorBoxes: [
        {
          x: 10,
          y: 10,
          width: 20,
          height: 20,
          color: 'rgba(255, 0, 0, 0.5)',
        },
        {
          x: 40,
          y: 40,
          width: 20,
          height: 20,
          color: 'rgba(0, 255, 0, 0.3)',
        },
        {
          x: 70,
          y: 70,
          width: 20,
          height: 20,
          color: '#0000FF80',
        },
      ],
    };

    const { container } = render(<SlideViewer slide={slideWithTransparentBoxes} />);

    const img = screen.getByAltText('Slide content');

    Object.defineProperty(img, 'naturalWidth', {
      get: () => 800,
      configurable: true,
    });
    Object.defineProperty(img, 'naturalHeight', {
      get: () => 600,
      configurable: true,
    });

    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
      expect(censorBoxes.length).toBe(3);
    });

    const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');

    // Verify CensorBox component strips alpha (delegated to CensorBox tests)
    const box1 = censorBoxes[0] as HTMLElement;
    expect(box1).toHaveStyle({
      backgroundColor: 'rgb(255, 0, 0)',
    });
    expect(box1.style.backgroundColor).not.toContain('rgba');

    const box2 = censorBoxes[1] as HTMLElement;
    expect(box2).toHaveStyle({
      backgroundColor: 'rgb(0, 255, 0)',
    });
    expect(box2.style.backgroundColor).not.toContain('rgba');

    const box3 = censorBoxes[2] as HTMLElement;
    expect(box3).toHaveStyle({
      backgroundColor: '#0000FF',
    });
    expect(box3.style.backgroundColor).not.toContain('80');
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

    // Overlay container should be rendered (wait for double requestAnimationFrame)
    await waitFor(() => {
      const overlayContainer = container.querySelector('[style*="width"]');
      expect(overlayContainer).toBeInTheDocument();
    });
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

    // Overlay container should be rendered (wait for double requestAnimationFrame)
    await waitFor(() => {
      const overlayContainer = container.querySelector('[style*="width"]');
      expect(overlayContainer).toBeInTheDocument();
    });
  });

  it('rounds pixel values to avoid sub-pixel rendering issues', async () => {
    // Mock fractional pixel values
    const mockFractionalRect = vi.fn(() => ({
      width: 800.7,
      height: 600.3,
      top: 10.9,
      left: 5.2,
      bottom: 611.2,
      right: 805.9,
      x: 5.2,
      y: 10.9,
      toJSON: () => {
        // Mock implementation for testing
        return {};
      },
    }));

    HTMLElement.prototype.getBoundingClientRect = mockFractionalRect;

    const { container } = render(<SlideViewer slide={mockSlide} />);
    const img = screen.getByAltText('Slide content');

    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    await waitFor(() => {
      expect(img).toHaveStyle({ display: 'block' });
    });

    // Check that overlay container uses rounded values
    await waitFor(() => {
      const overlayContainer = container.querySelector('[style*="width"]');
      // Assert that overlayContainer exists before checking style
      expect(overlayContainer).not.toBeNull();
      if (overlayContainer !== null) {
        const style = overlayContainer.getAttribute('style');
        // Should have rounded width (801px) and height (600px)
        expect(style).toContain('width: 801px');
        expect(style).toContain('height: 600px');
      }
    });
  });

  it('handles cached images efficiently without delays', async () => {
    const { container, rerender } = render(<SlideViewer slide={mockSlide} />);
    const img = screen.getByAltText('Slide content');

    // Mock image as already complete (cached)
    Object.defineProperty(img, 'complete', {
      get: () => true,
      configurable: true,
    });
    Object.defineProperty(img, 'naturalHeight', {
      get: () => 600,
      configurable: true,
    });

    // Trigger a slide change to simulate cached image scenario
    const newSlide: Slide = {
      ...mockSlide,
      imageUrl: 'data:image/png;base64,different',
    };

    rerender(<SlideViewer slide={newSlide} />);

    // Should quickly render without delay
    await waitFor(
      () => {
        const censorBoxes = container.querySelectorAll('[aria-hidden="true"]');
        expect(censorBoxes.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 100 }
    ); // Should happen very quickly, within 100ms
  });
});
