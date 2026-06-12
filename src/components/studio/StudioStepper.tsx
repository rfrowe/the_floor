/**
 * StudioStepper — the LLM Studio progress indicator.
 *
 * Renders the six wizard steps in order, highlights the current step, marks
 * completed steps, and lets the user jump *back* to an already-visited step.
 * Forward steps are locked: a step is only reachable once its predecessors'
 * guards (via `canAdvance`) have been satisfied, which the parent enforces.
 */

import type { StudioStep } from '@types';
import { STUDIO_STEPS } from '@hooks/useStudioState';
import styles from './StudioStepper.module.css';

/** Human-readable labels for each step, in order. */
const STEP_LABELS: Record<StudioStep, string> = {
  credentials: 'Credentials',
  categoryName: 'Category name',
  cards: 'Cards',
  images: 'Images',
  censor: 'Censor',
  save: 'Save',
};

export interface StudioStepperProps {
  /** The step the wizard is currently on. */
  currentStep: StudioStep;
  /**
   * Whether the wizard can advance past the current step. Forward steps stay
   * locked while this is false.
   */
  canAdvance: boolean;
  /** Navigate to a (previously-visited or current) step. */
  onStepSelect: (step: StudioStep) => void;
}

export function StudioStepper({ currentStep, canAdvance, onStepSelect }: StudioStepperProps) {
  const currentIndex = STUDIO_STEPS.indexOf(currentStep);

  const stepperClass = styles['stepper'] ?? '';
  const stepClass = styles['step'] ?? '';
  const currentClass = styles['current'] ?? '';
  const completedClass = styles['completed'] ?? '';
  const lockedClass = styles['locked'] ?? '';
  const indexClass = styles['index'] ?? '';
  const labelClass = styles['label'] ?? '';

  return (
    <nav className={stepperClass} aria-label="Studio progress">
      <ol className={styles['list'] ?? ''}>
        {STUDIO_STEPS.map((step, i) => {
          const isCurrent = i === currentIndex;
          const isCompleted = i < currentIndex;
          // A step is reachable if it's already visited/current, the immediate
          // next step when the current guard passes, or any earlier step.
          const isLocked = i > currentIndex && !(i === currentIndex + 1 && canAdvance);

          const classNames = `${stepClass} ${isCurrent ? currentClass : ''} ${
            isCompleted ? completedClass : ''
          } ${isLocked ? lockedClass : ''}`
            .replace(/\s+/g, ' ')
            .trim();

          return (
            <li key={step} className={classNames}>
              <button
                type="button"
                className={styles['button'] ?? ''}
                onClick={() => {
                  onStepSelect(step);
                }}
                disabled={isLocked}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${String(i + 1)}: ${STEP_LABELS[step]}`}
              >
                <span className={indexClass} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={labelClass}>{STEP_LABELS[step]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
