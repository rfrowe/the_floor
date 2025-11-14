/**
 * useViewState - Automatic ViewStack State Persistence
 *
 * Manages component state with automatic saving/restoring via ViewStack lifecycle.
 * Provides two modes for maximum flexibility:
 *
 * 1. Single Value Mode: useViewState(initialValue, 'keyName')
 * 2. Object Mode: useViewState({ field1: '', field2: 0 })
 *
 * State is automatically:
 * - Saved when leaving the view (onExit)
 * - Restored when returning to the view (onEnter)
 * - Preserved across navigation without prop drilling
 *
 * @example Single value mode
 * const [name, setName] = useViewState('', 'contestantName');
 * const [count, setCount] = useViewState(0, 'count');
 *
 * @example Object mode (type-safe!)
 * interface FormState {
 *   name: string;
 *   category: string;
 *   expanded: boolean;
 * }
 * const [form, setForm] = useViewState<FormState>({
 *   name: '',
 *   category: '',
 *   expanded: false
 * });
 * // Update: setForm(prev => ({ ...prev, name: 'Alice' }))
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useViewStack } from '@components/common/ViewStack';

// Overload signatures
export function useViewState<T>(initialValue: T, key: string): [T, (value: T) => void];
export function useViewState<T extends Record<string, unknown>>(
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>];

// Implementation
export function useViewState<T>(
  initialValue: T,
  key?: string
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const { updateCurrentView, getCurrentView } = useViewStack();
  const isObjectMode = key === undefined;

  // Check for saved state from previous navigation
  const currentView = getCurrentView();
  const savedState = currentView?.savedState as Record<string, unknown> | undefined;

  const restoredValue = isObjectMode
    ? (savedState as T | undefined)
    : (savedState?.[key] as T | undefined);

  const [value, setValue] = useState<T>(restoredValue ?? initialValue);

  // Use ref to capture latest value without recreating handlers
  const valueRef = useRef(value);
  valueRef.current = value;

  // Set up lifecycle handlers once (handlers use ref for latest value)
  useEffect(() => {
    updateCurrentView((view) => {
      // Get existing handlers to merge with
      const existingOnExit = view.onExit;
      const existingOnEnter = view.onEnter;

      return {
        ...view,
        onExit: () => {
          // Merge with existing state from other useViewState calls
          const existingState = (existingOnExit?.() as Record<string, unknown> | undefined) ?? {};
          const currentValue = valueRef.current;
          const newState = isObjectMode
            ? (currentValue as Record<string, unknown>)
            : { [key]: currentValue };
          return { ...existingState, ...newState };
        },
        onEnter: (state: unknown) => {
          // Call existing onEnter first
          existingOnEnter?.(state);

          // Then restore our value
          if (state) {
            const stateObj = state as Record<string, unknown>;
            const valueToRestore = isObjectMode ? state : stateObj[key];
            if (valueToRestore !== undefined) {
              setValue(valueToRestore as T);
            }
          }
        },
      };
    });
  }, [isObjectMode, key, updateCurrentView]);

  return [value, setValue];
}

/**
 * useViewStateSet - Manages a Set with automatic ViewStack persistence
 *
 * Handles Set serialization/deserialization automatically.
 * Internally stores as Array for JSON compatibility.
 *
 * @example
 * const [selections, setSelections] = useViewStateSet(new Set<string>(), 'selections');
 * setSelections(new Set(['a', 'b', 'c']));
 */
export function useViewStateSet<T>(
  initialValue: Set<T>,
  key: string
): [Set<T>, (value: Set<T>) => void] {
  const { updateCurrentView, getCurrentView } = useViewStack();

  // Get saved state (stored as array)
  const currentView = getCurrentView();
  const savedState = currentView?.savedState as Record<string, unknown> | undefined;
  const restoredArray = savedState?.[key] as T[] | undefined;

  const [arrayValue, setArrayValue] = useState<T[]>(restoredArray ?? Array.from(initialValue));

  // Use ref to capture latest value
  const arrayRef = useRef(arrayValue);
  arrayRef.current = arrayValue;

  // Set up lifecycle handlers once
  useEffect(() => {
    updateCurrentView((view) => ({
      ...view,
      onExit: () => ({
        [key]: arrayRef.current, // Save as array
      }),
      onEnter: (state) => {
        if (state) {
          const restoredArray = (state as Record<string, unknown>)[key] as T[] | undefined;
          if (restoredArray !== undefined) {
            setArrayValue(restoredArray);
          }
        }
      },
    }));
  }, [key, updateCurrentView]);

  const setSet = (newSet: Set<T>) => {
    setArrayValue(Array.from(newSet));
  };

  // Convert array to Set for return value
  const currentSet = useMemo(() => new Set(arrayValue), [arrayValue]);

  return [currentSet, setSet];
}
