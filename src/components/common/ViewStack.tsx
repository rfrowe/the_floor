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
  Children,
  isValidElement,
  type ReactElement,
} from 'react';
import { Modal } from './Modal';
import type { Command } from './Command';
import { BookmarkCommand } from './BookmarkCommand';
import { extractViewFromElement, type ViewStackViewProps } from './ViewStackView';
import { loggers } from '@/utils/logger';

const log = loggers.viewStack;

export type { ViewStackViewProps } from './ViewStackView';

export interface View<TState = void, TResult = void> {
  id: string;
  title: string;
  content: ReactNode;
  state?: TState; // View-specific state passed from parent
  onEnter?: (state?: TState) => void; // Called when view becomes active (redo) - receives saved state
  onLoad?: (state?: TState) => Promise<void>; // Async version of onEnter - called for data loading
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  onExit?: (result?: TResult) => TState | void; // Called when view is left - returns state to save
  onCommit?: () => void | Promise<void>; // Called when view is committed (pushed away from) - for permanent actions that don't undo on back
  onLeave?: () => void | Promise<void>; // Called when view is left (either push or pop) - for cleanup/finalization
  onResult?: (result: TResult) => void; // Called when child view returns data
  savedState?: TState; // Internal: ViewStack stores state captured from onExit
  isCommitted?: boolean; // Internal: ViewStack tracks if view was "left" (committed) or "returned to" (uncommitted)
}

interface ViewStackContextValue {
  viewStack: View[];
  commandStack: Command[][]; // Stack of command arrays
  commitAndPushView: <TState = void, TResult = void>(
    view: View<TState, TResult>,
    options?: {
      commands?: Command[];
    }
  ) => Promise<void>;
  commitAndReturn: (options?: { commands?: Command[] }) => Promise<void>;
  popView: <TResult = void>(result?: TResult) => void;
  replaceView: <TState = void, TResult = void>(view: View<TState, TResult>) => void;
  currentViewId: string;
  stackDepth: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCurrentView: () => View<any, any> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateCurrentView: (updater: (view: View<any, any>) => View<any, any>) => void;
}

const ViewStackContext = createContext<ViewStackContextValue | null>(null);

// Export context for MockViewStackProvider
export { ViewStackContext };
export type { ViewStackContextValue };

// eslint-disable-next-line react-refresh/only-export-components
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
  children: ReactNode;
  className?: string;
  onComplete?: (result?: unknown) => void;
}

