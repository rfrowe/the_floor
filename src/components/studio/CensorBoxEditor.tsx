/**
 * CensorBoxEditor — interactive draw/select/delete editor for censor boxes.
 *
 * The user drags a rectangle on the slide image to draw a censor box; a drawn
 * box is committed in the `%`-coordinate model (the same one `SlideViewer`
 * renders), so authored boxes look identical in gameplay. Committed boxes can
 * be selected (click / keyboard focus) and removed (Delete/Backspace, an
 * explicit "Delete box" button), plus "Undo last" and "Clear all".
 *
 * Bounds are measured exactly like `SlideViewer` (cached-image path + the
 * two-RAF measurement after load); a `ResizeObserver` re-measures on layout
 * change because, unlike the read-only viewer, this surface is interactive.
 *
 * Out of scope (Task 59): resizing/moving an existing box via handles, and any
 * automatic/CV censor suggestions.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CensorBox, Slide } from '@types';
import { Button } from '@components/common/Button';
import {
  isBoxLargeEnough,
  normalizeRect,
  pxRectToCensorBox,
  type Point,
} from '@utils/censorGeometry';
import styles from './CensorBoxEditor.module.css';

export interface CensorBoxEditorProps {
  /** The slide whose image is being censored. */
  slide: Slide;
  /** Default fill color for newly drawn boxes. */
  defaultColor?: string;
  /** Called with the full box list whenever it changes (draw/delete/clear/undo). */
  onChange: (boxes: CensorBox[]) => void;
}

/** Default censor fill: opaque black, matching how giveaway text is hidden. */
const DEFAULT_COLOR = '#000000';

interface ImageBounds {
  width: number;
  height: number;
  left: number;
  top: number;
}

/** A drag in progress, in pixels relative to the rendered image's top-left. */
interface DragState {
  start: Point;
  current: Point;
  pointerId: number;
}

