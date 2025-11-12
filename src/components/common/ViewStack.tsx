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

export interface View<TState = void, TResult = void> {
  id: string;
  title: string;
  content: ReactNode;
  state?: TState; // View-specific state passed from parent
  onEnter?: (state?: TState) => void; // Called when view is pushed (redo)
  onExit?: (result?: TResult) => void; // Called when view is popped (undo)
  onResult?: (result: TResult) => void; // Called when child view returns data
}

interface ViewStackContextValue {
  pushView: <TState = void, TResult = void>(view: View<TState, TResult>) => void;
  popView: <TResult = void>(result?: TResult) => void;
  replaceView: <TState = void, TResult = void>(view: View<TState, TResult>) => void;
  currentViewId: string;
  stackDepth: number;
  getCurrentView: () => View | undefined;
  updateCurrentView: (updater: (view: View) => View) => void;
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
  onComplete?: (result?: unknown) => void; // Called when root view completes
}

export function ViewStack({ isOpen, onClose, initialView, className, onComplete }: ViewStackProps) {
  const [viewStack, setViewStack] = useState<View[]>([initialView]);

  // Reset stack when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setViewStack([initialView]);
      initialView.onEnter?.(initialView.state); // Call onEnter for initial view
    } else {
      // When closing, call onExit for all views in stack (cleanup)
      viewStack.forEach((view) => view.onExit?.());
    }
    // Note: viewStack deliberately omitted to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialView]);

  const currentView = viewStack[viewStack.length - 1];
  const showBackButton = viewStack.length > 1;

  const pushView = useCallback(<TState = void, TResult = void>(view: View<TState, TResult>) => {
    // Call onEnter with state (redo action)
    view.onEnter?.(view.state);
    // Type erasure: store as View (runtime types are preserved)
    setViewStack((prev) => [...prev, view as unknown as View]);
  }, []);

  const popView = useCallback(<TResult = void>(result?: TResult) => {
    setViewStack((prev) => {
      if (prev.length <= 1) {
        // Popping root view - call onComplete and don't pop
        if (result !== undefined) {
          onComplete?.(result);
        }
        return prev;
      }

      // Call onExit on the view being popped (undo action)
      const poppingView = prev[prev.length - 1];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (poppingView?.onExit as any)?.(result);

      // Call onResult on the parent view (pass data up)
      const parentView = prev[prev.length - 2];
      if (result !== undefined && parentView?.onResult) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parentView.onResult as any)(result);
      }

      return prev.slice(0, -1);
    });
  }, [onComplete]);

  const getCurrentView = useCallback(() => {
    return viewStack[viewStack.length - 1];
  }, [viewStack]);

  const updateCurrentView = useCallback((updater: (view: View) => View) => {
    setViewStack((prev) => {
      if (prev.length === 0) return prev;
      const currentView = prev[prev.length - 1];
      if (!currentView) return prev;
      const updated = updater(currentView);
      return [...prev.slice(0, -1), updated];
    });
  }, []);

  const replaceView = useCallback(<TState = void, TResult = void>(view: View<TState, TResult>) => {
    setViewStack((prev) => {
      if (prev.length === 0) {
        return [view as unknown as View];
      }
      return [...prev.slice(0, -1), view as unknown as View];
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
      getCurrentView,
      updateCurrentView,
    }),
    [pushView, popView, replaceView, currentView?.id, viewStack.length, getCurrentView, updateCurrentView]
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
