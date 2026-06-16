/**
 * Tests for the structuredChat request shaping that the generators rely on.
 *
 * Focuses on the sampling-parameter plumbing added for generation variety: the
 * `temperature` default + override, and the *conditional* `top_p` passthrough
 * (only sent when the caller asks for it, so the server default otherwise
 * stands). The `openai` SDK is mocked — no real network calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { OpenAIConfig } from '@hooks/useCredentials';

const mockState: {
  createMock: ReturnType<typeof vi.fn>;
} = {
  createMock: vi.fn(),
};

vi.mock('openai', async () => {
  const actual = await vi.importActual<typeof import('openai')>('openai');
  class MockOpenAI {
    chat: { completions: { create: ReturnType<typeof vi.fn> } };
    constructor() {
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

import { structuredChat, DEFAULT_TEMPERATURE } from './structuredChat';
import { resetOpenAIClient } from './client';

function chatResponse(content: string) {
  return { choices: [{ message: { content } }] };
}

function config(): OpenAIConfig {
  return { apiKey: 'sk-test', baseURL: '', imageSource: 'openai' };
}

const SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['value'],
  properties: { value: { type: 'string' } },
};

interface Box {
  value: string;
}
function isBox(v: unknown): v is Box {
  return typeof v === 'object' && v !== null && typeof (v as { value: unknown }).value === 'string';
}

async function run(args: {
  temperature?: number;
  topP?: number;
}): Promise<Record<string, unknown>> {
  mockState.createMock.mockResolvedValue(chatResponse(JSON.stringify({ value: 'ok' })));
  await structuredChat<Box>({
    config: config(),
    schemaName: 'box',
    schema: SCHEMA,
    validate: isBox,
    system: 'sys',
    user: 'usr',
    ...args,
  });
  return mockState.createMock.mock.calls[0]?.[0] as Record<string, unknown>;
}

describe('structuredChat sampling parameters', () => {
  beforeEach(() => {
    mockState.createMock = vi.fn();
    resetOpenAIClient();
  });

  it('sends the default temperature when none is provided', async () => {
    const params = await run({});
    expect(params['temperature']).toBe(DEFAULT_TEMPERATURE);
  });

  it('threads an explicit temperature through to the chat call', async () => {
    const params = await run({ temperature: 1.05 });
    expect(params['temperature']).toBe(1.05);
  });

  it('omits top_p when the caller does not provide it', async () => {
    const params = await run({});
    expect('top_p' in params).toBe(false);
  });

  it('passes top_p through only when provided', async () => {
    const params = await run({ topP: 0.8 });
    expect(params['top_p']).toBe(0.8);
  });
});
