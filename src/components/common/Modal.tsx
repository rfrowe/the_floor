import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MODAL_DISMISS_DURATION_MS } from '@/constants/animations';
import styles from './Modal.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  showCloseButton?: boolean;
  className?: string;
  onBack?: () => void;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  footer,
  showCloseButton = true,
  className = '',
  onBack,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset closing state when opening
      setIsClosing(false);

      // Store previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore body scroll
        document.body.style.overflow = '';

        // Restore focus to previously focused element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }

    return undefined;
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, MODAL_DISMISS_DURATION_MS);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isClosing, handleClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isClosing) {
      handleClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Trap focus within modal
    if (event.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  const overlayClass =
    `${styles['overlay'] ?? ''} ${isClosing ? (styles['overlay-closing'] ?? '') : ''}`.trim();
  const modalClass =
    `${styles['modal'] ?? ''} ${isClosing ? (styles['modal-closing'] ?? '') : ''}`.trim();

  return createPortal(
    <div
      className={overlayClass}
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        // Only close on space/enter if the overlay itself is focused, not children (like form inputs)
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && !isClosing) {
          e.preventDefault();
          handleClose();
        }
      }}
      role="button"
      tabIndex={-1}
      aria-label="Modal backdrop"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={modalRef}
        className={`${modalClass} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {(title !== undefined || showCloseButton || onBack !== undefined) && (
          <div className={styles['header']}>
            {onBack && (
              <button
                className={styles['backButton']}
                onClick={onBack}
                aria-label="Go back"
                type="button"
              >
                ←
              </button>
            )}
            {title && (
              <h2 id="modal-title" className={styles['title']}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className={styles['closeButton']}
                onClick={handleClose}
                aria-label="Close modal"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className={styles['body']}>{children}</div>
        {footer && <div className={styles['footer']}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
