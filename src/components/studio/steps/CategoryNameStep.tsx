/**
 * CategoryNameStep — the second step of the LLM Studio wizard.
 *
 * On entry (with a configured OpenAI key) it generates a *batch* of candidate
 * category names and shows one at a time. A 🎲 Reroll cycles to the next
 * instantly; {@link useBatchedGenerator} prefetches the next batch before the
 * current one runs out, so rerolls never lag and we don't call the API on every
 * click. The user can also type a custom name to override the suggestion.
 *
 * "Use this name" confirms the chosen name into the wizard draft
 * (`SET_CATEGORY_NAME`) and advances to the cards step. Loading and typed-error
 * states (with a Retry) render inline; a failed prefetch never clears an
 * already-shown candidate.
 *
 * No buffer is persisted — only the *confirmed* name lives in the draft (Task 56
 * Out of Scope: persisting the candidate buffer).
 */

import { useEffect, useId, useState } from 'react';
import { Button } from '@components/common/Button';
import { useCredentials } from '@hooks/useCredentials';
import { useBatchedGenerator } from '@hooks/useBatchedGenerator';
import { generateCategoryNames } from '@services/openai';
import styles from './CategoryNameStep.module.css';

/** Batch sizing for name suggestions — generous batch, early prefetch. */
const NAME_BATCH_SIZE = 10;
const NAME_PREFETCH_THRESHOLD = 3;

export interface CategoryNameStepProps {
  /**
   * Confirm the chosen name into the draft and advance. The shell wires this to
   * `SET_CATEGORY_NAME(name)` followed by stepping to `cards`.
   */
  onConfirm: (name: string) => void;
}

export function CategoryNameStep({ onConfirm }: CategoryNameStepProps) {
  const [config, { isConfigured }] = useCredentials();

  const suggestions = useBatchedGenerator<string>({
    fetchBatch: (count) => generateCategoryNames(config, count),
    batchSize: NAME_BATCH_SIZE,
    prefetchThreshold: NAME_PREFETCH_THRESHOLD,
    enabled: isConfigured,
  });

  // The editable name field. It tracks the current suggestion until the user
  // edits it, after which their input wins (a fresh reroll re-syncs it).
  const [name, setName] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Keep the field in sync with the current suggestion unless the user has typed
  // a custom override. A reroll updates `current`, which flows into the field.
  const current = suggestions.current;
  useEffect(() => {
    if (!isCustom && current !== undefined) {
      setName(current);
    }
  }, [current, isCustom]);

  const inputId = useId();
  const errorId = useId();

  const handleReroll = () => {
    // Rerolling abandons any custom edit and resumes following suggestions.
    setIsCustom(false);
    suggestions.next();
  };

  const trimmedName = name.trim();
  const canConfirm = trimmedName.length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(trimmedName);
  };

  const stepClass = styles['step'] ?? '';
  const introClass = styles['intro'] ?? '';
  const fieldClass = styles['field'] ?? '';
  const labelClass = styles['label'] ?? '';
  const inputRowClass = styles['inputRow'] ?? '';
  const inputClass = styles['input'] ?? '';
  const hintClass = styles['hint'] ?? '';
  const loadingClass = styles['loading'] ?? '';
  const errorClass = styles['error'] ?? '';
  const errorIconClass = styles['errorIcon'] ?? '';
  const errorMessageClass = styles['errorMessage'] ?? '';
  const errorActionsClass = styles['errorActions'] ?? '';
  const actionsClass = styles['actions'] ?? '';

  // Without a key we can't suggest names; the step still lets the user type one.
  if (!isConfigured) {
    return (
      <div className={stepClass}>
        <p className={introClass}>
          Add your OpenAI key on the previous step to get AI-suggested names, or type your own
          category name below.
        </p>
        <ManualNameField
          fieldClass={fieldClass}
          labelClass={labelClass}
          inputClass={inputClass}
          hintClass={hintClass}
          inputId={inputId}
          value={name}
          onChange={(value) => {
            setIsCustom(true);
            setName(value);
          }}
        />
        <div className={actionsClass}>
          <Button type="button" variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
            Use this name →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={stepClass}>
      <p className={introClass}>
        Reroll for a fresh AI suggestion, or type your own. Rerolling is instant — the next batch is
        fetched in the background before you run out.
      </p>

      <div className={fieldClass}>
        <label className={labelClass} htmlFor={inputId}>
          Category name
        </label>
        <div className={inputRowClass}>
          <input
            id={inputId}
            className={inputClass}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={suggestions.isLoading ? 'Generating suggestions…' : 'e.g. World Capitals'}
            value={name}
            onChange={(e) => {
              setIsCustom(true);
              setName(e.target.value);
            }}
            disabled={suggestions.isLoading}
            aria-describedby={`${inputId}-hint`}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleReroll}
            disabled={suggestions.isLoading}
            aria-label="Reroll for a new suggestion"
          >
            🎲 Reroll
          </Button>
        </div>
        <p id={`${inputId}-hint`} className={hintClass}>
          The 🎲 cycles through suggestions; type to override with your own name.
        </p>
      </div>

      {suggestions.isLoading && (
        <p className={loadingClass} role="status">
          Generating suggestions…
        </p>
      )}

      {suggestions.error !== null && (
        <div className={errorClass} role="alert" id={errorId}>
          <span className={errorIconClass} aria-hidden="true">
            ⚠️
          </span>
          <div>
            <p className={errorMessageClass}>{suggestions.error.message}</p>
            <div className={errorActionsClass}>
              <Button type="button" variant="secondary" size="small" onClick={suggestions.retry}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={actionsClass}>
        <Button
          type="button"
          variant="primary"
          onClick={handleConfirm}
          disabled={!canConfirm}
          aria-describedby={suggestions.error !== null ? errorId : undefined}
        >
          Use this name →
        </Button>
      </div>
    </div>
  );
}

/** A bare label + input + hint, shared by the no-key fallback. */
function ManualNameField({
  fieldClass,
  labelClass,
  inputClass,
  hintClass,
  inputId,
  value,
  onChange,
}: {
  fieldClass: string;
  labelClass: string;
  inputClass: string;
  hintClass: string;
  inputId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={fieldClass}>
      <label className={labelClass} htmlFor={inputId}>
        Category name
      </label>
      <input
        id={inputId}
        className={inputClass}
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="e.g. World Capitals"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        aria-describedby={`${inputId}-hint`}
      />
      <p id={`${inputId}-hint`} className={hintClass}>
        Type the name for your new category.
      </p>
    </div>
  );
}
