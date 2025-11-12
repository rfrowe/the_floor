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
  onLoad?: (state?: TState) => Promise<void>; // Async version of onEnter - called for data loading
  onExit?: (result?: TResult) => TState | void; // Called when view is left - returns state to save
  onCommit?: () => void | Promise<void>; // Called when view is committed (pushed away from) - for permanent actions that don't undo on back
  onLeave?: () => void | Promise<void>; // Called when view is left (either push or pop) - for cleanup/finalization
  onResult?: (result: TResult) => void; // Called when child view returns data
  savedState?: TState; // Internal: ViewStack stores state captured from onExit
  isCommitted?: boolean; // Internal: ViewStack tracks if view was "left" (committed) or "returned to" (uncommitted)
  command?: Command; // Optional: Command to execute on commit and undo on return
}

interface ViewStackContextValue {
  pushView: <TState = void, TResult = void>(view: View<TState, TResult>) => void;
  popView: <TResult = void>(result?: TResult) => void;
  popMultiple: (count: number) => Promise<void>; // Pop multiple views sequentially
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

  // Track views that are currently being popped to prevent duplicate onLeave calls
  const poppingViewsRef = useRef<Set<string>>(new Set());

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
    // Capture current view to execute async hooks outside setState
    const getCurrentViewForHooks = () => {
      const current = viewStack[viewStack.length - 1];
      return current;
    };

    const currentView = getCurrentViewForHooks();

    // Execute async hooks BEFORE setState to prevent unmounting during async operations
    const executeAsyncHooks = async () => {
      if (currentView) {
        // Queue command for execution (will happen in useEffect after state settles)
        if (currentView.command) {
          pendingExecutionsRef.current.set(currentView.id, currentView.command);
        }

        // Await onCommit for permanent actions (not undone on return)
        if (currentView.onCommit) {
          try {
            await Promise.resolve(currentView.onCommit());
          } catch (err) {
            console.error('[ViewStack] onCommit failed:', err);
          }
        }

        // Await onLeave when leaving view (by pushing forward)
        if (currentView.onLeave) {
          try {
            await Promise.resolve(currentView.onLeave());
          } catch (err) {
            console.error('[ViewStack] onLeave failed:', err);
          }
        }
      }
    };

    // Execute async hooks then update state
    void executeAsyncHooks().then(() => {
      setViewStack((prev) => {
        const currentView = prev[prev.length - 1];
        if (currentView) {
          const committedCurrent = { ...currentView, isCommitted: true };
          const updatedStack = [...prev.slice(0, -1), committedCurrent];
          view.onEnter?.(view.state ?? view.savedState);
          // Call async onLoad after onEnter
          if (view.onLoad) {
            void Promise.resolve(view.onLoad(view.state ?? view.savedState)).catch(err =>
              console.error('[ViewStack] onLoad failed:', err)
            );
          }
          return [...updatedStack, view];
        } else {
          view.onEnter?.(view.state ?? view.savedState);
          // Call async onLoad after onEnter
          if (view.onLoad) {
            void Promise.resolve(view.onLoad(view.state ?? view.savedState)).catch(err =>
              console.error('[ViewStack] onLoad failed:', err)
            );
          }
          return [view];
        }
      });
    });
  }, [viewStack]);

  const popView = useCallback(<TResult = void>(result?: TResult) => {
    const poppingView = viewStack[viewStack.length - 1];

    if (viewStack.length <= 1) {
      if (result !== undefined) {
        onComplete?.(result);
      }
      return;
    }

    // Check if this view is already being popped
    if (poppingView && poppingViewsRef.current.has(poppingView.id)) {
      return;
    }

    // Mark this view as being popped
    if (poppingView) {
      poppingViewsRef.current.add(poppingView.id);
    }

    // Execute async onLeave BEFORE setState (prevents unmounting during async operations)
    const executeOnLeave = async () => {
      if (poppingView?.onLeave) {
        try {
          await Promise.resolve(poppingView.onLeave());
        } catch (err) {
          console.error('[ViewStack] onLeave failed:', err);
        }
      }
    };

    // Wait for onLeave, then update state
    void executeOnLeave().then(() => {
      // Capture onExit hooks to execute after state update
      let onExitToCall: (() => void) | undefined;

      setViewStack((prev) => {
        const poppingView = prev[prev.length - 1];
        const parentView = prev[prev.length - 2];

        if (prev.length <= 1) {
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
          // Call async onLoad after onEnter
          if (uncommittedParent.onLoad) {
            void Promise.resolve(uncommittedParent.onLoad(uncommittedParent.savedState)).catch(err =>
              console.error('[ViewStack] onLoad failed:', err)
            );
          }
          return newStack;
        }

        return prev.slice(0, -1);
      });

      // Execute async operations AFTER state update
      if (onExitToCall) {
        onExitToCall();
      }

      // Clear from pending pops
      if (poppingView) {
        poppingViewsRef.current.delete(poppingView.id);
      }
    });
  }, [viewStack, onComplete]);

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

  const popMultiple = useCallback(async (count: number) => {
    const popsNeeded = Math.min(count, viewStack.length - 1);

    if (popsNeeded <= 0) {
      return;
    }

    // Collect all onLeave hooks and commands to execute
    const operations: Array<() => Promise<void>> = [];
    for (let i = 0; i < popsNeeded; i++) {
      const viewToPop = viewStack[viewStack.length - 1 - i];

      // Collect onLeave hooks
      if (viewToPop?.onLeave) {
        const hook = viewToPop.onLeave;
        operations.push(async () => {
          await Promise.resolve(hook());
        });
      }

      // Collect command executions (for the last view being popped)
      // Only execute commands that haven't been committed yet
      if (i === 0 && viewToPop?.command && !viewToPop.isCommitted) {
        const cmd = viewToPop.command;
        operations.push(async () => {
          await cmd.execute();
        });
      }
    }

    // Execute all operations sequentially
    for (const operation of operations) {
      await operation();
    }

    // Now update state to pop all views at once
    setViewStack((prev) => {
      const newStack = prev.slice(0, -(popsNeeded));

      // Call onEnter on the revealed view
      const revealedView = newStack[newStack.length - 1];
      if (revealedView) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (revealedView.onEnter as any)?.(revealedView.savedState);
      }

      return newStack;
    });
  }, [viewStack]);

  const handleBack = useCallback(() => {
    popView();
  }, [popView]);

  const contextValue: ViewStackContextValue = useMemo(
    () => ({
      pushView,
      popView,
      popMultiple,
      replaceView,
      currentViewId: currentView?.id ?? '',
      stackDepth: viewStack.length,
      getCurrentView,
      updateCurrentView,
    }),
    [pushView, popView, popMultiple, replaceView, currentView?.id, viewStack.length, getCurrentView, updateCurrentView]
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
