/**
 * Tests for the useCredentials hook.
 *
 * Credentials are ephemeral: held in a module-level in-memory store and NEVER
 * persisted. These cover set/get key + base URL, the `isConfigured` derivation
 * (including whitespace-only → false), `clear()`, that the store is shared across
 * consumers, and — critically — that nothing is written to any browser storage.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCredentials, DEFAULT_CREDENTIALS, __resetCredentialsForTest } from './useCredentials';

/** The key the old localStorage-backed implementation used, for the no-leak assertion. */
const LEGACY_FULL_KEY = 'the-floor:studio:openai';

describe('useCredentials', () => {
  beforeEach(() => {
    __resetCredentialsForTest();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    __resetCredentialsForTest();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('initializes with blank defaults and isConfigured false', () => {
    const { result } = renderHook(() => useCredentials());
    const [config, actions] = result.current;

    expect(config).toEqual(DEFAULT_CREDENTIALS);
    expect(config.imageSource).toBe('openai');
    expect(actions.isConfigured).toBe(false);
  });

  it('setKey updates the key and flips isConfigured', () => {
    const { result } = renderHook(() => useCredentials());

    act(() => {
      result.current[1].setKey('sk-abc123');
    });

    expect(result.current[0].apiKey).toBe('sk-abc123');
    expect(result.current[1].isConfigured).toBe(true);
    // Other fields are preserved.
    expect(result.current[0].imageSource).toBe('openai');
    expect(result.current[0].baseURL).toBe('');
  });

  it('setBaseURL updates the base URL without affecting the key', () => {
    const { result } = renderHook(() => useCredentials());

    act(() => {
      result.current[1].setKey('sk-key');
    });
    act(() => {
      result.current[1].setBaseURL('https://custom.example/v1');
    });

    expect(result.current[0].baseURL).toBe('https://custom.example/v1');
    expect(result.current[0].apiKey).toBe('sk-key');
  });

  it('treats a whitespace-only key as not configured', () => {
    const { result } = renderHook(() => useCredentials());

    act(() => {
      result.current[1].setKey('   ');
    });

    expect(result.current[0].apiKey).toBe('   ');
    expect(result.current[1].isConfigured).toBe(false);
  });

  it('clear() resets to defaults', () => {
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
  });

  it('shares one in-memory value across all consumers', () => {
    const a = renderHook(() => useCredentials());
    const b = renderHook(() => useCredentials());

    act(() => {
      a.result.current[1].setKey('sk-shared');
    });

    // The second, independently-mounted consumer sees the same value.
    expect(b.result.current[0].apiKey).toBe('sk-shared');
    expect(b.result.current[1].isConfigured).toBe(true);
  });

  it('starts blank again after a store reset (mimics a page refresh)', () => {
    const first = renderHook(() => useCredentials());
    act(() => {
      first.result.current[1].setKey('sk-gone-on-refresh');
    });
    expect(first.result.current[1].isConfigured).toBe(true);

    // Resetting the module store mimics the in-memory value being discarded on
    // refresh / tab close; a fresh consumer must come up unconfigured.
    act(() => {
      __resetCredentialsForTest();
    });
    const fresh = renderHook(() => useCredentials());
    expect(fresh.result.current[0]).toEqual(DEFAULT_CREDENTIALS);
    expect(fresh.result.current[1].isConfigured).toBe(false);
  });

  it('never persists the credentials to any browser storage', () => {
    const { result } = renderHook(() => useCredentials());

    act(() => {
      result.current[1].setKey('sk-must-not-persist');
      result.current[1].setBaseURL('https://proxy.example/v1');
    });

    // Nothing under the legacy key, and no storage entry contains the key at all.
    expect(localStorage.getItem(LEGACY_FULL_KEY)).toBeNull();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);

    const allLocal = Object.keys(localStorage).map((k) => localStorage.getItem(k) ?? '');
    const allSession = Object.keys(sessionStorage).map((k) => sessionStorage.getItem(k) ?? '');
    expect([...allLocal, ...allSession].join('|')).not.toContain('sk-must-not-persist');

    // clear() likewise writes nothing.
    act(() => {
      result.current[1].clear();
    });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
