/**
 * Category-name generation.
 *
 * Asks the model for a batch of short, punchy, distinct category titles suitable
 * for a picture-guessing game. Task 56 wraps this in a batched generator with
 * prefetch and de-dups case-insensitively across batches; this module is only
 * responsible for one well-formed, validated batch.
 */

import { structuredChat } from './structuredChat';
import { GenerationError } from './errors';
import { isRecord, isStringArray } from './guards';
import type { OpenAIConfig } from '@hooks/useCredentials';

/** Structured-output schema: an object root wrapping the name list. */
const NAMES_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['names'],
  properties: {
    names: {
      type: 'array',
      description: 'Distinct, short, guessing-game-appropriate category titles.',
      items: { type: 'string' },
    },
  },
};

interface NamesResponse {
  names: string[];
}

/** Type guard for the structured names response (no casts). */
function isNamesResponse(value: unknown): value is NamesResponse {
  return isRecord(value) && isStringArray(value['names']);
}

const SYSTEM_PROMPT = [
  'You name categories for a fast-paced picture-guessing game show.',
  'Each category is a theme whose items can be shown as images and guessed quickly.',
  'Return short, punchy, evocative titles (1–3 words where possible).',
  'They must be distinct from one another and broad enough to fill ~50 cards.',
  'Avoid niche jargon, offensive themes, and near-duplicate phrasings.',
].join(' ');

/**
 * Generate a batch of `count` candidate category names.
 *
 * Returns trimmed, non-empty, case-insensitively-distinct titles. May return
 * fewer than `count` if the model repeats itself; never returns empties.
 *
 * @throws {GenerationError} on transport/HTTP/parse failure (see
 *   {@link structuredChat}), or `parse` if no usable names came back.
 */
export async function generateCategoryNames(
  config: OpenAIConfig,
  count: number
): Promise<string[]> {
  const requested = Math.max(1, Math.floor(count));

  const result = await structuredChat<NamesResponse>({
    config,
    schemaName: 'category_names',
    schema: NAMES_SCHEMA,
    validate: isNamesResponse,
    system: SYSTEM_PROMPT,
    user: `Suggest ${String(requested)} distinct category names for the game.`,
  });

  // Trim, drop blanks, and de-dup case-insensitively while preserving order and
  // the first-seen casing.
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of result.names) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(trimmed);
  }

  if (names.length === 0) {
    throw new GenerationError('parse', 'OpenAI returned no usable category names. Try again.');
  }

  return names;
}
