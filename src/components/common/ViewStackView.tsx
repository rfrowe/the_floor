/**
 * ViewStackView Component
 *
 * Base component type for views that can be used as children of ViewStack.
 * Components extending this interface can be used directly as TSX elements.
 */

import type { ReactNode } from 'react';

/**
 * Props that every ViewStack view component must implement
 */
export interface ViewStackViewProps<TState = void, TResult = void> {
  // Required view properties
  viewId: string;
  viewTitle: string;

  // Optional lifecycle hooks
  onViewEnter?: (state?: TState) => void;
  onViewLoad?: (state?: TState) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  onViewExit?: (result?: TResult) => TState | void;
  onViewCommit?: () => void | Promise<void>;
  onViewLeave?: () => void | Promise<void>;
  onViewResult?: (result: TResult) => void;

  // Optional initial state
  viewState?: TState;

  // Children content
  children?: ReactNode;
}

/**
 * Internal representation of a view extracted from a ViewStackView component
 */
export interface ExtractedView<TState = void, TResult = void> {
  id: string;
  title: string;
  content: ReactNode;
  state?: TState;
  onEnter?: (state?: TState) => void;
  onLoad?: (state?: TState) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  onExit?: (result?: TResult) => TState | void;
  onCommit?: () => void | Promise<void>;
  onLeave?: () => void | Promise<void>;
  onResult?: (result: TResult) => void;
  savedState?: TState;
  isCommitted?: boolean;
}

/**
 * Helper to create a ViewStack-compatible component
 */
export function createViewStackView<TProps extends ViewStackViewProps>(
  Component: React.FC<TProps>
): React.FC<TProps> & { __viewStackView: true } {
  const wrapped = Component as React.FC<TProps> & { __viewStackView: true };
  wrapped.__viewStackView = true;
  return wrapped;
}

/**
 * Check if a component is a ViewStackView
 */
export function isViewStackView(
  component: unknown
): component is React.FC<ViewStackViewProps> & { __viewStackView: true } {
  return (
    typeof component === 'function' &&
    '__viewStackView' in component &&
    component.__viewStackView === true
  );
}

/**
 * Extract view data from a ViewStackView element
 */
export function extractViewFromElement(
  element: React.ReactElement<ViewStackViewProps>
): ExtractedView {
  const props = element.props;

  return {
    id: props.viewId,
    title: props.viewTitle,
    content: element,
    ...(props.viewState !== undefined && { state: props.viewState }),
    ...(props.onViewEnter !== undefined && { onEnter: props.onViewEnter }),
    ...(props.onViewLoad !== undefined && { onLoad: props.onViewLoad }),
    ...(props.onViewExit !== undefined && { onExit: props.onViewExit }),
    ...(props.onViewCommit !== undefined && { onCommit: props.onViewCommit }),
    ...(props.onViewLeave !== undefined && { onLeave: props.onViewLeave }),
    ...(props.onViewResult !== undefined && { onResult: props.onViewResult }),
  };
}
