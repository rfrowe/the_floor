/**
 * Configured, memoized OpenAI client for the browser.
 *
 * The Studio talks to OpenAI directly from the browser, so the client is built
 * with `dangerouslyAllowBrowser: true` and an optional custom `baseURL` (an
 * empty string in {@link OpenAIConfig} means "use the SDK default"). The client
 * is memoized by `{ apiKey, baseURL }` so repeated calls in one session reuse a
 * single instance, and a changed key or base URL transparently re-creates it.
 *
 * SECURITY: the key is passed straight to the SDK and is never logged here.
 *
 * BUNDLE: the `openai` SDK is imported only inside `src/services/openai/*`,
 * reached from the lazily-loaded Studio route, so gameplay never downloads it.
 */

import OpenAI from 'openai';
import type { OpenAIConfig } from '@hooks/useCredentials';

interface CachedClient {
  apiKey: string;
  baseURL: string;
  client: OpenAI;
}

let cached: CachedClient | null = null;

/**
 * Build (or reuse) an {@link OpenAI} client for the given credentials.
 *
 * Memoized on `apiKey` + `baseURL`: identical config returns the cached client;
 * any change re-creates it. `config.baseURL || undefined` lets an empty string
 * fall through to the SDK default.
 */
export function getOpenAI(config: OpenAIConfig): OpenAI {
  if (cached?.apiKey === config.apiKey && cached.baseURL === config.baseURL) {
    return cached.client;
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL || undefined,
    dangerouslyAllowBrowser: true,
  });

  cached = { apiKey: config.apiKey, baseURL: config.baseURL, client };
  return client;
}

/**
 * Drop the memoized client. Primarily for tests; production code relies on the
 * key/base-URL comparison to re-memoize.
 */
export function resetOpenAIClient(): void {
  cached = null;
}
