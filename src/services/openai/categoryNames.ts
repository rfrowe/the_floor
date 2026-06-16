/**
 * Category-name generation.
 *
 * Asks the model for a batch of short, punchy, distinct category titles suitable
 * for a picture-guessing game. Task 56 wraps this in a batched generator with
 * prefetch and de-dups case-insensitively across batches; this module is only
 * responsible for one well-formed, validated batch.
 */

import { structuredChat, NAMES_TEMPERATURE } from './structuredChat';
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
        'A deliberately VARIED set of distinct category titles — no two from the same ' +
        'family, and NOT ordered best-first. Each is 1–4 words, a single concrete ' +
        'noun-phrase "bucket" whose members can each be shown as one clear image and ' +
        'are broad enough to fill ~50 distinct cards. Range widely across themes ' +
        '(animals, food, brands, fandoms, sports, music, everyday objects, puns) and ' +
        'avoid the single most generic/obvious pick (e.g. not "Fruits", "Animals", ' +
        '"Colors").',
      items: {
        type: 'string',
        description:
          'One category title — 1–4 words, a single concrete, picturable noun phrase. ' +
          'Title-case proper-noun buckets; a lowercase everyday word is fine when natural ' +
          '(samples include "Bears", "Clouds", "Sea creatures", "Cars!", "Kitchen ' +
          'equipment", "Trees in pop culture"). No descriptions or hints.',
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
  '- Format: 1–4 words, a single concrete noun-phrase "bucket". Title-case proper-noun',
  '  buckets; an everyday common-noun bucket may be lowercase when that reads naturally',
  '  (the samples include "Bears", "Clouds", "Sea creatures", "Kitchen equipment", "Trees',
  '  in pop culture"). No punctuation except an occasional "!" for energy (e.g. "Cars!").',
  '- Pictureability gate: every member of the bucket must be depictable as one clear,',
  '  recognizable image. Reject abstract themes (emotions, dates, statistics, "concepts").',
  '- Breadth gate: the bucket must be broad enough to yield ~50 distinct, varied members.',
  '- Titles must be distinct from one another, with no near-duplicate phrasings.',
  '',
  'Favor the two archetypes that play best:',
  '1. A pun/homophone bucket — a word that can be matched many clever ways through literal',
  '   members plus brands, memes, logos, and famous names that contain or evoke it',
  '   (e.g. "Bears", "Clouds", "Trees in pop culture", "Minecraft").',
  '2. A concrete taxonomy or single fandom — enumerate the members of a real-world set or one',
  '   franchise (e.g. "Sea creatures", "Musical instruments", "Game of Thrones", "Cars!",',
  '   "Dogs", "Mascots", "NBA Players").',
  '',
  'VARIETY IS THE WHOLE POINT — each request must feel fresh:',
  '- Do NOT lead with the single most obvious, generic answer. Skip the first thing that',
  '  pops to mind (the "Fruits / Animals / Colors / Countries" reflex). Reach for the',
  '  second, third, and tenth idea — the surprising, specific, "oh, that\'s a great',
  '  category" picks a clever quizmaster would be proud of.',
  '- Spread the batch across many different domains — animals, food & drink, brands, a',
  '  specific TV/film/game fandom, a sport, music, everyday objects, a pun word — rather',
  '  than clustering near one theme.',
  '- Return the list UNORDERED (not ranked best-first); no single "headline" pick belongs',
  '  at position one. Mix punny buckets and concrete taxonomies/fandoms throughout.',
].join('\n');

/**
 * Fisher–Yates shuffle returning a new array. Used to de-correlate the
 * *first-shown* candidate from the model's positional ordering: even when the
 * model leads with the same modal pick, shuffling means the dice rarely opens on
 * it twice in a row (the batched generator surfaces `buffer[0]` first).
 */
function shuffled<T>(input: readonly T[]): T[] {
  const out = input.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i];
    const b = out[j];
    // Guard against `noUncheckedIndexedAccess`; both indices are in range.
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}

/**
 * Generate a batch of `count` candidate category names.
 *
 * Returns trimmed, non-empty, case-insensitively-distinct titles, **shuffled**
 * so the first one shown isn't always the model's modal pick. May return fewer
 * than `count` if the model repeats itself; never returns empties.
 *
 * Variety: a raised sampling temperature ({@link NAMES_TEMPERATURE}) plus the
 * prompt's "don't lead with the obvious / return unordered" nudges make batches
 * differ run-to-run; the shuffle de-correlates the first-shown candidate.
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
    temperature: NAMES_TEMPERATURE,
    system: SYSTEM_PROMPT,
    user:
      `Suggest ${String(requested)} distinct, wide-ranging category names for the game. ` +
      'Make the set varied and surprising — span several different domains (animals, food, ' +
      'brands, a fandom, a sport, music, everyday objects, a pun word) and mix clever ' +
      'pun/homophone buckets with concrete taxonomies or single fandoms. Skip the single most ' +
      'obvious answer in any domain; reach for the fresher, cleverer pick. Return them ' +
      'UNORDERED (do not rank best-first). Each title 1–4 words and picturable.',
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

  // Shuffle so the *first* candidate the dice surfaces isn't always the model's
  // top positional pick — the key fix for the "same first category every time"
  // report. De-dup against earlier batches still happens upstream by value.
  return shuffled(names);
}
