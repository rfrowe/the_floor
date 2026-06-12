/**
 * Tests for the Studio draft store wrapper and the v3 IndexedDB upgrade.
 *
 * Runs against the globally-installed fake-indexeddb (see src/setupTests.ts).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudioDraftStore, STUDIO_DRAFT_ID } from './useStudioDraftStore';
import { getStudioDraft, putStudioDraft, clearStudioDraft } from '@storage/indexedDB';
import type { StudioDraft } from '@types';

function makeDraft(overrides: Partial<StudioDraft> = {}): StudioDraft {
  return {
    version: 1,
    id: STUDIO_DRAFT_ID,
    step: 'cards',
    categoryName: 'Cryptids',
    cards: [
      {
        id: 'a',
        answer: 'Bigfoot',
        imageKeywords: 'sasquatch forest',
        imagePrompt: 'a hairy biped',
      },
    ],
    slides: [],
    imageSource: 'openai',
    updatedAt: '2026-06-12T00:00:00.000Z',
    ...overrides,
  };
}

describe('studio draft IndexedDB functions (v3 store)', () => {
  beforeEach(async () => {
    await clearStudioDraft(STUDIO_DRAFT_ID);
  });

  it('returns null when no draft is stored (store exists after v3 upgrade)', async () => {
    const draft = await getStudioDraft<StudioDraft>(STUDIO_DRAFT_ID);
    expect(draft).toBeNull();
  });

  it('puts and gets a draft round-trip', async () => {
    const draft = makeDraft();
    await putStudioDraft(draft);

    const loaded = await getStudioDraft<StudioDraft>(STUDIO_DRAFT_ID);
    expect(loaded).toEqual(draft);
  });

  it('put replaces the single row (upsert)', async () => {
    await putStudioDraft(makeDraft({ categoryName: 'First' }));
    await putStudioDraft(makeDraft({ categoryName: 'Second' }));

    const loaded = await getStudioDraft<StudioDraft>(STUDIO_DRAFT_ID);
    expect(loaded?.categoryName).toBe('Second');
  });

  it('clears a stored draft', async () => {
    await putStudioDraft(makeDraft());
    await clearStudioDraft(STUDIO_DRAFT_ID);

    const loaded = await getStudioDraft<StudioDraft>(STUDIO_DRAFT_ID);
    expect(loaded).toBeNull();
  });

  it('preserves slide + censor data integrity', async () => {
    const draft = makeDraft({
      step: 'censor',
      slides: [
        {
          imageUrl: 'data:image/png;base64,ABC',
          answer: 'Bigfoot',
          censorBoxes: [{ x: 5, y: 6, width: 7, height: 8, color: '#000' }],
        },
      ],
    });
    await putStudioDraft(draft);

    const loaded = await getStudioDraft<StudioDraft>(STUDIO_DRAFT_ID);
    expect(loaded?.slides[0]?.censorBoxes).toHaveLength(1);
    expect(loaded?.slides[0]?.imageUrl).toBe('data:image/png;base64,ABC');
  });
});

describe('useStudioDraftStore hook', () => {
  beforeEach(async () => {
    await clearStudioDraft(STUDIO_DRAFT_ID);
  });

  it('load/save/clear operate on the single current row', async () => {
    const { result } = renderHook(() => useStudioDraftStore());

    let initial: StudioDraft | null = null;
    await act(async () => {
      initial = await result.current.load();
    });
    expect(initial).toBeNull();

    const draft = makeDraft();
    await act(async () => {
      await result.current.save(draft);
    });

    let loaded: StudioDraft | null = null;
    await act(async () => {
      loaded = await result.current.load();
    });
    expect(loaded).toEqual(draft);

    await act(async () => {
      await result.current.clear();
    });

    let afterClear: StudioDraft | null = null;
    await act(async () => {
      afterClear = await result.current.load();
    });
    expect(afterClear).toBeNull();
  });
});
