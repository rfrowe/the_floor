/**
 * useImageBounds — measure the rendered bounds of a letterboxed `<img>`.
 *
 * An image rendered with `object-fit: contain` inside a fixed-aspect container
 * is letterboxed: its painted box is smaller than the container and offset by
 * the letterbox margins. Overlays (censor boxes, the editor's drawing surface)
 * must be positioned against that painted box, not the container — so we measure
 * it from `getBoundingClientRect()` and express it relative to the container's
 * top-left.
 *
 * This logic is shared by the read-only {@link SlideViewer} and the interactive
 * `CensorBoxEditor`; both must measure identically so an authored box renders in
 * exactly the same place during gameplay. The measurement is intentionally
 * fragile-by-design around RAF timing:
 *
 *  - On image change we wait one frame, then check whether the image is already
 *    complete (a cached image fires no `load`), measuring immediately if so.
 *  - On a fresh `load` we wait TWO frames: the first lets the `display: block`
 *    state apply, the second lets that layout paint before we read the rect.
 *
 * The optional {@link UseImageBoundsOptions.observeResize} path adds a
 * `ResizeObserver` so an interactive surface re-measures when the window or
 * surrounding layout changes while the user works; the read-only viewer omits it.
 */

import { useCallback, useEffect, useState, type RefObject } from 'react';

/** Rendered-image bounds, in pixels, relative to the container's top-left. */
export interface ImageBounds {
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface UseImageBoundsOptions {
  /** Ref to the `<img>` whose painted box is measured. */
  imageRef: RefObject<HTMLImageElement | null>;
  /** Ref to the positioning-context container the bounds are relative to. */
  containerRef: RefObject<HTMLElement | null>;
  /**
   * The image source. Used as the reset key: when it changes, load/error/bounds
   * state resets and the cached-image probe re-runs.
   */
  imageUrl: string;
  /**
   * When `false`, state still resets on `imageUrl` change but no measurement is
   * scheduled (used by callers that don't render an `<img>` until an image
   * exists). Defaults to `true`.
   */
  enabled?: boolean;
  /**
   * When `true`, attach a `ResizeObserver` to the image and container so bounds
   * re-measure on layout/size changes. Defaults to `false` — only interactive
   * surfaces need it.
   */
  observeResize?: boolean;
}

export interface UseImageBoundsResult {
  /** Whether the image has loaded (or was found already-cached). */
  imageLoaded: boolean;
  /** Whether the image failed to load. */
  imageError: boolean;
  /** The measured rendered-image bounds, or `null` before measurement. */
  imageBounds: ImageBounds | null;
  /** `onLoad` handler to wire to the `<img>`. */
  handleImageLoad: () => void;
  /** `onError` handler to wire to the `<img>`. */
  handleImageError: () => void;
}

export function useImageBounds({
  imageRef,
  containerRef,
  imageUrl,
  enabled = true,
  observeResize = false,
}: UseImageBoundsOptions): UseImageBoundsResult {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);

  const measureBounds = useCallback(() => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (img && container) {
      const imgRect = img.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setImageBounds({
        width: Math.round(imgRect.width),
        height: Math.round(imgRect.height),
        left: Math.round(imgRect.left - containerRect.left),
        top: Math.round(imgRect.top - containerRect.top),
      });
    }
  }, [imageRef, containerRef]);

  // Reset + cached-image path when the image source changes.
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setImageBounds(null);

    if (!enabled) {
      return;
    }

    // Wait one frame before probing for an already-loaded (cached) image, then
    // measure and mark loaded together so the overlay appears without a flash.
    const rafId = requestAnimationFrame(() => {
      const img = imageRef.current;
      if (img && img.complete && img.naturalHeight !== 0 && containerRef.current) {
        measureBounds();
        setImageLoaded(true);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [imageUrl, enabled, imageRef, containerRef, measureBounds]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    // Two frames: first for the display:block state to apply, second for paint.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        measureBounds();
      });
    });
  }, [measureBounds]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  // Re-measure on layout/size changes for interactive surfaces.
  useEffect(() => {
    if (!observeResize || !imageLoaded || !imageRef.current) {
      return;
    }
    const observer = new ResizeObserver(() => {
      measureBounds();
    });
    observer.observe(imageRef.current);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [observeResize, imageLoaded, imageRef, containerRef, measureBounds]);

  return { imageLoaded, imageError, imageBounds, handleImageLoad, handleImageError };
}
