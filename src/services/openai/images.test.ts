/**
 * Tests for generateImage + buildImagePrompt.
 *
 * The `openai` SDK is mocked so `images.generate` returns canned base64. Asserts
 * the request shape (model `gpt-image-1`, size, and the appended quality
 * suffix), base64 → `data:` URL conversion, base-URL passthrough, and error
 * mapping (empty response → parse; 401 → auth) via toGenerationError. No real
 * network calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import OpenAI from 'openai';
import type { OpenAIConfig } from '@hooks/useCredentials';

// Mutable mock controls (populated per test before the import runs the SDK).
const mockState: {
  generateMock: ReturnType<typeof vi.fn>;
  constructorOptions: Record<string, unknown>[];
} = {
  generateMock: vi.fn(),
  constructorOptions: [],
};

vi.mock('openai', async () => {
  // Pull the real error classes so toGenerationError's instanceof checks work.
  const actual = await vi.importActual<typeof import('openai')>('openai');
  class MockOpenAI {
    images: { generate: ReturnType<typeof vi.fn> };
    constructor(options: Record<string, unknown>) {
      mockState.constructorOptions.push(options);
      this.images = { generate: mockState.generateMock };
    }
  }
  return {
    ...actual,
    default: Object.assign(MockOpenAI, {
      APIError: actual.default.APIError,
      APIConnectionError: actual.default.APIConnectionError,
    }),
  };
});

import { generateImage, buildImagePrompt, QUALITY_SUFFIX } from './images';
import { resetOpenAIClient } from './client';
import { GenerationError } from './errors';

/** Shape an images.generate response with a single base64 image. */
function imageResponse(b64: string) {
  return { created: 0, data: [{ b64_json: b64 }] };
}

function config(overrides: Partial<OpenAIConfig> = {}): OpenAIConfig {
  return { apiKey: 'sk-test', baseURL: '', imageSource: 'openai', ...overrides };
}

describe('buildImagePrompt', () => {
  it('appends the quality suffix to a non-empty prompt', () => {
    const built = buildImagePrompt('a golden retriever');
    expect(built).toBe(`a golden retriever ${QUALITY_SUFFIX}`);
  });

  it('trims the base prompt before appending', () => {
    expect(buildImagePrompt('  a cat  ')).toBe(`a cat ${QUALITY_SUFFIX}`);
  });

  it('falls back to just the suffix for a blank prompt', () => {
    expect(buildImagePrompt('   ')).toBe(QUALITY_SUFFIX);
  });

  it('does NOT forbid text or logos (the censor step hides giveaways)', () => {
    const lower = QUALITY_SUFFIX.toLowerCase();
    expect(lower).not.toContain('no text');
    expect(lower).not.toContain('watermark');
    expect(lower).not.toContain('logo');
  });
});

describe('generateImage', () => {
  beforeEach(() => {
    mockState.generateMock = vi.fn();
    mockState.constructorOptions.length = 0;
    resetOpenAIClient();
  });

  it('returns a PNG data URL built from the returned base64', async () => {
    mockState.generateMock.mockResolvedValue(imageResponse('QUJD'));
    const url = await generateImage('a red fox', config());
    expect(url).toBe('data:image/png;base64,QUJD');
  });

  it('requests gpt-image-1 at 1024x1024 with the quality suffix appended', async () => {
    mockState.generateMock.mockResolvedValue(imageResponse('QUJD'));
    await generateImage('a red fox', config());

    const firstCall = mockState.generateMock.mock.calls[0];
    const params = firstCall?.[0] as { model: string; prompt: string; size: string };
    expect(params.model).toBe('gpt-image-1');
    expect(params.size).toBe('1024x1024');
    expect(params.prompt).toBe(`a red fox ${QUALITY_SUFFIX}`);
    // The suffix must NOT smuggle back a no-text ban.
    expect(params.prompt.toLowerCase()).not.toContain('no text');
  });

  it('passes baseURL: undefined to the SDK when the config base URL is empty', async () => {
    mockState.generateMock.mockResolvedValue(imageResponse('QUJD'));
    await generateImage('a red fox', config({ baseURL: '' }));
    expect(mockState.constructorOptions[0]?.['baseURL']).toBeUndefined();
  });

  it('passes a custom base URL through to the SDK', async () => {
    mockState.generateMock.mockResolvedValue(imageResponse('QUJD'));
    await generateImage('a red fox', config({ baseURL: 'https://proxy.example/v1' }));
    expect(mockState.constructorOptions[0]?.['baseURL']).toBe('https://proxy.example/v1');
  });

  it('throws a parse GenerationError when no image data comes back', async () => {
    mockState.generateMock.mockResolvedValue({ created: 0, data: [] });
    await expect(generateImage('x', config())).rejects.toMatchObject({ kind: 'parse' });
  });

  it('throws a parse GenerationError when b64_json is missing', async () => {
    mockState.generateMock.mockResolvedValue({ created: 0, data: [{ revised_prompt: 'x' }] });
    await expect(generateImage('x', config())).rejects.toBeInstanceOf(GenerationError);
  });

  it('maps a 401 SDK error to an auth GenerationError', async () => {
    const apiError = OpenAI.APIError.generate(401, { error: {} }, 'unauthorized', new Headers());
    mockState.generateMock.mockRejectedValue(apiError);
    await expect(generateImage('x', config())).rejects.toMatchObject({ kind: 'auth' });
  });

  it('maps a 429 SDK error to a rateLimit GenerationError', async () => {
    const apiError = OpenAI.APIError.generate(429, { error: {} }, 'slow down', new Headers());
    mockState.generateMock.mockRejectedValue(apiError);
    await expect(generateImage('x', config())).rejects.toMatchObject({ kind: 'rateLimit' });
  });
});
