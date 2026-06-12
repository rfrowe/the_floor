/**
 * Tests for validateCredentials — the lightweight key probe.
 *
 * Mocks the `openai` SDK so `models.list()` can resolve or reject. Asserts the
 * probe uses models.list (no chat/completion call), resolves on success, and
 * throws the correctly-typed GenerationError on auth / network failures. No real
 * network calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import OpenAI from 'openai';
import type { OpenAIConfig } from '@hooks/useCredentials';

const mockState: {
  listMock: ReturnType<typeof vi.fn>;
  createMock: ReturnType<typeof vi.fn>;
  constructorOptions: Record<string, unknown>[];
} = {
  listMock: vi.fn(),
  createMock: vi.fn(),
  constructorOptions: [],
};

vi.mock('openai', async () => {
  const actual = await vi.importActual<typeof import('openai')>('openai');
  class MockOpenAI {
    models: { list: ReturnType<typeof vi.fn> };
    chat: { completions: { create: ReturnType<typeof vi.fn> } };
    constructor(options: Record<string, unknown>) {
      mockState.constructorOptions.push(options);
      this.models = { list: mockState.listMock };
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

import { validateCredentials } from './validate';
import { resetOpenAIClient } from './client';
import { GenerationError } from './errors';

function config(overrides: Partial<OpenAIConfig> = {}): OpenAIConfig {
  return { apiKey: 'sk-test', baseURL: '', imageSource: 'openai', ...overrides };
}

describe('validateCredentials', () => {
  beforeEach(() => {
    mockState.listMock = vi.fn();
    mockState.createMock = vi.fn();
    mockState.constructorOptions.length = 0;
    resetOpenAIClient();
  });

  it('resolves on a successful models.list (no completion call)', async () => {
    mockState.listMock.mockResolvedValue({ data: [] });
    await expect(validateCredentials(config())).resolves.toBeUndefined();
    expect(mockState.listMock).toHaveBeenCalledTimes(1);
    expect(mockState.createMock).not.toHaveBeenCalled();
  });

  it('passes a custom base URL through when validating', async () => {
    mockState.listMock.mockResolvedValue({ data: [] });
    await validateCredentials(config({ baseURL: 'https://proxy.example/v1' }));
    expect(mockState.constructorOptions[0]?.['baseURL']).toBe('https://proxy.example/v1');
  });

  it('throws an auth GenerationError on a 401', async () => {
    const apiError = OpenAI.APIError.generate(401, { error: {} }, 'unauthorized', new Headers());
    mockState.listMock.mockRejectedValue(apiError);

    const error = await validateCredentials(config()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GenerationError);
    expect(error instanceof GenerationError ? error.kind : 'not-a-generation-error').toBe('auth');
  });

  it('throws a network GenerationError on a connection failure', async () => {
    mockState.listMock.mockRejectedValue(new OpenAI.APIConnectionError({ message: 'down' }));
    await expect(validateCredentials(config())).rejects.toMatchObject({ kind: 'network' });
  });

  it('throws a cors GenerationError on a "Failed to fetch" rejection', async () => {
    mockState.listMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(validateCredentials(config())).rejects.toMatchObject({ kind: 'cors' });
  });
});
