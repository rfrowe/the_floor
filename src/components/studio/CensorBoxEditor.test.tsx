/**
 * Tests for CensorBoxEditor — the interactive draw/select/delete surface.
 *
 * jsdom returns zeros from getBoundingClientRect and lacks ResizeObserver and
 * pointer capture, so all three are stubbed here (mirroring the SlideViewer
 * test's rect mocking). With an 800×600 bounds, pointer pixels map cleanly to
 * percentages: e.g. a drag from (80,60) to (240,180) → x:10 y:10 w:20 h:20.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act, waitFor, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { CensorBox, Slide } from '@types';
import { CensorBoxEditor } from './CensorBoxEditor';

const IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function makeSlide(overrides: Partial<Slide> = {}): Slide {
  return { imageUrl: IMAGE, answer: 'Test Answer', censorBoxes: [], ...overrides };
}

// 800×600 bounds at the origin, so client coords == overlay-relative coords.
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

/** Mark the rendered image as loaded so bounds are measured. */
async function loadImage(): Promise<void> {
  const img = screen.getByAltText(/Slide/i);
  Object.defineProperty(img, 'naturalWidth', { get: () => 1600, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { get: () => 900, configurable: true });
  act(() => {
    img.dispatchEvent(new Event('load'));
  });
  // Wait until bounds are measured (the two-RAF path) and the overlay renders.
  await waitFor(() => {
    expect(document.querySelector('[aria-describedby]')).not.toBeNull();
  });
}

/** The drawing overlay element (the only element with aria-describedby). */
function getOverlay(): HTMLElement {
  const overlay = document.querySelector('[aria-describedby]');
  if (!(overlay instanceof HTMLElement)) {
    throw new Error('overlay not found');
  }
  return overlay;
}

function drag(overlay: HTMLElement, from: [number, number], to: [number, number]): void {
  const [sx, sy] = from;
  const [ex, ey] = to;
  fireEvent.pointerDown(overlay, { pointerId: 1, clientX: sx, clientY: sy });
  fireEvent.pointerMove(overlay, { pointerId: 1, clientX: ex, clientY: ey });
  fireEvent.pointerUp(overlay, { pointerId: 1, clientX: ex, clientY: ey });
}

beforeEach(() => {
  HTMLElement.prototype.getBoundingClientRect = mockRect;
  // jsdom lacks ResizeObserver and pointer capture.
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

describe('CensorBoxEditor — no image', () => {
  it('shows an "image pending" placeholder when the slide has no image', () => {
    render(<CensorBoxEditor slide={makeSlide({ imageUrl: '' })} onChange={vi.fn()} />);
    expect(screen.getByText(/image pending/i)).toBeInTheDocument();
    // No drawing overlay is rendered without an image.
    expect(document.querySelector('[aria-describedby]')).toBeNull();
  });
});

describe('CensorBoxEditor — drawing', () => {
  it('emits a percentage box matching the dragged pixels', async () => {
    const onChange = vi.fn<(boxes: CensorBox[]) => void>();
    render(<CensorBoxEditor slide={makeSlide()} onChange={onChange} />);
    await loadImage();

    drag(getOverlay(), [80, 60], [240, 180]);

    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0]?.[0];
    expect(emitted).toHaveLength(1);
    expect(emitted?.[0]).toEqual({ x: 10, y: 10, width: 20, height: 20, color: '#000000' });
  });

  it('normalizes a reversed (bottom-right → top-left) drag', async () => {
    const onChange = vi.fn<(boxes: CensorBox[]) => void>();
    render(<CensorBoxEditor slide={makeSlide()} onChange={onChange} />);
    await loadImage();

    drag(getOverlay(), [240, 180], [80, 60]);

    const emitted = onChange.mock.calls[0]?.[0];
    expect(emitted?.[0]).toEqual({ x: 10, y: 10, width: 20, height: 20, color: '#000000' });
  });

  it('discards a sub-threshold (stray click) draw', async () => {
    const onChange = vi.fn<(boxes: CensorBox[]) => void>();
    render(<CensorBoxEditor slide={makeSlide()} onChange={onChange} />);
    await loadImage();

    // 1px drag → well under the 1% threshold → no box.
    drag(getOverlay(), [100, 100], [101, 101]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('respects a custom defaultColor', async () => {
    const onChange = vi.fn<(boxes: CensorBox[]) => void>();
    render(
      <CensorBoxEditor slide={makeSlide()} defaultColor="rgba(0,0,0,0.6)" onChange={onChange} />
    );
    await loadImage();

    drag(getOverlay(), [80, 60], [240, 180]);
    expect(onChange.mock.calls[0]?.[0]?.[0]?.color).toBe('rgba(0,0,0,0.6)');
  });
});

describe('CensorBoxEditor — select & delete', () => {
  const slideWithBoxes = (): Slide =>
    makeSlide({
      censorBoxes: [
        { x: 10, y: 10, width: 20, height: 20, color: '#000000' },
        { x: 50, y: 50, width: 15, height: 15, color: '#000000' },
      ],
    });

  it('renders one focusable button per committed box', async () => {
    render(<CensorBoxEditor slide={slideWithBoxes()} onChange={vi.fn()} />);
    await loadImage();
    expect(screen.getByRole('button', { name: /Censor box 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Censor box 2/i })).toBeInTheDocument();
  });

  it('disables the Delete box button until a box is selected', async () => {
    const user = userEvent.setup();
    render(<CensorBoxEditor slide={slideWithBoxes()} onChange={vi.fn()} />);
    await loadImage();

    const deleteBtn = screen.getByRole('button', { name: /Delete box/i });
    expect(deleteBtn).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Censor box 1/i }));
    expect(deleteBtn).toBeEnabled();
  });

  it('removes the selected box via the Delete box button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(boxes: CensorBox[]) => void>();
    render(<CensorBoxEditor slide={slideWithBoxes()} onChange={onChange} />);
    await loadImage();

    await user.click(screen.getByRole('button', { name: /Censor box 1/i }));
    await user.click(screen.getByRole('button', { name: /Delete box/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const remaining = onChange.mock.calls[0]?.[0];
    expect(remaining).toHaveLength(1);
    // The second box survives.
    expect(remaining?.[0]).toEqual({ x: 50, y: 50, width: 15, height: 15, color: '#000000' });
  });

  it('removes a selected box when Delete is pressed on it', async () => {
    const onChange = vi.fn<(boxes: CensorBox[]) => void>();
    render(<CensorBoxEditor slide={slideWithBoxes()} onChange={onChange} />);
    await loadImage();

    const box2 = screen.getByRole('button', { name: /Censor box 2/i });
    fireEvent.keyDown(box2, { key: 'Delete' });

    expect(onChange).toHaveBeenCalledTimes(1);
    const remaining = onChange.mock.calls[0]?.[0];
    expect(remaining).toHaveLength(1);
    expect(remaining?.[0]).toEqual({ x: 10, y: 10, width: 20, height: 20, color: '#000000' });
  });

  it('removes a selected box when Backspace is pressed on it', async () => {
    const onChange = vi.fn<(boxes: CensorBox[]) => void>();
    render(<CensorBoxEditor slide={slideWithBoxes()} onChange={onChange} />);
    await loadImage();

    const box1 = screen.getByRole('button', { name: /Censor box 1/i });
    fireEvent.keyDown(box1, { key: 'Backspace' });

    expect(onChange.mock.calls[0]?.[0]).toHaveLength(1);
  });
});

describe('CensorBoxEditor — undo & clear', () => {
  const slideWithBoxes = (): Slide =>
    makeSlide({
      censorBoxes: [
        { x: 10, y: 10, width: 20, height: 20, color: '#000000' },
        { x: 50, y: 50, width: 15, height: 15, color: '#000000' },
      ],
    });

  it('Undo last removes the most recently added box', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(boxes: CensorBox[]) => void>();
    render(<CensorBoxEditor slide={slideWithBoxes()} onChange={onChange} />);
    await loadImage();

    await user.click(screen.getByRole('button', { name: /Undo last/i }));
    const remaining = onChange.mock.calls[0]?.[0];
    expect(remaining).toHaveLength(1);
    expect(remaining?.[0]).toEqual({ x: 10, y: 10, width: 20, height: 20, color: '#000000' });
  });

  it('Clear all empties the box list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(boxes: CensorBox[]) => void>();
    render(<CensorBoxEditor slide={slideWithBoxes()} onChange={onChange} />);
    await loadImage();

    await user.click(screen.getByRole('button', { name: /Clear all/i }));
    expect(onChange.mock.calls[0]?.[0]).toEqual([]);
  });

  it('disables Undo last and Clear all when there are no boxes', async () => {
    render(<CensorBoxEditor slide={makeSlide()} onChange={vi.fn()} />);
    await loadImage();
    expect(screen.getByRole('button', { name: /Undo last/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Clear all/i })).toBeDisabled();
  });
});