export function CensorBoxEditor({
  slide,
  defaultColor = DEFAULT_COLOR,
  onChange,
}: CensorBoxEditorProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const hasImage = slide.imageUrl.trim().length > 0;
  const boxes = slide.censorBoxes;
  const instructionsId = useId();

  // --- bounds measurement (mirrors SlideViewer) -----------------------------

  const measureBounds = useCallback(() => {
    if (imageRef.current && imageContainerRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const containerRect = imageContainerRef.current.getBoundingClientRect();
      setImageBounds({
        width: Math.round(imgRect.width),
        height: Math.round(imgRect.height),
        left: Math.round(imgRect.left - containerRect.left),
        top: Math.round(imgRect.top - containerRect.top),
      });
    }
  }, []);

  // Reset + cached-image path when the slide image changes.
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setImageBounds(null);
    setDrag(null);
    setSelectedIndex(null);

    if (!hasImage) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      if (imageRef.current && imageRef.current.complete && imageRef.current.naturalHeight !== 0) {
        measureBounds();
        setImageLoaded(true);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [slide.imageUrl, hasImage, measureBounds]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    // Two frames: first for display:block to apply, second for paint.
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

  // Re-measure on layout/size changes — the editor is interactive, so the
  // window or surrounding layout can change while the user works.
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) {
      return;
    }
    const observer = new ResizeObserver(() => {
      measureBounds();
    });
    observer.observe(imageRef.current);
    if (imageContainerRef.current) {
      observer.observe(imageContainerRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [imageLoaded, measureBounds]);

  // --- drawing flow ----------------------------------------------------------

  /** Pointer position relative to the overlay's top-left, in pixels. */
  const overlayPoint = useCallback((clientX: number, clientY: number): Point | null => {
    if (!overlayRef.current) {
      return null;
    }
    const rect = overlayRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!imageBounds) {
        return;
      }
      const point = overlayPoint(e.clientX, e.clientY);
      if (!point) {
        return;
      }
      // Starting a fresh draw clears any current selection.
      setSelectedIndex(null);
      overlayRef.current?.setPointerCapture(e.pointerId);
      setDrag({ start: point, current: point, pointerId: e.pointerId });
    },
    [imageBounds, overlayPoint]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setDrag((current) => {
        if (current?.pointerId !== e.pointerId) {
          return current;
        }
        const point = overlayPoint(e.clientX, e.clientY);
        if (!point) {
          return current;
        }
        return { ...current, current: point };
      });
    },
    [overlayPoint]
  );

  const finishDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (overlayRef.current?.hasPointerCapture(e.pointerId)) {
        overlayRef.current.releasePointerCapture(e.pointerId);
      }
      setDrag((current) => {
        if (current?.pointerId !== e.pointerId || !imageBounds) {
          return null;
        }
        const rect = normalizeRect(current.start, current.current);
        const box = pxRectToCensorBox(rect, imageBounds.width, imageBounds.height, defaultColor);
        // Discard sub-threshold draws (stray clicks / tiny accidental drags).
        if (box && isBoxLargeEnough(box)) {
          onChange([...boxes, box]);
        }
        return null;
      });
    },
    [boxes, defaultColor, imageBounds, onChange]
  );

  // --- mutations -------------------------------------------------------------

  const deleteAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= boxes.length) {
        return;
      }
      onChange(boxes.filter((_, i) => i !== index));
      setSelectedIndex(null);
    },
    [boxes, onChange]
  );

  const undoLast = useCallback(() => {
    if (boxes.length === 0) {
      return;
    }
    onChange(boxes.slice(0, -1));
    setSelectedIndex(null);
  }, [boxes, onChange]);

  const clearAll = useCallback(() => {
    if (boxes.length === 0) {
      return;
    }
    onChange([]);
    setSelectedIndex(null);
  }, [boxes, onChange]);

  const handleBoxKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteAt(index);
      }
    },
    [deleteAt]
  );

  // --- derived render values -------------------------------------------------

  const inProgressBox: CensorBox | null =
    drag && imageBounds
      ? pxRectToCensorBox(
          normalizeRect(drag.start, drag.current),
          imageBounds.width,
          imageBounds.height,
          defaultColor
        )
      : null;

  const containerClass = styles['container'] ?? '';
  const imageContainerClass = styles['image-container'] ?? '';
  const imageClass = styles['image'] ?? '';
  const loadedClass = imageLoaded ? (styles['loaded'] ?? '') : '';
  const overlayClass = styles['overlay'] ?? '';
  const boxButtonClass = styles['box-button'] ?? '';
  const selectedClass = styles['selected'] ?? '';
  const inProgressClass = styles['in-progress'] ?? '';
  const placeholderClass = styles['placeholder'] ?? '';
  const errorClass = styles['error'] ?? '';
  const toolbarClass = styles['toolbar'] ?? '';
  const instructionsClass = styles['instructions'] ?? '';

  // Graceful no-image state: the image won't exist until Task 58 generates it.
  if (!hasImage) {
    return (
      <div className={containerClass}>
        <div className={placeholderClass} role="status">
          Image pending — generate this card&apos;s image before censoring.
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <p id={instructionsId} className={instructionsClass}>
        Drag on the image to draw a censor box. Select a box and press Delete to remove it.
      </p>

      <div className={imageContainerClass} ref={imageContainerRef}>
        {!imageLoaded && !imageError && <div className={placeholderClass}>Loading image…</div>}

        {imageError && (
          <div className={errorClass} role="alert">
            Failed to load this slide&apos;s image.
          </div>
        )}

        <img
          ref={imageRef}
          src={slide.imageUrl}
          alt={slide.answer ? `Slide: ${slide.answer}` : 'Slide content'}
          className={`${imageClass} ${loadedClass}`.trim()}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />

        {imageLoaded && imageBounds && (
          <div
            ref={overlayRef}
            className={overlayClass}
            style={{
              width: `${String(imageBounds.width)}px`,
              height: `${String(imageBounds.height)}px`,
              left: `${String(imageBounds.left)}px`,
              top: `${String(imageBounds.top)}px`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            aria-describedby={instructionsId}
          >
            {boxes.map((box, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  type="button"
                  key={index}
                  className={`${boxButtonClass} ${isSelected ? selectedClass : ''}`.trim()}
                  style={{
                    left: `${String(box.x)}%`,
                    top: `${String(box.y)}%`,
                    width: `${String(box.width)}%`,
                    height: `${String(box.height)}%`,
                    backgroundColor: box.color,
                  }}
                  aria-label={`Censor box ${String(index + 1)}${isSelected ? ' (selected)' : ''}`}
                  aria-pressed={isSelected}
                  onPointerDown={(e) => {
                    // Selecting a box must not also start a new draw on the overlay.
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    setSelectedIndex(index);
                  }}
                  onFocus={() => {
                    setSelectedIndex(index);
                  }}
                  onKeyDown={(e) => {
                    handleBoxKeyDown(e, index);
                  }}
                />
              );
            })}

            {inProgressBox && (
              <div
                className={inProgressClass}
                aria-hidden="true"
                style={{
                  left: `${String(inProgressBox.x)}%`,
                  top: `${String(inProgressBox.y)}%`,
                  width: `${String(inProgressBox.width)}%`,
                  height: `${String(inProgressBox.height)}%`,
                }}
              />
            )}
          </div>
        )}
      </div>

      <div className={toolbarClass}>
        <Button
          variant="danger"
          size="small"
          onClick={() => {
            if (selectedIndex !== null) {
              deleteAt(selectedIndex);
            }
          }}
          disabled={selectedIndex === null}
        >
          Delete box
        </Button>
        <Button variant="secondary" size="small" onClick={undoLast} disabled={boxes.length === 0}>
          Undo last
        </Button>
        <Button variant="danger" size="small" onClick={clearAll} disabled={boxes.length === 0}>
          Clear all
        </Button>
        <span aria-live="polite" className={instructionsClass}>
          {boxes.length === 0
            ? 'No censor boxes yet.'
            : `${String(boxes.length)} censor box${boxes.length === 1 ? '' : 'es'}.`}
        </span>
      </div>
    </div>
  );
}
