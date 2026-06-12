/**
 * Tests for CensorStep — filmstrip + prev/next navigation hosting the editor.
 *
 * Focuses on the step's own responsibilities (navigation, image-pending
 * marking, and routing changes to the right slide index); the drawing surface
 * itself is covered by CensorBoxEditor.test.tsx.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act, waitFor, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { Slide } from '@types';
import { CensorStep } from './CensorStep';

const IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const mockRect = vi.fn(() => ({
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  bottom: 600,
  right: 800,
  x: 0,
  y: 0,
  toJSON: () => ({}),
}));

function slides(): Slide[] {
  return [
    { imageUrl: IMAGE, answer: 'First', censorBoxes: [] },
    { imageUrl: '', answer: 'Second', censorBoxes: [] }, // image pending
    { imageUrl: IMAGE, answer: 'Third', censorBoxes: [] },
  ];
}

async function loadActiveImage(): Promise<void> {
  const img = screen.queryByAltText(/^Slide:/i);
  if (img) {
    Object.defineProperty(img, 'naturalWidth', { get: () => 1600, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { get: () => 900, configurable: true });
    act(() => {
      img.dispatchEvent(new Event('load'));
    });
    await waitFor(() => {
      expect(document.querySelector('[aria-describedby]')).not.toBeNull();
    });
  }
}

function getOverlay(): HTMLElement {
  const overlay = document.querySelector('[aria-describedby]');
  if (!(overlay instanceof HTMLElement)) {
    throw new Error('overlay not found');
  }
  return overlay;
}

beforeEach(() => {
  HTMLElement.prototype.getBoundingClientRect = mockRect;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {
        /* no-op */
      }
      unobserve(): void {
        /* no-op */
      }
      disconnect(): void {
        /* no-op */
      }
    }
  );
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CensorStep', () => {
  it('shows an empty state when there are no slides', () => {
    render(<CensorStep slides={[]} onSlideCensorBoxesChange={vi.fn()} />);
    expect(screen.getByText(/No slides to censor yet/i)).toBeInTheDocument();
  });

  it('starts on the first slide and reflects position', () => {
    render(<CensorStep slides={slides()} onSlideCensorBoxesChange={vi.fn()} />);
    expect(screen.getByText(/Slide 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Slide 1 of 3 — First/i)).toBeInTheDocument();
  });

  it('navigates with Next / Prev, disabling at the ends', async () => {
    const user = userEvent.setup();
    render(<CensorStep slides={slides()} onSlideCensorBoxesChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Previous slide/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Next slide/i }));
    expect(screen.getByText(/Slide 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Previous slide/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /Next slide/i }));
    expect(screen.getByText(/Slide 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next slide/i })).toBeDisabled();
  });

  it('marks an image-pending slide in the filmstrip and editor', async () => {
    const user = userEvent.setup();
    render(<CensorStep slides={slides()} onSlideCensorBoxesChange={vi.fn()} />);

    // Filmstrip thumbnail flags the missing image.
    expect(
      screen.getByRole('button', { name: /Slide 2: Second \(image pending\)/i })
    ).toBeInTheDocument();

    // Navigating to it shows the editor's pending placeholder.
    await user.click(screen.getByRole('button', { name: /Slide 2: Second \(image pending\)/i }));
    expect(screen.getByText(/image pending/i)).toBeInTheDocument();
  });

  it('jumps to a slide when its filmstrip thumbnail is clicked', async () => {
    const user = userEvent.setup();
    render(<CensorStep slides={slides()} onSlideCensorBoxesChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Slide 3: Third/i }));
    expect(screen.getByText(/Slide 3 of 3/i)).toBeInTheDocument();
  });

  it('dispatches a drawn box for the active slide index', async () => {
    const onChange = vi.fn<(index: number, boxes: unknown[]) => void>();
    const user = userEvent.setup();
    render(<CensorStep slides={slides()} onSlideCensorBoxesChange={onChange} />);

    // Move to slide index 2 (the third slide, which has an image).
    await user.click(screen.getByRole('button', { name: /Slide 3: Third/i }));
    await loadActiveImage();

    const overlay = getOverlay();
    fireEvent.pointerDown(overlay, { pointerId: 1, clientX: 80, clientY: 60 });
    fireEvent.pointerMove(overlay, { pointerId: 1, clientX: 240, clientY: 180 });
    fireEvent.pointerUp(overlay, { pointerId: 1, clientX: 240, clientY: 180 });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe(2);
    const boxes = onChange.mock.calls[0]?.[1];
    expect(boxes).toHaveLength(1);
  });
});
