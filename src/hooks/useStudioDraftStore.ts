/**
 * Thin load/save/clear wrapper over the IndexedDB studio-draft functions.
 *
 * Keeping persistence behind this hook lets `useStudioState` stay
 * storage-agnostic and independently testable: tests can exercise the reducer
 * without IndexedDB, and exercise the store without React state.
 */

import { useCallback } from 'react';
import { getStudioDraft, putStudioDraft, clearStudioDraft } from '@storage/indexedDB';
import type { StudioDraft } from '@types';

/** The single-row key under which the active draft is stored. */
export const STUDIO_DRAFT_ID = 'current';

export interface StudioDraftStore {
  /** Load the persisted draft, or null when none exists. */
  load: () => Promise<StudioDraft | null>;
  /** Persist (insert or replace) the draft. */
  save: (draft: StudioDraft) => Promise<void>;
  /** Remove the persisted draft. */
  clear: () => Promise<void>;
}

/**
 * Provides stable load/save/clear callbacks for the single Studio draft row.
 */
export function useStudioDraftStore(): StudioDraftStore {
  const load = useCallback(async (): Promise<StudioDraft | null> => {
    return getStudioDraft<StudioDraft>(STUDIO_DRAFT_ID);
  }, []);

  const save = useCallback(async (draft: StudioDraft): Promise<void> => {
    await putStudioDraft(draft);
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    await clearStudioDraft(STUDIO_DRAFT_ID);
  }, []);

  return { load, save, clear };
}
