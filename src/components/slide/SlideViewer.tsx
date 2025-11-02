import { useState, useRef, useEffect } from 'react';
import type { Slide } from '@types';
import styles from './SlideViewer.module.css';

export interface SlideViewerProps {
  slide: Slide;
  showAnswer?: boolean;
  className?: string;
}

/**
 * SlideViewer component displays slide images with censorship boxes overlaid
 * at precise positions. Handles aspect ratio preservation with letterboxing.
 */
export function SlideViewer({ slide, showAnswer = false, className = '' }: SlideViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when slide changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);

    // Check if image is already loaded (cached)
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalHeight !== 0) {
      setImageLoaded(true);
    }
  }, [slide.imageUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Calculate the actual rendered size and position of the image within the container
  const getImageBounds = () => {
    if (!imageRef.current || !containerRef.current) {
      return null;
    }

    const container = containerRef.current.getBoundingClientRect();
    const img = imageRef.current;

    // Get natural image dimensions
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (naturalWidth === 0 || naturalHeight === 0) {
      return null;
    }

    // Calculate aspect ratios
    const imageAspect = naturalWidth / naturalHeight;
    const containerAspect = container.width / container.height;

    let renderedWidth: number;
    let renderedHeight: number;
    let offsetX: number;
    let offsetY: number;

    // object-fit: contain logic - image fits within container maintaining aspect ratio
    if (imageAspect > containerAspect) {
      // Image is wider - constrained by width
      renderedWidth = container.width;
      renderedHeight = container.width / imageAspect;
      offsetX = 0;
      offsetY = (container.height - renderedHeight) / 2;
    } else {
      // Image is taller - constrained by height
      renderedHeight = container.height;
      renderedWidth = container.height * imageAspect;
      offsetX = (container.width - renderedWidth) / 2;
      offsetY = 0;
    }

    return {
      width: renderedWidth,
      height: renderedHeight,
      left: offsetX,
      top: offsetY,
    };
  };

  const imageBounds = imageLoaded ? getImageBounds() : null;

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
      <div className={imageContainerClass}>
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
              width: `${String(imageBounds.width)}px`,
              height: `${String(imageBounds.height)}px`,
              left: `${String(imageBounds.left)}px`,
              top: `${String(imageBounds.top)}px`,
            }}
          >
            {slide.censorBoxes.map((box, index) => (
              <div
                key={index}
                className={`${censorBoxClass} ${hiddenClass}`.trim()}
                style={{
                  left: `${String(box.x)}%`,
                  top: `${String(box.y)}%`,
                  width: `${String(box.width)}%`,
                  height: `${String(box.height)}%`,
                  backgroundColor: box.color,
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
