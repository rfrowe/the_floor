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
      description: 'Distinct card ideas for the category.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['answer', 'imageKeywords', 'imagePrompt'],
        properties: {
          answer: {
            type: 'string',
            description: 'The correct guess for this card (e.g. "The Terminator").',
          },
          imageKeywords: {
            type: 'string',
            description: 'Space-separated search keywords describing the subject.',
          },
          imagePrompt: {
            type: 'string',
            description:
              'A vivid image-generation prompt that makes the subject a recognizable clue ' +
              'WITHOUT spelling out the answer in any on-image text.',
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
  'You draft card ideas for a fast-paced picture-guessing game show.',
  'Each card is one concrete, well-known subject within the given category that a',
  'contestant could guess from a single image. For each card provide:',
  '"answer" (the correct guess), "imageKeywords" (space-separated search terms), and',
  '"imagePrompt" (a vivid prompt that makes the subject a recognizable visual clue',
  'WITHOUT rendering the answer as text on the image).',
  'Keep answers distinct, varied, and broadly recognizable.',
].join(' ');

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
    user: `Category: "${trimmedName}". Generate ${String(requested)} distinct card ideas.`,
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
