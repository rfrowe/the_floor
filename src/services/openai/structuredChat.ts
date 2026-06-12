/**
 * Structured-output chat helper.
 *
 * Issues a single chat completion constrained by a JSON Schema (OpenAI
 * Structured Outputs), parses `choices[0].message.content`, validates it with a
 * caller-supplied type guard, and returns the typed value. Every failure path —
 * transport, HTTP, malformed JSON, or shape mismatch — surfaces as a typed
 * {@link GenerationError}.
 *
 * Generators (`categoryNames`, `cardIdeas`, and Task 58's image helper layer on
 * top of this) provide the schema, the prompts, and a tight type guard.
 */

import { getOpenAI } from './client';
import { GenerationError, toGenerationError } from './errors';
import type { OpenAIConfig } from '@hooks/useCredentials';

/**
 * The default chat model. Kept as a single overridable constant so a model bump
 * is a one-line change (the PROMPT calls this out explicitly).
 */
export const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';

/** Arguments for {@link structuredChat}. */
export interface StructuredChatArgs<T> {
  /** Credentials used to build the client. */
  config: OpenAIConfig;
  /** System prompt establishing the task and constraints. */
  system: string;
  /** User prompt with the concrete request. */
  user: string;
  /**
   * The JSON Schema the response must satisfy. Structured Outputs requires an
   * object root, so list results must be wrapped (e.g. `{ items: [...] }`).
   */
  schema: Record<string, unknown>;
  /** Schema name (a-z, A-Z, 0-9, `_`, `-`; max 64 chars). */
  schemaName: string;
  /** Model override; defaults to {@link DEFAULT_CHAT_MODEL}. */
  model?: string;
  /** Type guard validating the parsed response is a `T`. */
  validate: (value: unknown) => value is T;
}

/**
 * Run a schema-constrained chat completion and return the validated result.
 *
 * @throws {GenerationError} `parse` for empty/malformed/mis-shaped responses;
 *   `auth` / `rateLimit` / `network` / `cors` / `unknown` for transport and HTTP
 *   failures (mapped by {@link toGenerationError}).
 */
export async function structuredChat<T>(args: StructuredChatArgs<T>): Promise<T> {
  try {
    const client = getOpenAI(args.config);

    const response = await client.chat.completions.create({
      model: args.model ?? DEFAULT_CHAT_MODEL,
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: args.schemaName,
          schema: args.schema,
          strict: true,
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (typeof content !== 'string' || content.length === 0) {
      throw new GenerationError('parse', 'OpenAI returned an empty response. Try again.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (jsonError) {
      throw new GenerationError('parse', 'OpenAI returned malformed JSON. Try again.', jsonError);
    }

    if (!args.validate(parsed)) {
      throw new GenerationError(
        'parse',
        'OpenAI returned an unexpected response shape. Try again.'
      );
    }

    return parsed;
  } catch (error) {
    // GenerationError (incl. the parse errors above) passes through unchanged;
    // SDK/transport errors are mapped to a typed kind.
    throw toGenerationError(error);
  }
}
