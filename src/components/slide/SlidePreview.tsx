/**
 * SlidePreview Component
 *
 * Unified component for displaying slides with:
 * - Read-only mode with censored answers
 * - Edit mode for modifying answers
 * - Consistent layout and answer censorship
 * - Hover to reveal answers in read-only mode
 */

import { useState, useEffect } from 'react';
import type { Slide } from '@types';
import { CensorBox } from './CensorBox';
import styles from './SlidePreview.module.css';

interface SlidePreviewProps {
  slide: Slide;
  slideNumber: number;
  mode: 'readonly' | 'edit';
  onAnswerChange?: (newAnswer: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showAnswer?: boolean; // External control for answer visibility
}

export function SlidePreview({
  slide,
  slideNumber,
  mode,
  onAnswerChange,
  isExpanded = false,
  onToggleExpand,
  showAnswer = false,
}: SlidePreviewProps) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isImageRevealed, setIsImageRevealed] = useState(false);

  // Reset revealed states when slide collapses
  useEffect(() => {
    if (!isExpanded) {
      setIsAnswerRevealed(false);
      setIsImageRevealed(false);
    }
  }, [isExpanded]);

  const handleAnswerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnswerRevealed(true);
  };

  const handleAnswerBlur = () => {
    setIsAnswerRevealed(false);
  };

  const handleAnswerMouseLeave = () => {
    if (mode === 'readonly') {
      setIsAnswerRevealed(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsImageRevealed(true);
  };

  const handleImageMouseLeave = () => {
    setIsImageRevealed(false);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Click outside the image but inside expanded area - hide image reveal
    if (e.target === e.currentTarget) {
      setIsImageRevealed(false);
    }
  };

  const formatCensoredAnswer = (answer: string) => {
    return '█'.repeat(Math.max(8, Math.ceil(answer.length / 2)));
  };

  const containerClass = styles['slide-preview'] ?? '';
  const clickableClass = onToggleExpand ? (styles['clickable'] ?? '') : '';
  const expandedClass = isExpanded ? (styles['expanded'] ?? '') : '';

  return (
    <div
      className={`${containerClass} ${clickableClass} ${expandedClass}`.trim()}
      onClick={onToggleExpand}
      onKeyDown={
        onToggleExpand
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleExpand();
              }
            }
          : undefined
      }
      role={onToggleExpand ? 'button' : undefined}
      tabIndex={onToggleExpand ? 0 : undefined}
    >
      <div className={styles['slide-header-container'] ?? ''}>
        <h4 className={styles['slide-header'] ?? ''}>Slide {slideNumber}</h4>
        {onToggleExpand && (
          <span className={styles['expand-indicator'] ?? ''}>{isExpanded ? '▼' : '▶'}</span>
        )}
      </div>

      {isExpanded && (
        <div
          onClick={handleContainerClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleContainerClick(e as unknown as React.MouseEvent);
            }
          }}
          role="button"
          tabIndex={-1}
          aria-label="Slide content container"
        >
          <div
            className={`${styles['image-container'] ?? ''} ${styles['interactive'] ?? ''}`.trim()}
            onClick={handleImageClick}
            onMouseLeave={handleImageMouseLeave}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label="Click to reveal slide"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleImageClick(e as unknown as React.MouseEvent);
              }
            }}
          >
            <img
              src={slide.imageUrl}
              alt={`Slide ${String(slideNumber)}`}
              className={styles['slide-image'] ?? ''}
            />
            {!isImageRevealed &&
              slide.censorBoxes.map((box, boxIndex) => (
                <CensorBox key={boxIndex} box={box} className={styles['censor-box'] ?? ''} />
              ))}
          </div>

          <div className={styles['answer-section'] ?? ''}>
            <strong>Answer:</strong>
            {(showAnswer || isAnswerRevealed) && mode === 'edit' ? (
              <input
                type="text"
                value={slide.answer}
                onChange={(e) => onAnswerChange?.(e.target.value)}
                onBlur={handleAnswerBlur}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                placeholder="Enter answer for this slide"
                className={styles['answer-input'] ?? ''}
              />
            ) : (
              <span
                className={styles['answer-display'] ?? ''}
                onClick={handleAnswerClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAnswerClick(e as unknown as React.MouseEvent);
                  }
                }}
                onMouseLeave={handleAnswerMouseLeave}
                role="button"
                tabIndex={0}
                aria-label="Click to reveal answer"
              >
                {(showAnswer || isAnswerRevealed) && mode === 'readonly' ? (
                  slide.answer || '(no answer)'
                ) : (
                  <span className={styles['censored-answer'] ?? ''}>
                    {formatCensoredAnswer(slide.answer)}
                  </span>
                )}
              </span>
            )}
          </div>

          {slide.censorBoxes.length > 0 && (
            <div className={styles['censor-info'] ?? ''}>
              <strong>Censor Boxes ({slide.censorBoxes.length}):</strong>
              <ul>
                {slide.censorBoxes.map((box, boxIndex) => (
                  <li key={boxIndex}>
                    Box {boxIndex + 1}: {box.x.toFixed(1)}%, {box.y.toFixed(1)}% (
                    {box.width.toFixed(1)}% × {box.height.toFixed(1)}%)
                    <span
                      className={styles['color-swatch'] ?? ''}
                      style={{ backgroundColor: box.color }}
                    />
                    {box.color}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
