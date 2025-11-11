/**
 * ViewStack Component
 *
 * Generic sliding view stack that manages transitions between views.
 * Uses react-animate-height for smooth height animations.
 */

import { useState, useEffect, type ReactNode } from 'react';
import AnimateHeight from 'react-animate-height';
import { VIEW_TRANSITION_DURATION_MS } from '@/constants/animations';
import styles from './ViewStack.module.css';

export interface ViewStackProps {
  currentView: string;
  views: Record<string, ReactNode>;
  direction?: 'forward' | 'backward';
  fixedHeight?: boolean;
}

export function ViewStack({
  currentView,
  views,
  direction = 'forward',
  fixedHeight = false,
}: ViewStackProps) {
  const [activeView, setActiveView] = useState(currentView);
  const [transitioningFrom, setTransitioningFrom] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  useEffect(() => {
    if (currentView !== activeView) {
      // Start transition
      setTransitioningFrom(activeView);
      setSlideDirection(direction === 'forward' ? 'left' : 'right');

      // Switch to new view on next frame
      requestAnimationFrame(() => {
        setActiveView(currentView);
      });

      // Clean up after animation completes
      const cleanup = setTimeout(() => {
        setTransitioningFrom(null);
      }, VIEW_TRANSITION_DURATION_MS);

      return () => {
        clearTimeout(cleanup);
      };
    }
    return undefined;
  }, [currentView, activeView, direction]);

  const isTransitioning = transitioningFrom !== null;

  // Determine which views to render based on transition direction
  const viewsToRender = isTransitioning
    ? direction === 'forward'
      ? [transitioningFrom, currentView] // Old view on left, new on right
      : [currentView, transitioningFrom] // New view on left, old on right
    : [currentView]; // Just current view

  const viewsContainerClass = styles['views-container'] ?? '';
  const transitioningClass = isTransitioning ? (styles['transitioning'] ?? '') : '';
  const slideDirectionClass = isTransitioning ? (styles[`slide-${slideDirection}`] ?? '') : '';
  const viewPanelClass = styles['view-panel'] ?? '';

  const wrapperContent = (
    <div className={`${viewsContainerClass} ${transitioningClass} ${slideDirectionClass}`.trim()}>
      {viewsToRender.map((viewKey, index) => {
        return (
          <div key={`${viewKey}-${String(index)}`} className={viewPanelClass}>
            {views[viewKey]}
          </div>
        );
      })}
    </div>
  );

  const viewStackClass = styles['view-stack'] ?? '';
  const fixedHeightClass = styles['fixed-height'] ?? '';
  const transitionDuration = String(VIEW_TRANSITION_DURATION_MS);

  // Use AnimateHeight for automatic height animation, unless fixedHeight is true
  if (fixedHeight) {
    return (
      <div
        className={`${viewStackClass} ${fixedHeightClass}`.trim()}
        style={
          {
            '--view-transition-duration': `${transitionDuration}ms`,
          } as React.CSSProperties
        }
      >
        {wrapperContent}
      </div>
    );
  }

  return (
    <AnimateHeight
      duration={VIEW_TRANSITION_DURATION_MS}
      height="auto"
      className={viewStackClass}
      style={
        {
          '--view-transition-duration': `${transitionDuration}ms`,
        } as React.CSSProperties
      }
    >
      {wrapperContent}
    </AnimateHeight>
  );
}
