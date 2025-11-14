/**
 * MockViewStackProvider
 *
 * Provides a mock ViewStack context for testing and demo purposes.
 * Components that use useViewStack() will get non-functional but non-crashing methods.
 *
 * Enhanced for testing: accepts optional spy functions to verify component behavior
 * without relying on ViewStack's internal state management.
 */

import { type ReactNode } from 'react';
import { ViewStackContext, type ViewStackContextValue, type View } from './ViewStack';
import type { Command } from './Command';

export interface MockViewStackProviderProps {
  children: ReactNode;
  // Optional spies for testing - if not provided, uses no-op defaults
  commitAndPushView?: <TState = void, TResult = void>(
    view: View<TState, TResult>,
    options?: { commands?: Command[] }
  ) => Promise<void>;
  commitAndReturn?: (options?: { commands?: Command[] }) => Promise<void>;
  popView?: <TResult = void>(result?: TResult) => void;
  replaceView?: <TState = void, TResult = void>(view: View<TState, TResult>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateCurrentView?: (updater: (view: View<any, any>) => View<any, any>) => void;
  // Optional state for tests that need it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewStack?: View<any, any>[];
  commandStack?: Command[][];
  currentViewId?: string;
}

/**
 * Provides a mock ViewStack context that makes useViewStack() work without errors.
 *
 * Usage in demos (no spies):
 * ```tsx
 * <MockViewStackProvider>
 *   <ListContent categoryMetadata={mockData} contestants={[]} />
 * </MockViewStackProvider>
 * ```
 *
 * Usage in tests (with spies):
 * ```tsx
 * const mockCommitAndPushView = vi.fn().mockResolvedValue(undefined);
 *
 * <MockViewStackProvider commitAndPushView={mockCommitAndPushView}>
 *   <IndividualPreview {...props} />
 * </MockViewStackProvider>
 *
 * // Later in test:
 * expect(mockCommitAndPushView).toHaveBeenCalledWith(
 *   expect.objectContaining({ title: 'Expected Title' }),
 *   expect.objectContaining({ commands: expect.any(Array) })
 * );
 * ```
 */
export function MockViewStackProvider({
  children,
  commitAndPushView,
  commitAndReturn,
  popView,
  replaceView,
  updateCurrentView,
  viewStack = [],
  commandStack = [],
  currentViewId = 'mock',
}: MockViewStackProviderProps) {
  // Default implementations (no-ops)
  const defaultCommitAndPushView = <TState = void, TResult = void>(
    _view: View<TState, TResult>,
    _options?: { commands?: Command[] }
  ) => {
    console.log('[Mock] commitAndPushView called');
    return Promise.resolve();
  };

  const defaultCommitAndReturn = (_options?: { commands?: Command[] }) => {
    console.log('[Mock] commitAndReturn called');
    return Promise.resolve();
  };

  const defaultPopView = <TResult = void,>(_result?: TResult) => {
    console.log('[Mock] popView called');
  };

  const defaultReplaceView = <TState = void, TResult = void>(_view: View<TState, TResult>) => {
    console.log('[Mock] replaceView called');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultUpdateCurrentView = (_updater: (view: View<any, any>) => View<any, any>) => {
    console.log('[Mock] updateCurrentView called');
  };

  const mockContextValue: ViewStackContextValue = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    viewStack: viewStack as any,
    commandStack,
    commitAndPushView: commitAndPushView ?? defaultCommitAndPushView,
    commitAndReturn: commitAndReturn ?? defaultCommitAndReturn,
    popView: popView ?? defaultPopView,
    replaceView: replaceView ?? defaultReplaceView,
    currentViewId,
    stackDepth: viewStack.length,
    getCurrentView: () => viewStack[viewStack.length - 1],
    updateCurrentView: updateCurrentView ?? defaultUpdateCurrentView,
  };

  return <ViewStackContext.Provider value={mockContextValue}>{children}</ViewStackContext.Provider>;
}
