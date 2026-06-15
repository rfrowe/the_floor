/**
 * Image generation (`gpt-image-1`).
 *
 * Turns a card's `imagePrompt` into a base64 `data:` URL suitable for
 * `slide.imageUrl`. The model returns base64 directly, so the happy path never
 * touches the network twice; we just wrap the payload via {@link b64ToDataUrl}.
 *
 * Every prompt is suffixed with a hard "no text, single centered subject"
 * directive ({@link NO_TEXT_SUFFIX}) drawn from the Phase-12 sample-category
 * analysis: keeping rendered text/letters/logos out of the image is what makes
 * the clue fair (a recognizable subject, not a spelled-out answer key) and lets
 * the game skip manual censor boxes.
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
 * The hard suffix appended to every image prompt. Verbatim from
 * `docs/tasks/phase-12-llm-studio/SAMPLE_CATEGORY_ANALYSIS.md` (directive C):
 * one prominent centered subject, fair clue not answer-key, and — the single
 * most important constraint — absolutely no rendered text anywhere.
 */
export const NO_TEXT_SUFFIX =
  'Photorealistic, single centered subject, plain uncluttered background, ' +
  'absolutely no text, letters, words, captions, logos, or watermarks anywhere in the image.';

/**
 * Compose the final prompt sent to the model: the card's prompt followed by the
 * {@link NO_TEXT_SUFFIX}. Exported for direct testing and so callers can preview
 * exactly what will be requested.
 *
 * A blank base prompt yields just the suffix (so a card with no written prompt
 * still produces a text-free image rather than failing here).
 */
export function buildImagePrompt(prompt: string): string {
  const base = prompt.trim();
  return base.length === 0 ? NO_TEXT_SUFFIX : `${base} ${NO_TEXT_SUFFIX}`;
}

/**
 * Generate one image for `prompt` and return it as a base64 `data:` URL.
 *
 * Requests {@link DEFAULT_IMAGE_MODEL} at 1024×1024; the model returns base64,
 * which {@link b64ToDataUrl} wraps as `data:image/png;base64,…` — exactly the
 * shape `slide.imageUrl` expects.
 *
 * @param prompt The card's `imagePrompt` (the {@link NO_TEXT_SUFFIX} is appended
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
