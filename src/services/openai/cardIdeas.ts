/**
 * Card-idea generation.
 *
 * For a confirmed category name, asks the model for a batch of card ideas — each
 * an `answer` plus image hints (`imageKeywords` for future search support, and
 * `imagePrompt` to drive Task 58's image generation). Stable `nanoid` ids are
 * assigned here so React keys survive mid-list edits in Task 57's editor.
 */

import { nanoid } from 'nanoid';
import { structuredChat } from './structuredChat';
import { GenerationError } from './errors';
import { isRecord } from './guards';
import type { CardIdea } from '@types';
import type { OpenAIConfig } from '@hooks/useCredentials';

/**
 * Structured-output schema. `id` is intentionally NOT requested from the model
 * (it is assigned locally), so the schema mirrors only the generated fields.
 */
const CARD_IDEAS_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['cards'],
  properties: {
    cards: {
      type: 'array',
      description:
        'Distinct, non-overlapping card ideas for the category, varied in subtype, mostly ' +
        'guessable by a general audience from a single image.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['answer', 'imageKeywords', 'imagePrompt'],
        properties: {
          answer: {
            type: 'string',
            description:
              'The correct guess: 1–3 words (prefer ~2), cleanly and correctly spelled, ' +
              'naming the canonical/most-famous form first with a well-known alias in ' +
              'parentheses or after a slash if useful (e.g. "Shaq (Shaquille O\'Neal)", ' +
              '"Little Finger / Lord Baelish"). No descriptions, sentences, or hints.',
          },
          imageKeywords: {
            type: 'string',
            description:
              'Space-separated search keywords for the literal thing the image should show ' +
              '(for a pun/lateral answer, the literal referent — not the pun target).',
          },
          imagePrompt: {
            type: 'string',
            description:
              'A vivid prompt for a single, centered, recognizable subject — the literal ' +
              'referent of the answer — as a photo or clean illustration. It must make the ' +
              'subject a fair visual clue WITHOUT any rendered text, words, letters, captions, ' +
              'logos, watermarks, or name/number plates anywhere in the image, and no collages.',
          },
        },
      },
    },
  },
};

/** The generated shape (the model fills these; `id` is added afterward). */
type GeneratedCard = Omit<CardIdea, 'id'>;

interface CardIdeasResponse {
  cards: GeneratedCard[];
}

/** Type guard for a single generated card (no casts). */
function isGeneratedCard(value: unknown): value is GeneratedCard {
  return (
    isRecord(value) &&
    typeof value['answer'] === 'string' &&
    typeof value['imageKeywords'] === 'string' &&
    typeof value['imagePrompt'] === 'string'
  );
}

/** Type guard for the structured card-ideas response. */
function isCardIdeasResponse(value: unknown): value is CardIdeasResponse {
  if (!isRecord(value)) return false;
  const cards = value['cards'];
  return Array.isArray(cards) && cards.every(isGeneratedCard);
}

const SYSTEM_PROMPT = [
  'You draft card ideas for a fast-paced picture-guessing game show, in the voice of a witty,',
  'pop-culture-literate pub-quiz host. Each card is one concrete subject within the given',
  'category that a contestant guesses from a single image. For each card provide "answer",',
  '"imageKeywords", and "imagePrompt".',
  '',
  'Answer style:',
  '- 1–3 words, prefer ~2. Name the canonical / most-famous thing, with a year or qualifier',
  '  only when it disambiguates.',
  '- Spell every answer cleanly and correctly (e.g. "Joe DiMaggio", "mayonnaise") — do not',
  '  imitate casual misspellings.',
  '- Fold a well-known alias into the same answer with parentheses or a slash when helpful',
  '  (e.g. "Shaq (Shaquille O\'Neal)", "Little Finger / Lord Baelish").',
  '- The answer is just the name — no descriptions, sentences, or hints. The image is the clue.',
  '',
  'Difficulty & lateral mix:',
  '- Aim for roughly 70% direct (the image literally shows the subject and you name it) and',
  '  30% lateral (a pun, homophone, logo/brand-mark, representative scene/prop, or a person',
  '  who stands in for a role/concept).',
  '- Match the mix to the theme: a pun/homophone bucket leans more lateral; a concrete taxonomy',
  '  or field-guide theme stays mostly direct.',
  '- Guessability bar: a smart general audience should get most answers from a good image. Even',
  '  lateral answers must be widely famous references. Cap deep-cut / superfan obscurities at',
  '  roughly a 20% tail — never make a whole batch out of deep cuts.',
  '',
  'Variety: keep answers distinct and non-overlapping, and vary the subtype within the category',
  '(for a sport: players, teams, coaches, trophies, ephemera, the sport in film) — do not return',
  'many of the same kind of thing.',
  '',
  'Image rules:',
  '- "imageKeywords": space-separated concrete search terms for the literal thing to depict',
  '  (for a pun/lateral answer, the literal referent, not the pun target).',
  '- "imagePrompt": describe ONE subject, centered and prominent, recognizable to a general',
  '  audience, as a photo or clean illustration. For a lateral/pun answer prompt the literal',
  '  referent (e.g. for "Tiger Woods" → "a professional golfer mid-swing on a course", not "a',
  '  tree"; for a bear-pun answer → the actual bear).',
  '- "imagePrompt" must NOT include any rendered text, words, letters, captions, labels,',
  '  logos-with-wordmarks, watermarks, or jersey/name plates anywhere in the image, must never',
  '  write or imply the answer word, and must avoid multi-subject collages or anything',
  '  un-picturable. Keeping text out of the image is what lets the game skip manual censoring.',
].join('\n');

/**
 * Generate `count` card ideas for `categoryName`, each with a fresh `nanoid` id.
 *
 * Returns trimmed, non-empty cards; may return fewer than `count` if the model
 * yields blanks. Ids are unique within the returned batch.
 *
 * @throws {GenerationError} on transport/HTTP/parse failure (see
 *   {@link structuredChat}), or `parse` if no usable cards came back.
 */
export async function generateCardIdeas(
  config: OpenAIConfig,
  categoryName: string,
  count: number
): Promise<CardIdea[]> {
  const requested = Math.max(1, Math.floor(count));
  const trimmedName = categoryName.trim();

  const result = await structuredChat<CardIdeasResponse>({
    config,
    schemaName: 'card_ideas',
    schema: CARD_IDEAS_SCHEMA,
    validate: isCardIdeasResponse,
    system: SYSTEM_PROMPT,
    user:
      `Category: "${trimmedName}". Generate ${String(requested)} distinct card ideas. ` +
      'Keep answers 1–3 words and correctly spelled, vary the subtype, and match the direct/' +
      'lateral mix to this theme (lean lateral for a pun bucket, mostly direct for a taxonomy). ' +
      'Make each imagePrompt a single centered subject with absolutely no text in the image.',
  });

  const cards: CardIdea[] = [];
  for (const generated of result.cards) {
    const answer = generated.answer.trim();
    if (answer.length === 0) continue;
    cards.push({
      id: nanoid(),
      answer,
      imageKeywords: generated.imageKeywords.trim(),
      imagePrompt: generated.imagePrompt.trim(),
    });
  }

  if (cards.length === 0) {
    throw new GenerationError('parse', 'OpenAI returned no usable card ideas. Try again.');
  }

  return cards;
}
