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

/**
 * The image-generation model used by {@link generateImage} (Task 58). Kept here
 * alongside {@link DEFAULT_CHAT_MODEL} so all OpenAI model identifiers live in
 * one place and a bump is a single-line change (never hardcoded per call site).
 */
export const DEFAULT_IMAGE_MODEL = 'gpt-image-1';

/**
 * Sampling temperature used when the caller does not pass one. OpenAI's own
 * default for chat completions is `1`; we mirror that so a generator that wants
 * variety can simply omit `temperature` (or pass its own, e.g.
 * {@link NAMES_TEMPERATURE}) without us silently flattening the distribution.
 *
 * NOTE on the "always Fruits!" bug: this helper previously sent NO temperature
 * at all, which is fine — the SDK applies the server default of `1`. The real
 * culprit for repetition was that, even at temperature 1, `gpt-4o-mini` under a
 * tight JSON schema and a *fixed* prompt keeps returning the same modal ordering
 * (its single most-likely first pick), and the batched generator always shows
 * `buffer[0]`. The fix is two-fold: a higher temperature for *names* plus
 * prompt-level diversity nudges and in-batch shuffling (see `categoryNames.ts`).
 */
export const DEFAULT_TEMPERATURE = 1;

/**
 * Higher sampling temperature for category-name generation. Names are short and
 * the schema is tiny, so the model collapses hard onto its single favorite
 * ("Fruits!") at the default. Nudging temperature up de-correlates batches
 * run-to-run while staying well inside the range that keeps the JSON-schema
 * structured output valid (we stay <= ~1.1; cranking past that starts to corrupt
 * structure and degrade quality). Card ideas keep the default — there the
 * category name already varies the prompt enough.
 */
export const NAMES_TEMPERATURE = 1.05;

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
  /**
   * Sampling temperature (0–2). Higher = more varied output. Defaults to
   * {@link DEFAULT_TEMPERATURE}. Threaded straight through to the chat call so a
   * generator can dial in variety (names) or determinism without flattening every
   * caller. Structured-output validity holds across this range.
   */
  temperature?: number;
  /**
   * Nucleus-sampling cutoff (0–1). Passed through only when provided; otherwise
   * the server default applies. Prefer tuning {@link StructuredChatArgs.temperature}
   * over `top_p` (OpenAI advises against changing both at once).
   */
  topP?: number;
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
      temperature: args.temperature ?? DEFAULT_TEMPERATURE,
      // Only set top_p when a caller asks for it; omitting it lets the server
      // default stand (and avoids tuning temperature and top_p together).
      ...(args.topP !== undefined ? { top_p: args.topP } : {}),
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
