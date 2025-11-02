/**
 * Tests for resetApp utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetAppState } from './resetApp';
import * as indexedDB from '@/storage/indexedDB';
import * as localStorage from '@/storage/localStorage';

describe('resetAppState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear both IndexedDB and localStorage', async () => {
    const clearContestantsSpy = vi.spyOn(indexedDB, 'clearAllContestants').mockResolvedValue();
    const clearLocalStorageSpy = vi
      .spyOn(localStorage, 'clear')
      .mockImplementation(() => undefined);

    await resetAppState();

    expect(clearContestantsSpy).toHaveBeenCalledOnce();
    expect(clearLocalStorageSpy).toHaveBeenCalledOnce();
  });

  it('should throw error if IndexedDB clear fails', async () => {
    const error = new Error('IndexedDB error');
    vi.spyOn(indexedDB, 'clearAllContestants').mockRejectedValue(error);
    vi.spyOn(localStorage, 'clear').mockImplementation(() => undefined);

    await expect(resetAppState()).rejects.toThrow('Failed to reset application state');
  });

  it('should throw error if localStorage clear fails', async () => {
    vi.spyOn(indexedDB, 'clearAllContestants').mockResolvedValue();
    vi.spyOn(localStorage, 'clear').mockImplementation(() => {
      throw new Error('localStorage error');
    });

    await expect(resetAppState()).rejects.toThrow('Failed to reset application state');
  });

  it('should include original error message in thrown error', async () => {
    const originalError = new Error('Database locked');
    vi.spyOn(indexedDB, 'clearAllContestants').mockRejectedValue(originalError);
    vi.spyOn(localStorage, 'clear').mockImplementation(() => undefined);

    await expect(resetAppState()).rejects.toThrow('Database locked');
  });
});
