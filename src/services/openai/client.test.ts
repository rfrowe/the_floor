/**
 * Tests for the memoized OpenAI client factory.
 *
 * Verifies: a stable instance for identical config, re-creation when the key or
 * base URL changes, `baseURL: '' ` falling through to the SDK default, and a
 * custom base URL being passed through. The SDK is mocked so no client is ever
 * really constructed against the network.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { OpenAIConfig } from '@hooks/useCredentials';

// Capture constructor options without instantiating the real SDK.
const constructorCalls: Record<string, unknown>[] = [];

vi.mock('openai', () => {
  class MockOpenAI {
    options: Record<string, unknown>;
    constructor(options: Record<string, unknown>) {
      this.options = options;
      constructorCalls.push(options);
    }
  }
  return { default: MockOpenAI };
});

import { getOpenAI, resetOpenAIClient } from './client';

function config(overrides: Partial<OpenAIConfig> = {}): OpenAIConfig {
  return { apiKey: 'sk-test', baseURL: '', imageSource: 'openai', ...overrides };
}

describe('getOpenAI', () => {
  beforeEach(() => {
    constructorCalls.length = 0;
    resetOpenAIClient();
  });

  it('memoizes the client for identical config', () => {
    const a = getOpenAI(config());
    const b = getOpenAI(config());
    expect(a).toBe(b);
    expect(constructorCalls).toHaveLength(1);
  });

  it('re-creates the client when the key changes', () => {
    const a = getOpenAI(config({ apiKey: 'sk-one' }));
    const b = getOpenAI(config({ apiKey: 'sk-two' }));
    expect(a).not.toBe(b);
    expect(constructorCalls).toHaveLength(2);
  });

  it('re-creates the client when the base URL changes', () => {
    getOpenAI(config({ baseURL: '' }));
    getOpenAI(config({ baseURL: 'https://proxy.example/v1' }));
    expect(constructorCalls).toHaveLength(2);
  });

  it('passes baseURL: undefined when the config base URL is empty', () => {
    getOpenAI(config({ baseURL: '' }));
    expect(constructorCalls[0]?.['baseURL']).toBeUndefined();
  });

  it('passes through a custom base URL', () => {
    getOpenAI(config({ baseURL: 'https://proxy.example/v1' }));
    expect(constructorCalls[0]?.['baseURL']).toBe('https://proxy.example/v1');
  });

  it('always enables browser usage and forwards the key', () => {
    getOpenAI(config({ apiKey: 'sk-abc' }));
    expect(constructorCalls[0]?.['dangerouslyAllowBrowser']).toBe(true);
    expect(constructorCalls[0]?.['apiKey']).toBe('sk-abc');
  });
});
