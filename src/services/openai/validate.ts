/**
 * Lightweight credential validation.
 *
 * `validateCredentials` performs an authenticated probe against the configured
 * endpoint using `client.models.list()`. Listing models is a cheap GET that
 * exercises auth, the base URL, and CORS WITHOUT consuming any completion tokens,
 * so it is the right "is this key usable?" check for the Credentials step.
 *
 * Resolves on success; throws a typed {@link GenerationError} on failure
 * (auth / network / cors / rateLimit / unknown via {@link toGenerationError}).
 */

import { getOpenAI } from './client';
import { toGenerationError } from './errors';
import type { OpenAIConfig } from '@hooks/useCredentials';

/**
 * Probe the configured OpenAI endpoint to confirm the key and base URL work.
 *
 * @throws {GenerationError} `auth` for a rejected key, `cors`/`network` for a
 *   blocked or unreachable endpoint, `rateLimit`/`unknown` otherwise.
 */
export async function validateCredentials(config: OpenAIConfig): Promise<void> {
  try {
    const client = getOpenAI(config);
    // A single page is enough to prove the credentials authenticate; we don't
    // need to enumerate every model.
    await client.models.list();
  } catch (error) {
    throw toGenerationError(error);
  }
}
