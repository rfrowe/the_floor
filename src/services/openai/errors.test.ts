/**
 * Tests for the typed error model.
 *
 * Covers the status→kind mapping (401/403→auth, 429→rateLimit, other→unknown),
 * connection failures → network vs. cors, bad JSON / parse errors passing
 * through, and the unknown fallback. No real network calls.
 */

import { describe, it, expect } from 'vitest';
import OpenAI from 'openai';
import { GenerationError, isGenerationError, toGenerationError } from './errors';

/**
 * Build a real APIError instance for a given status.
 *
 * `APIError.generate` only produces a status-bearing subclass when given
 * `headers`; with `undefined` headers it returns an APIConnectionError instead.
 */
function apiError(status: number): InstanceType<typeof OpenAI.APIError> {
  return OpenAI.APIError.generate(status, { error: { message: 'boom' } }, 'boom', new Headers());
}

describe('toGenerationError', () => {
  it('maps 401 to auth', () => {
    const err = toGenerationError(apiError(401));
    expect(err).toBeInstanceOf(GenerationError);
    expect(err.kind).toBe('auth');
    expect(err.message).toMatch(/key/i);
  });

  it('maps 403 to auth', () => {
    expect(toGenerationError(apiError(403)).kind).toBe('auth');
  });

  it('maps 429 to rateLimit', () => {
    const err = toGenerationError(apiError(429));
    expect(err.kind).toBe('rateLimit');
    expect(err.message).toMatch(/rate|quota/i);
  });

  it('maps other HTTP statuses (e.g. 500) to unknown', () => {
    expect(toGenerationError(apiError(500)).kind).toBe('unknown');
  });

  it('maps an SDK APIConnectionError to network', () => {
    const conn = new OpenAI.APIConnectionError({ message: 'connection refused' });
    expect(toGenerationError(conn).kind).toBe('network');
  });

  it('maps an APIConnectionError caused by a CORS-style TypeError to cors', () => {
    const conn = new OpenAI.APIConnectionError({
      message: 'connection error',
      cause: new TypeError('Failed to fetch'),
    });
    expect(toGenerationError(conn).kind).toBe('cors');
  });

  it('maps a bare "Failed to fetch" TypeError to cors', () => {
    expect(toGenerationError(new TypeError('Failed to fetch')).kind).toBe('cors');
  });

  it('maps a non-CORS TypeError to network', () => {
    expect(toGenerationError(new TypeError('something else broke')).kind).toBe('network');
  });

  it('passes a GenerationError through unchanged (parse stays parse)', () => {
    const original = new GenerationError('parse', 'bad shape');
    const result = toGenerationError(original);
    expect(result).toBe(original);
    expect(result.kind).toBe('parse');
  });

  it('falls back to unknown for arbitrary values', () => {
    expect(toGenerationError('a string').kind).toBe('unknown');
    expect(toGenerationError(new Error('plain')).kind).toBe('unknown');
    expect(toGenerationError(null).kind).toBe('unknown');
  });

  it('retains the original error as cause without exposing it as the message', () => {
    const source = apiError(401);
    const err = toGenerationError(source);
    expect(err.cause).toBe(source);
  });
});

describe('isGenerationError', () => {
  it('recognizes GenerationError instances', () => {
    expect(isGenerationError(new GenerationError('auth', 'x'))).toBe(true);
  });

  it('rejects non-GenerationError values', () => {
    expect(isGenerationError(new Error('x'))).toBe(false);
    expect(isGenerationError('x')).toBe(false);
    expect(isGenerationError(null)).toBe(false);
  });
});
