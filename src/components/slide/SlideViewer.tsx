import { useState, useRef, useEffect } from 'react';
import type { Slide } from '@types';
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
 */
export function SlideViewer({ slide, showAnswer = false, className = '' }: SlideViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageBounds, setImageBounds] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
  } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when slide changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setImageBounds(null);

    // Use requestAnimationFrame to wait for next frame before checking cached images
    const rafId = requestAnimationFrame(() => {
      // Check if image is already loaded (cached)
      if (imageRef.current && imageRef.current.complete && imageRef.current.naturalHeight !== 0) {
        // For cached images, calculate bounds and set imageLoaded together
        if (imageContainerRef.current) {
          const imgRect = imageRef.current.getBoundingClientRect();
          const containerRect = imageContainerRef.current.getBoundingClientRect();

          const bounds = {
            width: Math.round(imgRect.width),
            height: Math.round(imgRect.height),
            left: Math.round(imgRect.left - containerRect.left),
            top: Math.round(imgRect.top - containerRect.top),
          };
          setImageBounds(bounds);
          setImageLoaded(true);
        }
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [slide.imageUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    // Wait TWO frames: first for state update to apply display:block, second for paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
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
      });
    });
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

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
