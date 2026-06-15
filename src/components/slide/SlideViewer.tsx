import { useRef } from 'react';
import type { Slide } from '@types';
import { useImageBounds } from '@hooks/useImageBounds';
import { CensorBox } from './CensorBox';
import styles from './SlideViewer.module.css';

export interface SlideViewerProps {
  slide: Slide;
  showAnswer?: boolean;
  className?: string;
}

/**
 * SlideViewer component displays slide images with censorship boxes overlaid
 * at precise positions. Handles aspect ratio preservation with letterboxing.
 * Censor boxes are always rendered fully opaque (handled by CensorBox component).
 *
 * Rendered-image bounds are measured by the shared {@link useImageBounds} hook
 * (cached-image probe + two-RAF post-load measurement), identical to the
 * CensorBoxEditor so authored boxes line up with gameplay.
 */
export function SlideViewer({ slide, showAnswer = false, className = '' }: SlideViewerProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { imageLoaded, imageError, imageBounds, handleImageLoad, handleImageError } =
    useImageBounds({
      imageRef,
      containerRef: imageContainerRef,
      imageUrl: slide.imageUrl,
    });

  // Build class names
  const containerClass = styles['container'] ?? '';
  const imageContainerClass = styles['image-container'] ?? '';
  const imageClass = styles['image'] ?? '';
  const loadedClass = imageLoaded ? (styles['loaded'] ?? '') : '';
  const placeholderClass = styles['placeholder'] ?? '';
  const errorClass = styles['error'] ?? '';
  const overlayContainerClass = styles['overlay-container'] ?? '';
  const censorBoxClass = styles['censor-box'] ?? '';
  const hiddenClass = showAnswer ? (styles['hidden'] ?? '') : '';

  const combinedContainerClass = `${containerClass} ${className}`.trim();
  const combinedImageClass = `${imageClass} ${loadedClass}`.trim();

  return (
    <div className={combinedContainerClass} ref={containerRef}>
      {/* White background layer */}
      <div className={imageContainerClass} ref={imageContainerRef}>
        {/* Show placeholder while loading */}
        {!imageLoaded && !imageError && <div className={placeholderClass}>Loading slide...</div>}

        {/* Show error state */}
        {imageError && (
          <div className={errorClass}>
            <p>Failed to load slide image</p>
          </div>
        )}

        {/* Slide image */}
        <img
          ref={imageRef}
          src={slide.imageUrl}
          alt="Slide content"
          className={combinedImageClass}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />

        {/* Censorship boxes overlay */}
        {imageLoaded && imageBounds && (
          <div
            className={overlayContainerClass}
            style={{
              width: `${String(Math.round(imageBounds.width))}px`,
              height: `${String(Math.round(imageBounds.height))}px`,
              left: `${String(Math.round(imageBounds.left))}px`,
              top: `${String(Math.round(imageBounds.top))}px`,
            }}
          >
            {slide.censorBoxes.map((box, index) => (
              <CensorBox
                key={index}
                box={box}
                className={`${censorBoxClass} ${hiddenClass}`.trim()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
