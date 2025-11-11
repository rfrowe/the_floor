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
import styles from './SlidePreview.module.css';

interface SlidePreviewProps {
  slide: Slide;
  slideNumber: number;
  mode: 'readonly' | 'edit';
  onAnswerChange?: (newAnswer: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SlidePreview({
  slide,
  slideNumber,
  mode,
  onAnswerChange,
  isExpanded = false,
  onToggleExpand,
}: SlidePreviewProps) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Reset answer revealed state when slide collapses
  useEffect(() => {
    if (!isExpanded) {
      setIsAnswerRevealed(false);
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

  const formatCensoredAnswer = (answer: string) => {
    return '█'.repeat(Math.max(8, Math.ceil(answer.length / 2)));
  };

  const containerClass = styles['slide-preview'] ?? '';
  const clickableClass = mode === 'edit' ? (styles['clickable'] ?? '') : '';
  const expandedClass = isExpanded ? (styles['expanded'] ?? '') : '';

  return (
    <div
      className={`${containerClass} ${clickableClass} ${expandedClass}`.trim()}
      onClick={mode === 'edit' && onToggleExpand ? onToggleExpand : undefined}
      onKeyDown={
        mode === 'edit' && onToggleExpand
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleExpand();
              }
            }
          : undefined
      }
      role={mode === 'edit' ? 'button' : undefined}
      tabIndex={mode === 'edit' ? 0 : undefined}
    >
      <div className={styles['slide-header-container'] ?? ''}>
        <h4 className={styles['slide-header'] ?? ''}>Slide {slideNumber}</h4>
        {mode === 'edit' && (
          <span className={styles['expand-indicator'] ?? ''}>{isExpanded ? '▼' : '▶'}</span>
        )}
      </div>

      {isExpanded && (
        <>
          <div className={styles['image-container'] ?? ''}>
            <img
              src={slide.imageUrl}
              alt={`Slide ${String(slideNumber)}`}
              className={styles['slide-image'] ?? ''}
            />
            {slide.censorBoxes.map((box, boxIndex) => (
              <div
                key={boxIndex}
                className={styles['censor-box'] ?? ''}
                style={{
                  position: 'absolute',
                  left: `${String(box.x)}%`,
                  top: `${String(box.y)}%`,
                  width: `${String(box.width)}%`,
                  height: `${String(box.height)}%`,
                  backgroundColor: box.color,
                }}
              />
            ))}
          </div>

          <div className={styles['answer-section'] ?? ''}>
            <strong>Answer:</strong>
            {isAnswerRevealed && mode === 'edit' ? (
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
                {isAnswerRevealed && mode === 'readonly' ? (
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
        </>
      )}
    </div>
  );
}
