/**
 * ViewStack Component
 *
 * Generic container for managing a stack of views with modal navigation.
 * Supports pushing new views onto the stack and popping back.
 *
 * Usage:
 * - Wrap your modal content with ViewStack
 * - Use `pushView` from `useViewStack()` to navigate forward
 * - Back button automatically pops the stack
 * - Initial view is always at the bottom of the stack
 */

import {
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { Modal } from './Modal';

export interface View {
  id: string;
  title: string;
  content: ReactNode;
  onEnter?: () => void; // Called when view is pushed (redo)
  onExit?: () => void; // Called when view is popped (undo)
}

interface ViewStackContextValue {
  pushView: (view: View) => void;
  popView: () => void;
  replaceView: (view: View) => void;
  currentViewId: string;
  stackDepth: number;
}

const ViewStackContext = createContext<ViewStackContextValue | null>(null);

export function useViewStack() {
  const context = useContext(ViewStackContext);
  if (!context) {
    throw new Error('useViewStack must be used within a ViewStack');
  }
  return context;
}

interface ViewStackProps {
  isOpen: boolean;
  onClose: () => void;
  initialView: View;
  className?: string;
}

export function ViewStack({ isOpen, onClose, initialView, className }: ViewStackProps) {
  const [viewStack, setViewStack] = useState<View[]>([initialView]);

  // Reset stack when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setViewStack([initialView]);
    }
  }, [isOpen, initialView]);

  const currentView = viewStack[viewStack.length - 1];
  const showBackButton = viewStack.length > 1;

  const pushView = useCallback((view: View) => {
    // Call onEnter lifecycle hook (redo action)
    view.onEnter?.();
    setViewStack((prev) => [...prev, view]);
  }, []);

  const popView = useCallback(() => {
    setViewStack((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      // Call onExit lifecycle hook on the view being popped (undo action)
      const poppingView = prev[prev.length - 1];
      poppingView?.onExit?.();

      return prev.slice(0, -1);
    });
  }, []);

  const replaceView = useCallback((view: View) => {
    setViewStack((prev) => {
      if (prev.length === 0) {
        return [view];
      }
      return [...prev.slice(0, -1), view];
    });
  }, []);

  const handleBack = useCallback(() => {
    popView();
  }, [popView]);

  const contextValue: ViewStackContextValue = useMemo(
    () => ({
      pushView,
      popView,
      replaceView,
      currentViewId: currentView?.id ?? '',
      stackDepth: viewStack.length,
    }),
    [pushView, popView, replaceView, currentView?.id, viewStack.length]
  );

  return (
    <ViewStackContext.Provider value={contextValue}>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={currentView?.title ?? ''}
        {...(showBackButton ? { onBack: handleBack } : {})}
        {...(className ? { className } : {})}
      >
        {currentView?.content}
      </Modal>
    </ViewStackContext.Provider>
  );
}
