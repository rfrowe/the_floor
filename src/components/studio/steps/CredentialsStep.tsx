/**
 * CredentialsStep — the first step of the LLM Studio wizard.
 *
 * Lets the user enter an OpenAI API key (password-masked) and an optional custom
 * OpenAI-compatible base URL, held in memory via {@link useCredentials}. Surfaces
 * a reassuring note (the key lives in memory for this session only and is never
 * saved), a Clear action, and a Continue control gated on `isConfigured` (a
 * non-blank key).
 *
 * On Continue the step performs a lightweight authenticated probe
 * ({@link validateCredentials}, a `models.list()` call that consumes no
 * completion tokens) before advancing: it shows a "Verifying…" state, disables
 * Continue while in flight, advances only on success, and on failure stays put
 * and renders the typed {@link GenerationError} message inline (re-click Continue
 * to retry). The key is never logged.
 */

import { useId, useState } from 'react';
import { Button } from '@components/common/Button';
import { useCredentials } from '@hooks/useCredentials';
import { validateCredentials, isGenerationError } from '@services/openai';
import styles from './CredentialsStep.module.css';

/** The OpenAI SDK default base URL, shown as a placeholder (empty = this default). */
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

export interface CredentialsStepProps {
  /** Advance to the next wizard step. Invoked by the gated Continue control. */
  onContinue: () => void;
}

export function CredentialsStep({ onContinue }: CredentialsStepProps) {
  const [config, { setKey, setBaseURL, clear, isConfigured }] = useCredentials();

  const apiKeyId = useId();
  const baseUrlId = useId();
  const errorId = useId();

  // Transient (non-persisted) validation UI state.
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const stepClass = styles['step'] ?? '';
  const introClass = styles['intro'] ?? '';
  const fieldClass = styles['field'] ?? '';
  const labelClass = styles['label'] ?? '';
  const inputClass = styles['input'] ?? '';
  const hintClass = styles['hint'] ?? '';
  const warningClass = styles['warning'] ?? '';
  const warningIconClass = styles['warningIcon'] ?? '';
  const warningBodyClass = styles['warningBody'] ?? '';
  const warningTitleClass = styles['warningTitle'] ?? '';
  const warningListClass = styles['warningList'] ?? '';
  const errorClass = styles['error'] ?? '';
  const errorIconClass = styles['errorIcon'] ?? '';
  const errorMessageClass = styles['errorMessage'] ?? '';
  const actionsClass = styles['actions'] ?? '';

  const handleContinue = () => {
    // The empty-key gate (Task 54) still applies: never probe without a key, and
    // ignore re-clicks while a probe is in flight.
    if (!isConfigured || isVerifying) {
      return;
    }

    setIsVerifying(true);
    setValidationError(null);

    validateCredentials(config)
      .then(() => {
        onContinue();
      })
      .catch((error: unknown) => {
        // Stay on the step and surface the typed, user-facing message so the
        // user can fix the key/base URL and re-click Continue to retry.
        const message = isGenerationError(error)
          ? error.message
          : 'Could not verify your credentials. Try again.';
        setValidationError(message);
      })
      .finally(() => {
        setIsVerifying(false);
      });
  };

  // Clearing credentials also resets any prior validation feedback.
  const handleClear = () => {
    setValidationError(null);
    clear();
  };

  return (
    <div className={stepClass}>
      <p className={introClass}>
        The Studio uses your own OpenAI key to suggest names, draft cards, and generate images.
        Image generation is fixed to OpenAI, so there is no second key to provide.
      </p>

      <div className={fieldClass}>
        <label className={labelClass} htmlFor={apiKeyId}>
          OpenAI API key
        </label>
        <input
          id={apiKeyId}
          className={inputClass}
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-..."
          value={config.apiKey}
          onChange={(e) => {
            setKey(e.target.value);
            setValidationError(null);
          }}
          aria-describedby={`${apiKeyId}-hint`}
        />
        <p id={`${apiKeyId}-hint`} className={hintClass}>
          Held in memory for this session only. Used solely to call the OpenAI endpoint below.
        </p>
      </div>

      <div className={fieldClass}>
        <label className={labelClass} htmlFor={baseUrlId}>
          Custom base URL <span aria-hidden="true">(optional)</span>
        </label>
        <input
          id={baseUrlId}
          className={inputClass}
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={DEFAULT_OPENAI_BASE_URL}
          value={config.baseURL}
          onChange={(e) => {
            setBaseURL(e.target.value);
            setValidationError(null);
          }}
          aria-describedby={`${baseUrlId}-hint`}
        />
        <p id={`${baseUrlId}-hint`} className={hintClass}>
          Leave blank to use the default ({DEFAULT_OPENAI_BASE_URL}). Set this for an
          OpenAI-compatible endpoint.
        </p>
      </div>

      <aside className={warningClass} role="note" aria-label="Security note">
        <span className={warningIconClass} aria-hidden="true">
          🔒
        </span>
        <div className={warningBodyClass}>
          <p className={warningTitleClass}>Your key stays in memory for this session only</p>
          <ul className={warningListClass}>
            <li>
              It is <strong>never saved</strong> to your browser or disk — no local storage, no
              cookies, no database.
            </li>
            <li>
              It is <strong>cleared automatically</strong> when you refresh or close this tab, so
              you&apos;ll re-enter it next time.
            </li>
            <li>
              It is sent only to OpenAI (or your configured base URL).{' '}
              <strong>Clear credentials</strong> below drops it from memory right away.
            </li>
          </ul>
        </div>
      </aside>

      {validationError !== null && (
        <div className={errorClass} role="alert" id={errorId}>
          <span className={errorIconClass} aria-hidden="true">
            ⚠️
          </span>
          <p className={errorMessageClass}>{validationError}</p>
        </div>
      )}

      <div className={actionsClass}>
        <Button
          type="button"
          variant="danger"
          onClick={handleClear}
          disabled={(!isConfigured && config.baseURL.length === 0) || isVerifying}
        >
          Clear credentials
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleContinue}
          loading={isVerifying}
          disabled={!isConfigured || isVerifying}
          aria-describedby={validationError !== null ? errorId : undefined}
        >
          {isVerifying ? 'Verifying…' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
