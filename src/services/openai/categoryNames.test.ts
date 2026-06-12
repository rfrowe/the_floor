/**
 * Tests for generateCategoryNames + the structuredChat plumbing it relies on.
 *
 * The `openai` SDK is mocked so the chat completion returns canned JSON. Asserts
 * correct parsing/validation of structured output, de-dup + trim behavior, base
 * URL passthrough (set vs. default), and error mapping for malformed responses
 * and SDK errors. No real network calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import OpenAI from 'openai';
import type { OpenAIConfig } from '@hooks/useCredentials';

// Mutable mock controls (populated per test before the import runs the SDK).
const mockState: {
  createMock: ReturnType<typeof vi.fn>;
  constructorOptions: Record<string, unknown>[];
} = {
  createMock: vi.fn(),
  constructorOptions: [],
};

vi.mock('openai', async () => {
  // Pull the real error classes so toGenerationError's instanceof checks work.
  const actual = await vi.importActual<typeof import('openai')>('openai');
  class MockOpenAI {
    chat: { completions: { create: ReturnType<typeof vi.fn> } };
    constructor(options: Record<string, unknown>) {
      mockState.constructorOptions.push(options);
      this.chat = { completions: { create: mockState.createMock } };
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

import { generateCategoryNames } from './categoryNames';
import { resetOpenAIClient } from './client';
import { GenerationError } from './errors';

/** Shape a chat-completion response with the given JSON content string. */
function chatResponse(content: string) {
  return { choices: [{ message: { content } }] };
}

function config(overrides: Partial<OpenAIConfig> = {}): OpenAIConfig {
  return { apiKey: 'sk-test', baseURL: '', imageSource: 'openai', ...overrides };
}

describe('generateCategoryNames', () => {
  beforeEach(() => {
    mockState.createMock = vi.fn();
    mockState.constructorOptions.length = 0;
    resetOpenAIClient();
  });

  it('parses structured names and returns them in order', async () => {
    mockState.createMock.mockResolvedValue(
      chatResponse(JSON.stringify({ names: ['Cryptids', 'World Capitals', 'Mascots'] }))
    );

    const names = await generateCategoryNames(config(), 3);
    expect(names).toEqual(['Cryptids', 'World Capitals', 'Mascots']);
  });

  it('trims and de-dups case-insensitively, dropping blanks', async () => {
    mockState.createMock.mockResolvedValue(
      chatResponse(JSON.stringify({ names: ['  Cryptids ', 'cryptids', '', '   ', 'Mascots'] }))
    );

    const names = await generateCategoryNames(config(), 5);
    expect(names).toEqual(['Cryptids', 'Mascots']);
  });

  it('sends the json_schema response_format and default model', async () => {
    mockState.createMock.mockResolvedValue(chatResponse(JSON.stringify({ names: ['A'] })));

    await generateCategoryNames(config(), 1);

    const firstCall = mockState.createMock.mock.calls[0];
    const params = firstCall?.[0] as {
      model: string;
      response_format: { type: string; json_schema: { name: string; strict: boolean } };
    };
    expect(params.model).toBe('gpt-4o-mini');
    expect(params.response_format.type).toBe('json_schema');
    expect(params.response_format.json_schema.name).toBe('category_names');
    expect(params.response_format.json_schema.strict).toBe(true);
  });

  it('passes baseURL: undefined to the SDK when the config base URL is empty', async () => {
    mockState.createMock.mockResolvedValue(chatResponse(JSON.stringify({ names: ['A'] })));
    await generateCategoryNames(config({ baseURL: '' }), 1);
    expect(mockState.constructorOptions[0]?.['baseURL']).toBeUndefined();
  });

  it('passes a custom base URL through to the SDK', async () => {
    mockState.createMock.mockResolvedValue(chatResponse(JSON.stringify({ names: ['A'] })));
    await generateCategoryNames(config({ baseURL: 'https://proxy.example/v1' }), 1);
    expect(mockState.constructorOptions[0]?.['baseURL']).toBe('https://proxy.example/v1');
  });

  it('throws a parse GenerationError on malformed JSON', async () => {
    mockState.createMock.mockResolvedValue(chatResponse('not json {'));
    await expect(generateCategoryNames(config(), 1)).rejects.toMatchObject({
      kind: 'parse',
    });
  });

  it('throws a parse GenerationError when the shape is wrong', async () => {
    mockState.createMock.mockResolvedValue(chatResponse(JSON.stringify({ names: [1, 2, 3] })));
    await expect(generateCategoryNames(config(), 1)).rejects.toBeInstanceOf(GenerationError);
  });

  it('throws a parse GenerationError when no usable names come back', async () => {
    mockState.createMock.mockResolvedValue(chatResponse(JSON.stringify({ names: ['', '  '] })));
    await expect(generateCategoryNames(config(), 2)).rejects.toMatchObject({ kind: 'parse' });
  });

  it('maps a 401 SDK error to an auth GenerationError', async () => {
    const apiError = OpenAI.APIError.generate(401, { error: {} }, 'unauthorized', new Headers());
    mockState.createMock.mockRejectedValue(apiError);
    await expect(generateCategoryNames(config(), 1)).rejects.toMatchObject({ kind: 'auth' });
  });
});
