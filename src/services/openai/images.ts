/**
 * Image generation (`gpt-image-1`).
 *
 * Turns a card's `imagePrompt` into a base64 `data:` URL suitable for
 * `slide.imageUrl`. The model returns base64 directly, so the happy path never
 * touches the network twice; we just wrap the payload via {@link b64ToDataUrl}.
 *
 * Every prompt is suffixed with a light quality directive ({@link QUALITY_SUFFIX})
 * that nudges toward one clearly-lit, recognizable, centered subject. It does
 * NOT strip text or logos: the game's censor step (Task 59) blacks out giveaway
 * text/branding during guessing and reveals the full photo on a correct guess or
 * skip, so the subject's real identifying detail (logos, labels, signage, jersey
 * names) is desirable — it's often what makes a subject guessable in the first
 * place. We only avoid gratuitously captioning the literal answer; the card's
 * `imagePrompt` (shaped by `cardIdeas.ts`) carries that intent.
 *
 * BUNDLE: like the rest of `src/services/openai/*`, this is reached only from the
 * lazily-loaded Studio route, so gameplay never downloads the `openai` SDK.
 * SECURITY: the API key is never logged here; failures are normalized through
 * {@link toGenerationError}, which never embeds the key.
 */

import { getOpenAI } from './client';
import { DEFAULT_IMAGE_MODEL } from './structuredChat';
import { GenerationError, toGenerationError } from './errors';
import { b64ToDataUrl, DEFAULT_IMAGE_MIME } from '@services/images/toDataUrl';
import type { OpenAIConfig } from '@hooks/useCredentials';

/**
 * A light quality suffix appended to every image prompt. It steers toward one
 * clearly-lit, recognizable subject centered in frame, but deliberately does NOT
 * forbid text, logos, or branding — those identifying details aid recognition,
 * and the censor step hides any giveaways during play (see module docs).
 */
export const QUALITY_SUFFIX = 'A single, clearly-lit, recognizable subject centered in frame.';

/**
 * Compose the final prompt sent to the model: the card's prompt followed by the
 * {@link QUALITY_SUFFIX}. Exported for direct testing and so callers can preview
 * exactly what will be requested.
 *
 * A blank base prompt yields just the suffix (so a card with no written prompt
 * still produces a sensible, centered image rather than failing here).
 */
export function buildImagePrompt(prompt: string): string {
  const base = prompt.trim();
  return base.length === 0 ? QUALITY_SUFFIX : `${base} ${QUALITY_SUFFIX}`;
}

/**
 * Generate one image for `prompt` and return it as a base64 `data:` URL.
 *
 * Requests {@link DEFAULT_IMAGE_MODEL} at 1024×1024; the model returns base64,
 * which {@link b64ToDataUrl} wraps as `data:image/png;base64,…` — exactly the
 * shape `slide.imageUrl` expects.
 *
 * @param prompt The card's `imagePrompt` (the {@link QUALITY_SUFFIX} is appended
 *   automatically; do not add it yourself).
 * @param config In-memory OpenAI credentials.
 * @returns A `data:image/png;base64,…` URL.
 * @throws {GenerationError} `parse` when no image comes back; `auth` /
 *   `rateLimit` / `network` / `cors` / `unknown` for transport/HTTP failures
 *   (mapped by {@link toGenerationError}).
 */
export async function generateImage(prompt: string, config: OpenAIConfig): Promise<string> {
  try {
    const client = getOpenAI(config);
    const res = await client.images.generate({
      model: DEFAULT_IMAGE_MODEL,
      prompt: buildImagePrompt(prompt),
      size: '1024x1024',
    });

    const b64 = res.data?.[0]?.b64_json;
    if (typeof b64 !== 'string' || b64.length === 0) {
      throw new GenerationError('parse', 'OpenAI returned no image. Try again.');
    }

    return b64ToDataUrl(b64, DEFAULT_IMAGE_MIME);
  } catch (error) {
    // GenerationError (incl. the parse error above) passes through unchanged;
    // SDK/transport errors are mapped to a typed kind.
    throw toGenerationError(error);
  }
}
