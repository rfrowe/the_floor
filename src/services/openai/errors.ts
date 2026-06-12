/**
 * Typed error model for the OpenAI service layer.
 *
 * Every failure surfaced to the Studio UI is a {@link GenerationError} carrying a
 * discriminating {@link GenerationErrorKind} and a user-facing `message`. The UI
 * (Tasks 54/56/57/58) keys off `kind` to decide whether to offer a retry, prompt
 * the user to re-check their key, or explain a CORS/network problem.
 *
 * SECURITY: error mapping NEVER includes the API key in the message or `cause`.
 */

import OpenAI from 'openai';

/**
 * The discriminating cause of a {@link GenerationError}.
 *
 * - `auth`      — 401/403: missing, invalid, or unauthorized key.
 * - `rateLimit` — 429: too many requests / quota exceeded.
 * - `network`   — the request never reached a server (offline, DNS, refused).
 * - `cors`      — a browser CORS block (common with custom base URLs that don't
 *                 send permissive `Access-Control-Allow-Origin` headers). The
 *                 browser reports these as opaque network failures, so we treat a
 *                 likely-CORS connection failure distinctly so the UI can advise.
 * - `parse`     — the response arrived but did not match the expected shape.
 * - `unknown`   — anything else (4xx/5xx without a more specific mapping).
 */
export type GenerationErrorKind = 'auth' | 'rateLimit' | 'network' | 'cors' | 'parse' | 'unknown';

/**
 * A typed, user-presentable error from the OpenAI service layer.
 *
 * `message` is safe to render directly in the UI. `cause` retains the original
 * thrown value for debugging but is never the place the key would appear (the SDK
 * does not echo the key in its errors).
 */
export class GenerationError extends Error {
  /** Discriminating cause; the UI keys retry/advice off this. */
  readonly kind: GenerationErrorKind;

  /** The originating error, if any (retained for debugging, not for display). */
  override readonly cause: unknown;

  constructor(kind: GenerationErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = 'GenerationError';
    this.kind = kind;
    this.cause = cause;
    // Restore the prototype chain so `instanceof GenerationError` works even
    // after transpilation to older targets.
    Object.setPrototypeOf(this, GenerationError.prototype);
  }
}

/** Type guard: is this value already a {@link GenerationError}? */
export function isGenerationError(value: unknown): value is GenerationError {
  return value instanceof GenerationError;
}

/** User-facing copy for each error kind. Kept terse and actionable. */
const KIND_MESSAGES: Record<GenerationErrorKind, string> = {
  auth: 'Your OpenAI API key was rejected. Check the key (and base URL) and try again.',
  rateLimit:
    'OpenAI is rate-limiting requests or your quota is exhausted. Wait a moment and retry.',
  network: 'Could not reach OpenAI. Check your connection and try again.',
  cors:
    'The request was blocked by the browser (CORS). Your custom base URL may not allow ' +
    'browser requests from this site.',
  parse: 'OpenAI returned an unexpected response. Try again.',
  unknown: 'Something went wrong talking to OpenAI. Try again.',
};

/** Map an {@link OpenAI.APIError} HTTP status to a {@link GenerationErrorKind}. */
function kindFromStatus(status: number | undefined): GenerationErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rateLimit';
  return 'unknown';
}

/**
 * Heuristic: does this connection failure smell like a browser CORS block rather
 * than a plain offline/refused connection?
 *
 * Browsers surface CORS rejections to `fetch` as an opaque `TypeError: Failed to
 * fetch` with no status, indistinguishable at the JS level from a true network
 * failure. We can't be certain, so we lean on the message text: a `TypeError`
 * whose message mentions CORS, or a generic "Failed to fetch" / "Load failed",
 * is reported as `cors` so the UI can advise on the most common custom-base-URL
 * pitfall; everything else stays `network`.
 */
function looksLikeCors(value: unknown): boolean {
  if (!(value instanceof TypeError)) return false;
  const message = value.message.toLowerCase();
  return (
    message.includes('cors') ||
    message.includes('failed to fetch') ||
    message.includes('load failed') ||
    message.includes('networkerror when attempting to fetch')
  );
}

/**
 * Normalize any thrown value into a {@link GenerationError}.
 *
 * - A {@link GenerationError} passes through unchanged (so `parse` errors raised
 *   inside `structuredChat` keep their kind).
 * - An {@link OpenAI.APIConnectionError} (or a raw `TypeError`) becomes `network`
 *   — or `cors` when it looks like a browser CORS block.
 * - An {@link OpenAI.APIError} maps via its HTTP `status` (401/403→auth,
 *   429→rateLimit, otherwise unknown).
 * - Anything else becomes `unknown`.
 *
 * Never logs and never embeds the API key.
 */
export function toGenerationError(value: unknown): GenerationError {
  if (isGenerationError(value)) return value;

  // Connection-level failures (the request never got a response). The SDK wraps
  // these as APIConnectionError with the original fetch error on `.cause`.
  if (value instanceof OpenAI.APIConnectionError) {
    const kind: GenerationErrorKind = looksLikeCors(value.cause) ? 'cors' : 'network';
    return new GenerationError(kind, KIND_MESSAGES[kind], value);
  }

  // HTTP-level API errors carry a status we can map. `APIError` is generic, so
  // narrow `status` to a number ourselves rather than trusting the (loosely
  // typed) property.
  if (value instanceof OpenAI.APIError) {
    const status = typeof value.status === 'number' ? value.status : undefined;
    const kind = kindFromStatus(status);
    return new GenerationError(kind, KIND_MESSAGES[kind], value);
  }

  // A bare fetch rejection (e.g. when mocking `global.fetch`, or outside the SDK's
  // own wrapping) — most often a network/CORS failure in the browser.
  if (value instanceof TypeError) {
    const kind: GenerationErrorKind = looksLikeCors(value) ? 'cors' : 'network';
    return new GenerationError(kind, KIND_MESSAGES[kind], value);
  }

  return new GenerationError('unknown', KIND_MESSAGES.unknown, value);
}
