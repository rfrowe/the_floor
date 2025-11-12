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
  useRef,
  type ReactNode,
} from 'react';
import { Modal } from './Modal';
import type { Command } from './Command';

export interface View<TState = void, TResult = void> {
  id: string;
  title: string;
  content: ReactNode;
  state?: TState; // View-specific state passed from parent
  onEnter?: (state?: TState) => void; // Called when view becomes active (redo) - receives saved state
  onExit?: (result?: TResult) => TState | void; // Called when view is left - returns state to save
  onResult?: (result: TResult) => void; // Called when child view returns data
  savedState?: TState; // Internal: ViewStack stores state captured from onExit
  isCommitted?: boolean; // Internal: ViewStack tracks if view was "left" (committed) or "returned to" (uncommitted)
  command?: Command; // Optional: Command to execute on commit and undo on return
}

interface ViewStackContextValue {
  pushView: <TState = void, TResult = void>(view: View<TState, TResult>) => void;
  popView: <TResult = void>(result?: TResult) => void;
  replaceView: <TState = void, TResult = void>(view: View<TState, TResult>) => void;
  currentViewId: string;
  stackDepth: number;
  getCurrentView: () => View<any, any> | undefined;
  updateCurrentView: (updater: (view: View<any, any>) => View<any, any>) => void;
}

const ViewStackContext = createContext<ViewStackContextValue | null>(null);

export function useViewStack() {
  const context = useContext(ViewStackContext);
  if (!context) {
    throw new Error('useViewStack must be used within a ViewStack');
  }
  return context;
}

interface ViewStackProps<TState = void, TResult = void> {
  isOpen: boolean;
  onClose: () => void;
  initialView: View<TState, TResult>;
  className?: string;
  onComplete?: (result?: unknown) => void; // Called when root view completes
}

export function ViewStack<TState = void, TResult = void>({ isOpen, onClose, initialView, className, onComplete }: ViewStackProps<TState, TResult>) {
  // Internal stack stores views with any type parameters (heterogeneous collection)
  // Type safety is maintained through closures - callbacks already have correct types when created
  const [viewStack, setViewStack] = useState<View<any, any>[]>([initialView]);

  // Track if modal has been opened yet
  const hasOpenedRef = useRef(false);

  // Queue commands for execution to handle React strict mode and rapid pushes
  const pendingExecutionsRef = useRef<Map<string, Command>>(new Map());
  const pendingUndosRef = useRef<Map<string, Command>>(new Map());

  // Initialize stack when modal first opens
  useEffect(() => {
    if (isOpen && !hasOpenedRef.current) {
      hasOpenedRef.current = true;
      setViewStack([initialView]);
      initialView.onEnter?.(initialView.state);
    } else if (!isOpen) {
      hasOpenedRef.current = false;
      // NOTE: Don't call onExit here - undos happen during popView when returning to committed views
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Update root view when initialView changes (but don't reset stack)
  useEffect(() => {
    if (isOpen && hasOpenedRef.current) {
      setViewStack((prev) => {
        const rootView = prev[0];
        if (rootView && rootView.id === initialView.id) {
          // Replace root view with updated version
          return [initialView, ...prev.slice(1)];
        }
        return prev;
      });
    }
  }, [initialView, isOpen]);

  // Execute queued commands after state settles
  useEffect(() => {
    // Process executions
    const executions = Array.from(pendingExecutionsRef.current.entries());
    if (executions.length > 0) {
      pendingExecutionsRef.current.clear();
      for (const [, command] of executions) {
        void command.execute().catch(err => console.error('[ViewStack] Command execute failed:', err));
      }
    }

    // Process undos
    const undos = Array.from(pendingUndosRef.current.entries());
    if (undos.length > 0) {
      pendingUndosRef.current.clear();
      for (const [, command] of undos) {
        void command.undo().catch(err => console.error('[ViewStack] Command undo failed:', err));
      }
    }
  }, [viewStack]);

  const currentView = viewStack[viewStack.length - 1];
  const showBackButton = viewStack.length > 1;

  const pushView = useCallback(<TState = void, TResult = void>(view: View<TState, TResult>) => {
    setViewStack((prev) => {
      // Before pushing new view, mark current view as "committed"
      const currentView = prev[prev.length - 1];
      if (currentView) {
        // Queue command for execution (will happen in useEffect after state settles)
        if (currentView.command) {
          pendingExecutionsRef.current.set(currentView.id, currentView.command);
        }

        const committedCurrent = { ...currentView, isCommitted: true };
        const updatedStack = [...prev.slice(0, -1), committedCurrent];
        view.onEnter?.(view.state ?? view.savedState);
        return [...updatedStack, view];
      } else {
        view.onEnter?.(view.state ?? view.savedState);
        return [view];
      }
    });
  }, []);

  const popView = useCallback(<TResult = void>(result?: TResult) => {
    // Capture onExit hooks to execute after state update
    let onExitToCall: (() => void) | undefined;

    setViewStack((prev) => {
      const poppingView = prev[prev.length - 1];
      const parentView = prev[prev.length - 2];

      if (prev.length <= 1) {
        if (result !== undefined) {
          onComplete?.(result);
        }
        return prev;
      }

      // Mark onExit for execution (will happen after setState)
      if (poppingView?.onExit) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onExitToCall = () => (poppingView.onExit as any)?.(result);
      }

      // Call onResult on the parent view (pass data up)
      if (result !== undefined && parentView?.onResult) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parentView.onResult as any)(result);
      }

      // If parent was committed, queue command for undo
      if (parentView) {
        if (parentView.isCommitted && parentView.command) {
          pendingUndosRef.current.set(parentView.id, parentView.command);
        }

        const uncommittedParent = { ...parentView, isCommitted: false };
        const newStack = [...prev.slice(0, -2), uncommittedParent];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (uncommittedParent.onEnter as any)?.(uncommittedParent.savedState);
        return newStack;
      }

      return prev.slice(0, -1);
    });

    // Execute async operations after state update
    if (onExitToCall) {
      onExitToCall();
    }
  }, [onComplete]);

  const getCurrentView = useCallback(() => {
    return viewStack[viewStack.length - 1];
  }, [viewStack]);

  const updateCurrentView = useCallback((updater: (view: View<any, any>) => View<any, any>) => {
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
