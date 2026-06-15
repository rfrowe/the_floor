/**
 * useCredentials — ephemeral OpenAI credentials store for the LLM Studio.
 *
 * Holds the user's OpenAI API key and an optional custom (OpenAI-compatible)
 * base URL in an **in-memory, module-level store** shared across every consumer
 * via React's {@link useSyncExternalStore}. The image source is fixed to OpenAI
 * generation in Phase 12, so there is no second API key to manage.
 *
 * SECURITY: the credentials are NEVER persisted — not to `localStorage`,
 * `sessionStorage`, IndexedDB, or anywhere else. They live only for the current
 * page session and vanish on refresh or tab close, at which point the user
 * re-enters the key. A single module-level value (rather than a Context) keeps
 * all consumers in sync without threading a provider through the Studio tree.
 * The key is sent only to the configured OpenAI endpoint (Task 55) and MUST
 * NEVER be logged.
 */

import { useSyncExternalStore } from 'react';

/**
 * The OpenAI configuration the Studio holds in memory. `baseURL` is free-form; an
 * empty string means "use the SDK default" (normalization is the SDK's concern in
 * Task 55).
 */
export interface OpenAIConfig {
  /** The OpenAI API key. In memory only — never persisted. Empty until entered. */
  apiKey: string;
  /** Optional custom OpenAI-compatible base URL. `''` → SDK default. */
  baseURL: string;
  /** Fixed to OpenAI image generation in Phase 12. */
  imageSource: 'openai';
}

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
  /** Drop the in-memory credentials (reset to {@link DEFAULT_CREDENTIALS}). */
  clear: () => void;
}

/** Imperative setters and derived flags returned alongside the config. */
export interface CredentialsActions extends CredentialsSetters {
  /** True once a non-blank API key is present. */
  isConfigured: boolean;
}

/**
 * Module-level in-memory store. A single mutable `config` value plus a set of
 * subscriber callbacks is all `useSyncExternalStore` needs to keep every
 * `useCredentials()` consumer rendering the same value. Nothing here touches any
 * storage API, so the credentials are gone the moment the module is unloaded
 * (refresh / tab close).
 */
let config: OpenAIConfig = DEFAULT_CREDENTIALS;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): OpenAIConfig {
  return config;
}

function setConfig(next: OpenAIConfig): void {
  config = next;
  for (const listener of listeners) {
    listener();
  }
}

// Setters have stable identity (they only close over module-level state), so the
// returned `actions` object is safe to use in effect dependency arrays.
function setKey(apiKey: string): void {
  setConfig({ ...config, apiKey });
}

function setBaseURL(baseURL: string): void {
  setConfig({ ...config, baseURL });
}

function clear(): void {
  setConfig(DEFAULT_CREDENTIALS);
}

/**
 * Reset the in-memory credentials store to its blank default. Intended for tests
 * that need a clean store between cases; production code uses `clear()` via the
 * hook actions.
 */
export function __resetCredentialsForTest(): void {
  config = DEFAULT_CREDENTIALS;
  // Notify any mounted consumers so they re-read the blank snapshot.
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Seed the in-memory credentials store directly. Test-only affordance for cases
 * that need `useCredentials()` to come up already configured (e.g. steps gated on
 * a key) without rendering the credentials step. Production code uses the hook
 * setters.
 */
export function __setCredentialsForTest(overrides: Partial<OpenAIConfig>): void {
  setConfig({ ...DEFAULT_CREDENTIALS, ...overrides });
}

/**
 * Read and manage the in-memory OpenAI credentials.
 *
 * @returns A tuple of `[config, actions]`. All consumers share one module-level
 *          value via {@link useSyncExternalStore}, so a change anywhere updates
 *          every mounted consumer. The value is never persisted.
 */
export function useCredentials(): readonly [OpenAIConfig, CredentialsActions] {
  const current = useSyncExternalStore(subscribe, getSnapshot);

  const isConfigured = current.apiKey.trim().length > 0;

  const actions: CredentialsActions = {
    setKey,
    setBaseURL,
    clear,
    isConfigured,
  };

  return [current, actions] as const;
}
