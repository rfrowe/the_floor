/**
 * useCredentials — OpenAI credentials store for the LLM Studio.
 *
 * Persists the user's OpenAI API key and an optional custom (OpenAI-compatible)
 * base URL to `localStorage` via the existing {@link useLocalStorage} hook, which
 * prefixes the key with `the-floor:` and syncs across tabs through the `storage`
 * event. The image source is fixed to OpenAI generation in Phase 12, so there is
 * no second API key to manage.
 *
 * SECURITY: the key is stored in plaintext and is readable by any script on this
 * origin. This is an intentional, honest design for a static client-only SPA —
 * client-side "encryption" is theater because the decryption key would ship in the
 * bundle. The {@link CredentialsStep} UI warns the user, recommends a spend-limited
 * key, and offers a Clear action. The key is sent only to the configured OpenAI
 * endpoint (Task 55) and MUST NEVER be logged.
 */

import { useMemo } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';

/**
 * The OpenAI configuration the Studio persists. `baseURL` is free-form; an empty
 * string means "use the SDK default" (normalization is the SDK's concern in
 * Task 55).
 */
export interface OpenAIConfig {
  /** The OpenAI API key (plaintext in localStorage). Empty until the user enters one. */
  apiKey: string;
  /** Optional custom OpenAI-compatible base URL. `''` → SDK default. */
  baseURL: string;
  /** Fixed to OpenAI image generation in Phase 12. */
  imageSource: 'openai';
}

/** The localStorage key (becomes `the-floor:studio:openai` via the existing prefix). */
export const CREDENTIALS_STORAGE_KEY = 'studio:openai';

/** A blank, unconfigured config used as the initial value and by `clear()`. */
export const DEFAULT_CREDENTIALS: OpenAIConfig = {
  apiKey: '',
  baseURL: '',
  imageSource: 'openai',
};

/** Imperative setters returned alongside the config. */
interface CredentialsSetters {
  /** Set the API key, preserving the other fields. */
  setKey: (apiKey: string) => void;
  /** Set the custom base URL, preserving the other fields. */
  setBaseURL: (baseURL: string) => void;
  /** Remove the stored credentials (reset to {@link DEFAULT_CREDENTIALS}). */
  clear: () => void;
}

/** Imperative setters and derived flags returned alongside the config. */
export interface CredentialsActions extends CredentialsSetters {
  /** True once a non-blank API key is present. */
  isConfigured: boolean;
}

/**
 * Read and manage the persisted OpenAI credentials.
 *
 * @returns A tuple of `[config, actions]`. Cross-tab sync is inherited from
 *          {@link useLocalStorage}, so a change in another tab updates `config`
 *          here automatically.
 */
export function useCredentials(): readonly [OpenAIConfig, CredentialsActions] {
  const [config, setConfig] = useLocalStorage<OpenAIConfig>(
    CREDENTIALS_STORAGE_KEY,
    DEFAULT_CREDENTIALS
  );

  // Setters keep a stable identity across renders (they only depend on the
  // stable `setConfig`), so callers can safely use them in effect deps.
  const setters = useMemo<CredentialsSetters>(
    () => ({
      setKey: (apiKey: string) => {
        setConfig((prev) => ({ ...prev, apiKey }));
      },
      setBaseURL: (baseURL: string) => {
        setConfig((prev) => ({ ...prev, baseURL }));
      },
      clear: () => {
        setConfig(DEFAULT_CREDENTIALS);
      },
    }),
    [setConfig]
  );

  const isConfigured = config.apiKey.trim().length > 0;

  const actions = useMemo<CredentialsActions>(
    () => ({ ...setters, isConfigured }),
    [setters, isConfigured]
  );

  return [config, actions] as const;
}
