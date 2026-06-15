/**
 * Tests for useImageBounds — the shared rendered-image bounds measurement used
 * by SlideViewer and CensorBoxEditor. jsdom returns zeros from
 * getBoundingClientRect and lacks ResizeObserver, so both are stubbed (mirroring
 * the component tests). An 800×600 image inside an 800×600 container at the
 * origin yields bounds { width: 800, height: 600, left: 0, top: 0 }.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import { useImageBounds } from './useImageBounds';

/** Build an <img> ref whose rect, complete, and naturalHeight are controllable. */
function makeImageRef(opts: {
  rect: Partial<DOMRect>;
  complete?: boolean;
  naturalHeight?: number;
}): RefObject<HTMLImageElement | null> {
  const img = document.createElement('img');
  img.getBoundingClientRect = vi.fn(
    () =>
      ({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        ...opts.rect,
      }) as DOMRect
  );
  Object.defineProperty(img, 'complete', { get: () => opts.complete ?? false, configurable: true });
  Object.defineProperty(img, 'naturalHeight', {
    get: () => opts.naturalHeight ?? 0,
    configurable: true,
  });
  const ref = createRef<HTMLImageElement>();
  // RefObject.current is readonly in the type; populate it for the test harness.
  (ref as { current: HTMLImageElement | null }).current = img;
  return ref;
}

function makeContainerRef(rect: Partial<DOMRect>): RefObject<HTMLElement | null> {
  const el = document.createElement('div');
  el.getBoundingClientRect = vi.fn(
    () =>
      ({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        ...rect,
      }) as DOMRect
  );
  const ref = createRef<HTMLElement>();
  (ref as { current: HTMLElement | null }).current = el;
  return ref;
}

let observeSpy: ReturnType<typeof vi.fn>;
let disconnectSpy: ReturnType<typeof vi.fn>;
let resizeCallback: ResizeObserverCallback | null;

beforeEach(() => {
  observeSpy = vi.fn();
  disconnectSpy = vi.fn();
  resizeCallback = null;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: ResizeObserverCallback) {
        resizeCallback = cb;
      }
      observe = observeSpy;
      unobserve = vi.fn();
      disconnect = disconnectSpy;
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useImageBounds — cached image path', () => {
  it('measures bounds and marks loaded for an already-complete image', async () => {
    const imageRef = makeImageRef({
      rect: { width: 800, height: 600, left: 0, top: 0 },
      complete: true,
      naturalHeight: 900,
    });
    const containerRef = makeContainerRef({ width: 800, height: 600, left: 0, top: 0 });

    const { result } = renderHook(() =>
      useImageBounds({ imageRef, containerRef, imageUrl: 'cached.png' })
    );

    await waitFor(() => {
      expect(result.current.imageLoaded).toBe(true);
    });
    expect(result.current.imageBounds).toEqual({ width: 800, height: 600, left: 0, top: 0 });
  });

  it('does not mark loaded when a not-complete image is probed', async () => {
    const imageRef = makeImageRef({
      rect: { width: 800, height: 600 },
      complete: false,
      naturalHeight: 0,
    });
    const containerRef = makeContainerRef({ width: 800, height: 600 });

    const { result } = renderHook(() =>
      useImageBounds({ imageRef, containerRef, imageUrl: 'fresh.png' })
    );

    // Give the probe RAF a chance to run; it must not flip loaded.
    await new Promise((r) => {
      requestAnimationFrame(() => {
        r(null);
      });
    });
    expect(result.current.imageLoaded).toBe(false);
    expect(result.current.imageBounds).toBeNull();
  });
});

describe('useImageBounds — load handler (two-RAF)', () => {
  it('measures bounds after a load event', async () => {
    const imageRef = makeImageRef({ rect: { width: 800, height: 600, left: 5, top: 10 } });
    const containerRef = makeContainerRef({ width: 800, height: 600, left: 0, top: 0 });

    const { result } = renderHook(() =>
      useImageBounds({ imageRef, containerRef, imageUrl: 'fresh.png' })
    );

    act(() => {
      result.current.handleImageLoad();
    });

    expect(result.current.imageLoaded).toBe(true);
    await waitFor(() => {
      expect(result.current.imageBounds).toEqual({ width: 800, height: 600, left: 5, top: 10 });
    });
  });

  it('rounds fractional pixel values', async () => {
    const imageRef = makeImageRef({
      rect: { width: 800.7, height: 600.3, left: 5.2, top: 10.9 },
    });
    const containerRef = makeContainerRef({ width: 0, height: 0, left: 0, top: 0 });

    const { result } = renderHook(() =>
      useImageBounds({ imageRef, containerRef, imageUrl: 'fresh.png' })
    );

    act(() => {
      result.current.handleImageLoad();
    });

    await waitFor(() => {
      expect(result.current.imageBounds).toEqual({ width: 801, height: 600, left: 5, top: 11 });
    });
  });
});

describe('useImageBounds — error handler', () => {
  it('sets error and clears loaded', () => {
    const imageRef = makeImageRef({ rect: { width: 800, height: 600 } });
    const containerRef = makeContainerRef({ width: 800, height: 600 });

    const { result } = renderHook(() =>
      useImageBounds({ imageRef, containerRef, imageUrl: 'bad.png' })
    );

    act(() => {
      result.current.handleImageError();
    });

    expect(result.current.imageError).toBe(true);
    expect(result.current.imageLoaded).toBe(false);
  });
});

describe('useImageBounds — enabled gate', () => {
  it('does not probe a cached image when disabled', async () => {
    const imageRef = makeImageRef({
      rect: { width: 800, height: 600 },
      complete: true,
      naturalHeight: 900,
    });
    const containerRef = makeContainerRef({ width: 800, height: 600 });

    const { result } = renderHook(() =>
      useImageBounds({ imageRef, containerRef, imageUrl: '', enabled: false })
    );

    await new Promise((r) => {
      requestAnimationFrame(() => {
        r(null);
      });
    });
    expect(result.current.imageLoaded).toBe(false);
    expect(result.current.imageBounds).toBeNull();
  });
});

describe('useImageBounds — observeResize', () => {
  it('does not attach a ResizeObserver by default', () => {
    const imageRef = makeImageRef({ rect: { width: 800, height: 600 } });
    const containerRef = makeContainerRef({ width: 800, height: 600 });

    const { result } = renderHook(() =>
      useImageBounds({ imageRef, containerRef, imageUrl: 'fresh.png' })
    );
    act(() => {
      result.current.handleImageLoad();
    });

    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('observes image + container and re-measures on resize when enabled', async () => {
    let width = 800;
    const img = document.createElement('img');
    img.getBoundingClientRect = vi.fn(() => ({
      width,
      height: 600,
      top: 0,
      left: 0,
      right: width,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));
    const imageRef = createRef<HTMLImageElement>();
    (imageRef as { current: HTMLImageElement | null }).current = img;
    const containerRef = makeContainerRef({ width: 800, height: 600, left: 0, top: 0 });

    const { result } = renderHook(() =>
      useImageBounds({ imageRef, containerRef, imageUrl: 'fresh.png', observeResize: true })
    );

    act(() => {
      result.current.handleImageLoad();
    });
    await waitFor(() => {
      expect(result.current.imageBounds?.width).toBe(800);
    });

    // Observer attached to both the image and the container.
    expect(observeSpy).toHaveBeenCalledTimes(2);

    // Simulate a layout change → the observer callback re-measures.
    width = 400;
    act(() => {
      resizeCallback?.([], {} as ResizeObserver);
    });
    await waitFor(() => {
      expect(result.current.imageBounds?.width).toBe(400);
    });
  });
});
