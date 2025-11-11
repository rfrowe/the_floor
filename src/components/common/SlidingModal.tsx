/**
 * SlidingModal Component
 *
 * A modal with sliding panel navigation between views.
 * Supports left/right slide animations and back button navigation.
 */

import { useState, type ReactNode } from 'react';
import { Modal } from '@components/common/Modal';
import styles from './SlidingModal.module.css';

interface SlidingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentView: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children: ReactNode;
  className?: string;
}

export function SlidingModal({
  isOpen,
  onClose,
  title,
  currentView,
  showBackButton = false,
  onBack,
  children,
  className = '',
}: SlidingModalProps) {
  const [slideDirection] = useState<'left' | 'right'>('left');

  const slidingModalClass = styles['sliding-modal'] ?? '';
  const slidingContainerClass = styles['sliding-container'] ?? '';
  const slideWrapperClass = styles['slide-wrapper'] ?? '';
  const slideDirectionClass = styles[`slide-${slideDirection}`] ?? '';
  const showSecondaryClass = currentView !== 'main' ? (styles['show-secondary'] ?? '') : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      {...(showBackButton && onBack ? { onBack } : {})}
      className={`${slidingModalClass} ${className}`.trim()}
    >
      <div className={slidingContainerClass}>
        <div className={`${slideWrapperClass} ${slideDirectionClass} ${showSecondaryClass}`.trim()}>
          {children}
        </div>
      </div>
    </Modal>
  );
}
