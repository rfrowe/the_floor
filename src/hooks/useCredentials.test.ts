/**
 * Tests for the useCredentials hook.
 *
 * Mirrors the useLocalStorage test patterns: set/get key + base URL, the
 * `isConfigured` derivation, `clear()`, and cross-tab `storage`-event sync.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useCredentials,
  CREDENTIALS_STORAGE_KEY,
  DEFAULT_CREDENTIALS,
  type OpenAIConfig,
} from './useCredentials';

const FULL_KEY = `the-floor:${CREDENTIALS_STORAGE_KEY}`;

function readStored(): OpenAIConfig | null {
  const raw = localStorage.getItem(FULL_KEY);
  return raw === null ? null : (JSON.parse(raw) as OpenAIConfig);
}

describe('useCredentials', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with blank defaults and isConfigured false', () => {
    const { result } = renderHook(() => useCredentials());
    const [config, actions] = result.current;

    expect(config).toEqual(DEFAULT_CREDENTIALS);
    expect(config.imageSource).toBe('openai');
    expect(actions.isConfigured).toBe(false);
  });

  it('hydrates from an existing stored config', () => {
    const stored: OpenAIConfig = {
      apiKey: 'sk-existing',
      baseURL: 'https://proxy.example/v1',
      imageSource: 'openai',
    };
    localStorage.setItem(FULL_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useCredentials());
    const [config, actions] = result.current;

    expect(config).toEqual(stored);
    expect(actions.isConfigured).toBe(true);
  });

  it('setKey persists the key and flips isConfigured', () => {
    const { result } = renderHook(() => useCredentials());

    act(() => {
      result.current[1].setKey('sk-abc123');
    });

    expect(result.current[0].apiKey).toBe('sk-abc123');
    expect(result.current[1].isConfigured).toBe(true);
    expect(readStored()?.apiKey).toBe('sk-abc123');
    // Other fields are preserved.
    expect(result.current[0].imageSource).toBe('openai');
    expect(result.current[0].baseURL).toBe('');
  });

  it('setBaseURL persists the base URL without affecting the key', () => {
    const { result } = renderHook(() => useCredentials());

    act(() => {
      result.current[1].setKey('sk-key');
    });
    act(() => {
      result.current[1].setBaseURL('https://custom.example/v1');
    });

    expect(result.current[0].baseURL).toBe('https://custom.example/v1');
    expect(result.current[0].apiKey).toBe('sk-key');
    expect(readStored()?.baseURL).toBe('https://custom.example/v1');
  });

  it('treats a whitespace-only key as not configured', () => {
    const { result } = renderHook(() => useCredentials());

    act(() => {
      result.current[1].setKey('   ');
    });

    expect(result.current[1].isConfigured).toBe(false);
  });

  it('clear() resets to defaults and persists the reset', () => {
    const { result } = renderHook(() => useCredentials());

    act(() => {
      result.current[1].setKey('sk-to-clear');
      result.current[1].setBaseURL('https://x/v1');
    });
    expect(result.current[1].isConfigured).toBe(true);

    act(() => {
      result.current[1].clear();
    });

    expect(result.current[0]).toEqual(DEFAULT_CREDENTIALS);
    expect(result.current[1].isConfigured).toBe(false);
    expect(readStored()).toEqual(DEFAULT_CREDENTIALS);
  });

  it('syncs from a storage event fired by another tab', () => {
    const { result } = renderHook(() => useCredentials());
    expect(result.current[1].isConfigured).toBe(false);

    const fromOtherTab: OpenAIConfig = {
      apiKey: 'sk-from-other-tab',
      baseURL: '',
      imageSource: 'openai',
    };

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: FULL_KEY,
          newValue: JSON.stringify(fromOtherTab),
          storageArea: localStorage,
        })
      );
    });

    expect(result.current[0]).toEqual(fromOtherTab);
    expect(result.current[1].isConfigured).toBe(true);
  });
});
