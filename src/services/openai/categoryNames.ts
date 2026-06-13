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
      description:
        'Distinct category titles: 1–3 words, title-case, each a single concrete ' +
        'noun-phrase "bucket" whose members can each be shown as one clear image and ' +
        'are broad enough to fill ~50 distinct cards.',
      items: {
        type: 'string',
        description:
          'One category title — 1–3 words, title-case, a single concrete noun phrase ' +
          '(e.g. "Bears", "Clouds", "Sea Creatures", "Cars!"). No descriptions or hints.',
      },
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
  'You name categories for a fast-paced picture-guessing game show, in the voice of a',
  'witty, pop-culture-literate pub-quiz host: clever connections and groan-worthy puns are',
  'welcome, but stay warm and inclusive — never edgy, crude, or offensive.',
  '',
  'Each category is a theme whose members are each shown as a single image and guessed quickly.',
  '',
  'Rules for every title you return:',
  '- Format: 1–3 words, title-case, a single concrete noun-phrase "bucket". No punctuation',
  '  except an occasional "!" for energy (e.g. "Cars!").',
  '- Pictureability gate: every member of the bucket must be depictable as one clear,',
  '  recognizable image. Reject abstract themes (emotions, dates, statistics, "concepts").',
  '- Breadth gate: the bucket must be broad enough to yield ~50 distinct, varied members.',
  '- Titles must be distinct from one another, with no near-duplicate phrasings.',
  '',
  'Favor the two archetypes that play best:',
  '1. A pun/homophone bucket — a word that can be matched many clever ways through literal',
  '   members plus brands, memes, logos, and famous names that contain or evoke it',
  '   (e.g. "Bears", "Clouds", "Trees in pop culture").',
  '2. A concrete taxonomy or single fandom — enumerate the members of a real-world set or one',
  '   franchise (e.g. "Sea Creatures", "Musical Instruments", "Game of Thrones", "Cars!").',
].join('\n');

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
    user:
      `Suggest ${String(requested)} distinct category names for the game. ` +
      'Mix the two winning archetypes — some clever pun/homophone buckets and some concrete ' +
      'taxonomies or single fandoms. Keep each title 1–3 words, title-case, and picturable.',
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
