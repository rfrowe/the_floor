/**
 * Tests for generateCardIdeas.
 *
 * Mocks the `openai` SDK (canned structured JSON) and `nanoid` (deterministic
 * ids) so we can assert parsing/validation, id assignment, trimming, base URL
 * passthrough, and error mapping. No real network calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import OpenAI from 'openai';
import type { OpenAIConfig } from '@hooks/useCredentials';

const mockState: {
  createMock: ReturnType<typeof vi.fn>;
  constructorOptions: Record<string, unknown>[];
} = {
  createMock: vi.fn(),
  constructorOptions: [],
};

vi.mock('openai', async () => {
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

// Deterministic, incrementing ids.
let idCounter = 0;
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => `id-${String(idCounter++)}`),
}));

import { generateCardIdeas } from './cardIdeas';
import { resetOpenAIClient } from './client';

function chatResponse(content: string) {
  return { choices: [{ message: { content } }] };
}

function config(overrides: Partial<OpenAIConfig> = {}): OpenAIConfig {
  return { apiKey: 'sk-test', baseURL: '', imageSource: 'openai', ...overrides };
}

const SAMPLE = {
  cards: [
    {
      answer: 'The Terminator',
      imageKeywords: 'terminator 1984 cyborg',
      imagePrompt: 'a chrome humanoid endoskeleton, dramatic lighting',
    },
    {
      answer: 'RoboCop',
      imageKeywords: 'robocop detroit cyborg cop',
      imagePrompt: 'a sleek armored cybernetic police officer in a gritty city',
    },
  ],
};

describe('generateCardIdeas', () => {
  beforeEach(() => {
    mockState.createMock = vi.fn();
    mockState.constructorOptions.length = 0;
    idCounter = 0;
    resetOpenAIClient();
  });

  it('parses card ideas and assigns nanoid ids', async () => {
    mockState.createMock.mockResolvedValue(chatResponse(JSON.stringify(SAMPLE)));

    const cards = await generateCardIdeas(config(), 'Cyborgs', 2);
    expect(cards).toEqual([
      {
        id: 'id-0',
        answer: 'The Terminator',
        imageKeywords: 'terminator 1984 cyborg',
        imagePrompt: 'a chrome humanoid endoskeleton, dramatic lighting',
      },
      {
        id: 'id-1',
        answer: 'RoboCop',
        imageKeywords: 'robocop detroit cyborg cop',
        imagePrompt: 'a sleek armored cybernetic police officer in a gritty city',
      },
    ]);
  });

  it('trims fields and drops cards with a blank answer', async () => {
    mockState.createMock.mockResolvedValue(
      chatResponse(
        JSON.stringify({
          cards: [
            { answer: '  Spider-Man ', imageKeywords: ' web ', imagePrompt: ' a hero ' },
            { answer: '   ', imageKeywords: 'x', imagePrompt: 'y' },
          ],
        })
      )
    );

    const cards = await generateCardIdeas(config(), 'Heroes', 2);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      answer: 'Spider-Man',
      imageKeywords: 'web',
      imagePrompt: 'a hero',
    });
  });

  it('uses the card_ideas schema name and embeds the category in the prompt', async () => {
    mockState.createMock.mockResolvedValue(chatResponse(JSON.stringify(SAMPLE)));

    await generateCardIdeas(config(), 'Cryptids', 5);

    const params = mockState.createMock.mock.calls[0]?.[0] as {
      response_format: { json_schema: { name: string } };
      messages: { role: string; content: string }[];
    };
    expect(params.response_format.json_schema.name).toBe('card_ideas');
    const userMessage = params.messages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('Cryptids');
    expect(userMessage?.content).toContain('5');
  });

  it('passes a custom base URL through to the SDK', async () => {
    mockState.createMock.mockResolvedValue(chatResponse(JSON.stringify(SAMPLE)));
    await generateCardIdeas(config({ baseURL: 'https://proxy.example/v1' }), 'X', 1);
    expect(mockState.constructorOptions[0]?.['baseURL']).toBe('https://proxy.example/v1');
  });

  it('throws a parse GenerationError when the shape is wrong', async () => {
    mockState.createMock.mockResolvedValue(
      chatResponse(JSON.stringify({ cards: [{ answer: 'x' }] }))
    );
    await expect(generateCardIdeas(config(), 'X', 1)).rejects.toMatchObject({ kind: 'parse' });
  });

  it('maps a 429 SDK error to a rateLimit GenerationError', async () => {
    const apiError = OpenAI.APIError.generate(429, { error: {} }, 'slow down', new Headers());
    mockState.createMock.mockRejectedValue(apiError);
    await expect(generateCardIdeas(config(), 'X', 1)).rejects.toMatchObject({ kind: 'rateLimit' });
  });
});