export function ViewStack({ isOpen, onClose, children, className, onComplete }: ViewStackProps) {
  const initialViews = useMemo(() => {
    const views: View[] = [];
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        const element = child as ReactElement<ViewStackViewProps>;
        if (element.props.viewId && element.props.viewTitle) {
          views.push(extractViewFromElement(element));
        }
      }
    });
    return views;
  }, [children]);

  if (initialViews.length === 0) {
    throw new Error('ViewStack requires children with viewId and viewTitle props');
  }

  // Internal stack stores views with any type parameters (heterogeneous collection)
  // Type safety is maintained through closures - callbacks already have correct types when created
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewStack, setViewStack] = useState<View<any, any>[]>(initialViews);

  // Command stack - one array of commands for each committed view
  const [commandStack, setCommandStack] = useState<Command[][]>([]);

  // Track if modal has been opened yet
  const hasOpenedRef = useRef(false);

  // Track views that are currently being popped to prevent duplicate onLeave calls
  const poppingViewsRef = useRef<Set<string>>(new Set());

  // Initialize stack when modal first opens
  useEffect(() => {
    if (isOpen && !hasOpenedRef.current) {
      hasOpenedRef.current = true;
      setViewStack(initialViews);
      setCommandStack([]);
      // Call onEnter for the top view (last in array)
      const topView = initialViews[initialViews.length - 1];
      if (topView) {
        topView.onEnter?.(topView.state);
      }
    } else if (!isOpen) {
      hasOpenedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Update views when children change (but don't reset stack if already open)
  useEffect(() => {
    if (isOpen && hasOpenedRef.current && initialViews.length > 0) {
      setViewStack((prev) => {
        // Only update if the root view ID matches
        const rootView = prev[0];
        const newRootView = initialViews[0];
        if (rootView && newRootView && rootView.id === newRootView.id) {
          // Replace matching views from the beginning
          return [...initialViews, ...prev.slice(initialViews.length)];
        }
        return prev;
      });
    }
  }, [initialViews, isOpen]);

  const currentView = viewStack[viewStack.length - 1];
  const showBackButton = viewStack.length > 1;

  const commitAndPushView = useCallback(
    async <TState = void, TResult = void>(
      view: View<TState, TResult>,
      options?: { commands?: Command[] }
    ) => {
      const commands = options?.commands ?? [];

      // Execute commands
      for (const command of commands) {
        try {
          await command.execute();
          log.success(`Executed: ${command.describe?.() ?? 'Command'}`);
        } catch (err) {
          log.error('Command execute failed', err);
        }
      }

      // Get current view to execute its hooks
      const currentViewForHooks = viewStack[viewStack.length - 1];

      // Execute async hooks for current view before pushing
      if (currentViewForHooks) {
        // Await onCommit for permanent actions
        if (currentViewForHooks.onCommit) {
          try {
            await Promise.resolve(currentViewForHooks.onCommit());
          } catch (err) {
            log.error('onCommit failed', err);
          }
        }

        // Await onLeave when leaving view
        if (currentViewForHooks.onLeave) {
          try {
            await Promise.resolve(currentViewForHooks.onLeave());
          } catch (err) {
            log.error('onLeave failed', err);
          }
        }
      }

      // Update stacks
      setViewStack((prev) => {
        const currentView = prev[prev.length - 1];
        if (currentView) {
          // Call onExit to capture current view's state before pushing
          let capturedState: unknown;
          if (currentView.onExit) {
            capturedState = (currentView.onExit as () => unknown)();
          }
          const committedCurrent = {
            ...currentView,
            isCommitted: true,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            savedState: capturedState ?? currentView.savedState,
          };
          const updatedStack = [...prev.slice(0, -1), committedCurrent];
          view.onEnter?.(view.state ?? view.savedState);
          // Call async onLoad after onEnter
          if (view.onLoad) {
            void Promise.resolve(view.onLoad(view.state ?? view.savedState)).catch(
              (err: unknown) => {
                log.error('onLoad failed', err);
              }
            );
          }
          return [...updatedStack, view];
        } else {
          view.onEnter?.(view.state ?? view.savedState);
          // Call async onLoad after onEnter
          if (view.onLoad) {
            void Promise.resolve(view.onLoad(view.state ?? view.savedState)).catch(
              (err: unknown) => {
                log.error('onLoad failed', err);
              }
            );
          }
          return [view];
        }
      });

      // Update command stack - add commands for the view being committed
      setCommandStack((prev) => [...prev, commands]);
    },
    [viewStack]
  );

  const commitAndReturn = useCallback(
    async (options?: { commands?: Command[] }) => {
      const commands = options?.commands ?? [];

      // 1. Execute provided commands
      for (const command of commands) {
        try {
          await command.execute();
          log.success(`Executed: ${command.describe?.() ?? 'Command'}`);
        } catch (err) {
          log.error('commitAndReturn - execute failed', err);
        }
      }

      // 2. Execute lifecycle hooks for current view
      const leavingView = viewStack[viewStack.length - 1];
      if (leavingView?.onLeave) {
        try {
          await Promise.resolve(leavingView.onLeave());
        } catch (err) {
          log.error('commitAndReturn - onLeave failed', err);
        }
      }

      // 3. Pop through commandStack looking for BOOKMARK
      let bookmarkFoundAtIndex = -1;
      for (let i = commandStack.length - 1; i >= 0; i--) {
        const cmds = commandStack[i];
        if (cmds?.some((cmd) => cmd instanceof BookmarkCommand)) {
          bookmarkFoundAtIndex = i;
          break;
        }
      }

      // 4. Handle bookmark found vs not found
      if (bookmarkFoundAtIndex === -1) {
        // No bookmark - exit ViewStack
        log.info('No bookmark found, exiting ViewStack');
        onComplete?.();
        return;
      }

      // 5. Return to bookmarked view (bookmark was placed when leaving this view)
      // If BOOKMARK is at commandStack[i], the bookmarked view is viewStack[i]
      const targetViewIndex = bookmarkFoundAtIndex;
      const targetView = viewStack[targetViewIndex];

      if (!targetView) {
        log.error('Bookmark points to invalid view index');
        onComplete?.();
        return;
      }

      log.info(`Returning to bookmarked view: "${targetView.id}"`);

      // 6. Slice stacks (bookmark is consumed - not included in new commandStack)
      setViewStack((prev) => {
        const sliced = prev.slice(0, targetViewIndex + 1);
        const restored = sliced[sliced.length - 1];

        if (restored) {
          const uncommitted = { ...restored, isCommitted: false };
          const final = [...sliced.slice(0, -1), uncommitted];

          uncommitted.onEnter?.(uncommitted.savedState);
          if (uncommitted.onLoad) {
            void Promise.resolve(uncommitted.onLoad(uncommitted.savedState)).catch(
              (err: unknown) => {
                log.error('onLoad failed', err);
              }
            );
          }

          return final;
        }
        return sliced;
      });

      // Bookmark consumed - slice to BEFORE bookmark index
      setCommandStack((prev) => prev.slice(0, bookmarkFoundAtIndex));
    },
    [viewStack, commandStack, onComplete]
  );

  const popView = useCallback(
    async <TResult = void,>(result?: TResult) => {
      if (viewStack.length <= 1) {
        if (result !== undefined) {
          onComplete?.(result);
        }
        return;
      }

      const poppingView = viewStack[viewStack.length - 1];

      // Check if this view is already being popped
      if (poppingView && poppingViewsRef.current.has(poppingView.id)) {
        return;
      }

      // Mark this view as being popped
      if (poppingView) {
        poppingViewsRef.current.add(poppingView.id);
      }

      // Get commands to undo (for the view we're returning to, not the one we're leaving)
      const commandsToUndo = commandStack.length > 0 ? commandStack[commandStack.length - 1] : [];

      // Undo commands in reverse order (LIFO)
      if (commandsToUndo && commandsToUndo.length > 0) {
        for (let i = commandsToUndo.length - 1; i >= 0; i--) {
          const cmd = commandsToUndo[i];
          if (cmd) {
            try {
              await cmd.undo();
              log.warn(`Undone: ${cmd.describe?.() ?? 'Command'}`);
            } catch (err) {
              log.error('Command undo failed', err);
            }
          }
        }
      }

      // Execute onLeave for the view being popped
      if (poppingView?.onLeave) {
        try {
          await Promise.resolve(poppingView.onLeave());
        } catch (err) {
          log.error('onLeave failed', err);
        }
      }

      // Pop the command array
      setCommandStack((prev) => prev.slice(0, -1));

      // Update view stack
      setViewStack((prev) => {
        const poppingView = prev[prev.length - 1];
        const parentView = prev[prev.length - 2];

        if (prev.length <= 1) {
          return prev;
        }

        // Call onExit on the popping view
        if (poppingView?.onExit) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
          (poppingView.onExit as any)?.(result);
        }

        // Call onResult on the parent view (pass data up)
        if (result !== undefined && parentView?.onResult) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
          (parentView.onResult as any)(result);
        }

        // Restore parent with its previously saved state
        if (parentView) {
          const uncommittedParent = {
            ...parentView,
            isCommitted: false,
          };
          const newStack = [...prev.slice(0, -2), uncommittedParent];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
          (uncommittedParent.onEnter as any)?.(uncommittedParent.savedState);
          // Call async onLoad after onEnter
          if (uncommittedParent.onLoad) {
            void Promise.resolve(uncommittedParent.onLoad(uncommittedParent.savedState)).catch(
              (err: unknown) => {
                log.error('onLoad failed', err);
              }
            );
          }
          return newStack;
        }

        return prev.slice(0, -1);
      });

      // Clear from pending pops
      if (poppingView) {
        poppingViewsRef.current.delete(poppingView.id);
      }
    },
    [viewStack, commandStack, onComplete]
  );

  const getCurrentView = useCallback(() => {
    return viewStack[viewStack.length - 1];
  }, [viewStack]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    void popView();
  }, [popView]);

  const contextValue: ViewStackContextValue = useMemo(
    () => ({
      viewStack,
      commandStack,
      commitAndPushView,
      commitAndReturn,
      popView,
      replaceView,
      currentViewId: currentView?.id ?? '',
      stackDepth: viewStack.length,
      getCurrentView,
      updateCurrentView,
    }),
    [
      viewStack,
      commandStack,
      commitAndPushView,
      commitAndReturn,
      popView,
      replaceView,
      currentView?.id,
      viewStack.length,
      getCurrentView,
      updateCurrentView,
    ]
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
