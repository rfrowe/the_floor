/**
 * Tests for the Studio wizard state machine.
 *
 * Two layers:
 *  - the pure `studioReducer` + `canAdvanceFrom` guards + slide derivation
 *  - the `useStudioState` hook's hydrate / resume / discard behaviour against
 *    an injected fake store (storage-agnostic)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  studioReducer,
  canAdvanceFrom,
  createInitialDraft,
  createBlankCard,
  deriveSlidesFromCards,
  useStudioState,
  STUDIO_STEPS,
  type StudioAction,
} from './useStudioState';
import type { CardIdea, StudioDraft } from '@types';
import type { StudioDraftStore } from './useStudioDraftStore';

const sampleCards: CardIdea[] = [
  { id: 'a', answer: 'Apple', imageKeywords: 'fruit red', imagePrompt: 'a shiny red apple' },
  { id: 'b', answer: 'Banana', imageKeywords: 'fruit yellow', imagePrompt: 'a ripe banana' },
];

describe('studioReducer', () => {
  it('starts on the credentials step with an empty draft', () => {
    const draft = createInitialDraft();
    expect(draft.step).toBe('credentials');
    expect(draft.categoryName).toBeNull();
    expect(draft.cards).toEqual([]);
    expect(draft.slides).toEqual([]);
    expect(draft.imageSource).toBe('openai');
    expect(draft.id).toBe('current');
    expect(draft.version).toBe(1);
  });

  it('SET_STEP changes the step', () => {
    const next = studioReducer(createInitialDraft(), { type: 'SET_STEP', step: 'categoryName' });
    expect(next.step).toBe('categoryName');
  });

  it('SET_CATEGORY_NAME sets and clears the name', () => {
    const named = studioReducer(createInitialDraft(), {
      type: 'SET_CATEGORY_NAME',
      name: 'Cryptids',
    });
    expect(named.categoryName).toBe('Cryptids');

    const cleared = studioReducer(named, { type: 'SET_CATEGORY_NAME', name: null });
    expect(cleared.categoryName).toBeNull();
  });

  it('SET_CARDS replaces the card list', () => {
    const next = studioReducer(createInitialDraft(), { type: 'SET_CARDS', cards: sampleCards });
    expect(next.cards).toHaveLength(2);
    expect(next.cards[0]?.answer).toBe('Apple');
  });

  it('UPDATE_CARD changes only the matching card', () => {
    const start = studioReducer(createInitialDraft(), { type: 'SET_CARDS', cards: sampleCards });
    const next = studioReducer(start, {
      type: 'UPDATE_CARD',
      id: 'b',
      changes: { answer: 'Plantain' },
    });
    expect(next.cards.find((c) => c.id === 'a')?.answer).toBe('Apple');
    expect(next.cards.find((c) => c.id === 'b')?.answer).toBe('Plantain');
  });

  it('DELETE_CARD removes the matching card', () => {
    const start = studioReducer(createInitialDraft(), { type: 'SET_CARDS', cards: sampleCards });
    const next = studioReducer(start, { type: 'DELETE_CARD', id: 'a' });
    expect(next.cards).toHaveLength(1);
    expect(next.cards[0]?.id).toBe('b');
  });

  it('ADD_CARD appends a provided card', () => {
    const card = createBlankCard();
    const next = studioReducer(createInitialDraft(), { type: 'ADD_CARD', card });
    expect(next.cards).toHaveLength(1);
    expect(next.cards[0]?.id).toBe(card.id);
  });

  it('ADD_CARD without a card appends a blank card with an id', () => {
    const next = studioReducer(createInitialDraft(), { type: 'ADD_CARD' });
    expect(next.cards).toHaveLength(1);
    expect(next.cards[0]?.id).toBeTruthy();
    expect(next.cards[0]?.answer).toBe('');
  });

  it('derives one empty slide per card (in order) when entering the images step', () => {
    const withCards = studioReducer(createInitialDraft(), {
      type: 'SET_CARDS',
      cards: sampleCards,
    });
    const next = studioReducer(withCards, { type: 'SET_STEP', step: 'images' });
    expect(next.slides).toHaveLength(2);
    expect(next.slides[0]).toEqual({ imageUrl: '', answer: 'Apple', censorBoxes: [] });
    expect(next.slides[1]).toEqual({ imageUrl: '', answer: 'Banana', censorBoxes: [] });
  });

  it('SET_SLIDE_IMAGE updates only the targeted slide', () => {
    let draft = studioReducer(createInitialDraft(), { type: 'SET_CARDS', cards: sampleCards });
    draft = studioReducer(draft, { type: 'SET_STEP', step: 'images' });
    const next = studioReducer(draft, {
      type: 'SET_SLIDE_IMAGE',
      index: 1,
      imageUrl: 'data:image/png;base64,zzz',
    });
    expect(next.slides[0]?.imageUrl).toBe('');
    expect(next.slides[1]?.imageUrl).toBe('data:image/png;base64,zzz');
  });

  it('SET_SLIDE_CENSOR_BOXES updates only the targeted slide', () => {
    let draft = studioReducer(createInitialDraft(), { type: 'SET_CARDS', cards: sampleCards });
    draft = studioReducer(draft, { type: 'SET_STEP', step: 'images' });
    const boxes = [{ x: 10, y: 20, width: 30, height: 40, color: '#000' }];
    const next = studioReducer(draft, {
      type: 'SET_SLIDE_CENSOR_BOXES',
      index: 0,
      censorBoxes: boxes,
    });
    expect(next.slides[0]?.censorBoxes).toEqual(boxes);
    expect(next.slides[1]?.censorBoxes).toEqual([]);
  });

  it('HYDRATE_DRAFT replaces the entire draft', () => {
    const stored: StudioDraft = {
      version: 1,
      id: 'current',
      step: 'cards',
      categoryName: 'Movies',
      cards: sampleCards,
      slides: [],
      imageSource: 'openai',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const next = studioReducer(createInitialDraft(), { type: 'HYDRATE_DRAFT', draft: stored });
    expect(next).toEqual(stored);
  });

  it('RESET clears state back to the initial draft', () => {
    let draft = studioReducer(createInitialDraft(), { type: 'SET_CATEGORY_NAME', name: 'X' });
    draft = studioReducer(draft, { type: 'SET_CARDS', cards: sampleCards });
    const next = studioReducer(draft, { type: 'RESET' });
    expect(next.step).toBe('credentials');
    expect(next.categoryName).toBeNull();
    expect(next.cards).toEqual([]);
  });

  it('stamps updatedAt on a mutating action', () => {
    const before = createInitialDraft();
    before.updatedAt = '2000-01-01T00:00:00.000Z';
    const next = studioReducer(before, { type: 'SET_CATEGORY_NAME', name: 'Y' });
    expect(next.updatedAt).not.toBe(before.updatedAt);
  });
});

describe('deriveSlidesFromCards', () => {
  it('maps each card to an empty slide preserving order', () => {
    const slides = deriveSlidesFromCards(sampleCards);
    expect(slides.map((s) => s.answer)).toEqual(['Apple', 'Banana']);
    expect(slides.every((s) => s.imageUrl === '' && s.censorBoxes.length === 0)).toBe(true);
  });
});

describe('canAdvanceFrom guards', () => {
  it('allows advancing from credentials (gated elsewhere)', () => {
    expect(canAdvanceFrom(createInitialDraft())).toBe(true);
  });

  it('blocks advancing to cards without a confirmed category name', () => {
    const onName: StudioDraft = { ...createInitialDraft(), step: 'categoryName' };
    expect(canAdvanceFrom(onName)).toBe(false);
    expect(canAdvanceFrom({ ...onName, categoryName: '   ' })).toBe(false);
    expect(canAdvanceFrom({ ...onName, categoryName: 'Cryptids' })).toBe(true);
  });

  it('blocks advancing to images with zero cards', () => {
    const onCards: StudioDraft = { ...createInitialDraft(), step: 'cards' };
    expect(canAdvanceFrom(onCards)).toBe(false);
    expect(canAdvanceFrom({ ...onCards, cards: sampleCards })).toBe(true);
  });

  it('cannot advance from the terminal save step', () => {
    const onSave: StudioDraft = { ...createInitialDraft(), step: 'save' };
    expect(canAdvanceFrom(onSave)).toBe(false);
  });

  it('exposes the six wizard steps in order', () => {
    expect(STUDIO_STEPS).toEqual([
      'credentials',
      'categoryName',
      'cards',
      'images',
      'censor',
      'save',
    ]);
  });
});

/** Build an in-memory fake draft store for hook tests. */
function makeFakeStore(initial: StudioDraft | null = null): {
  store: StudioDraftStore;
  saved: { value: StudioDraft | null };
} {
  const state: { value: StudioDraft | null } = { value: initial };
  const store: StudioDraftStore = {
    load: vi.fn(() => Promise.resolve(state.value)),
    save: vi.fn((draft: StudioDraft) => {
      state.value = draft;
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      state.value = null;
      return Promise.resolve();
    }),
  };
  return { store, saved: state };
}

describe('useStudioState (hook)', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('finishes hydrating with no pending draft when storage is empty', async () => {
    const { store } = makeFakeStore(null);
    const { result } = renderHook(() => useStudioState(store));

    await waitFor(() => {
      expect(result.current.isHydrating).toBe(false);
    });
    expect(result.current.pendingDraft).toBeNull();
    expect(result.current.draft.step).toBe('credentials');
  });

  it('surfaces a persisted draft as pending (Resume / Start over)', async () => {
    const stored: StudioDraft = {
      version: 1,
      id: 'current',
      step: 'cards',
      categoryName: 'Movies',
      cards: sampleCards,
      slides: [],
      imageSource: 'openai',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const { store } = makeFakeStore(stored);
    const { result } = renderHook(() => useStudioState(store));

    await waitFor(() => {
      expect(result.current.pendingDraft).not.toBeNull();
    });
    // Not adopted until the user chooses Resume.
    expect(result.current.draft.step).toBe('credentials');
  });

  it('resumeDraft adopts the pending draft', async () => {
    const stored: StudioDraft = {
      version: 1,
      id: 'current',
      step: 'cards',
      categoryName: 'Movies',
      cards: sampleCards,
      slides: [],
      imageSource: 'openai',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const { store } = makeFakeStore(stored);
    const { result } = renderHook(() => useStudioState(store));

    await waitFor(() => {
      expect(result.current.pendingDraft).not.toBeNull();
    });

    act(() => {
      result.current.resumeDraft();
    });

    expect(result.current.pendingDraft).toBeNull();
    expect(result.current.draft.categoryName).toBe('Movies');
    expect(result.current.draft.step).toBe('cards');
  });

  it('discardDraft clears storage and resets state', async () => {
    const stored: StudioDraft = {
      version: 1,
      id: 'current',
      step: 'cards',
      categoryName: 'Movies',
      cards: sampleCards,
      slides: [],
      imageSource: 'openai',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const { store, saved } = makeFakeStore(stored);
    const { result } = renderHook(() => useStudioState(store));

    await waitFor(() => {
      expect(result.current.pendingDraft).not.toBeNull();
    });

    act(() => {
      result.current.discardDraft();
    });

    expect(result.current.pendingDraft).toBeNull();
    expect(result.current.draft.step).toBe('credentials');
    await waitFor(() => {
      expect(store.clear).toHaveBeenCalled();
    });
    expect(saved.value).toBeNull();
  });

  it('persists edits (debounced) once a resume decision is resolved', async () => {
    vi.useFakeTimers();
    const { store, saved } = makeFakeStore(null);
    const { result } = renderHook(() => useStudioState(store));

    // Flush the hydrate microtask.
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    act(() => {
      result.current.actions.setCategoryName('Cryptids');
    });

    // Not yet written (debounced).
    expect(store.save).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(store.save).toHaveBeenCalled();
    expect(saved.value?.categoryName).toBe('Cryptids');
    vi.useRealTimers();
  });

  it('exposes canAdvance reflecting the current draft', async () => {
    const { store } = makeFakeStore(null);
    const { result } = renderHook(() => useStudioState(store));

    await waitFor(() => {
      expect(result.current.isHydrating).toBe(false);
    });

    // On credentials: can advance.
    expect(result.current.canAdvance).toBe(true);

    // Move to categoryName with no name: cannot advance.
    act(() => {
      result.current.actions.setStep('categoryName');
    });
    expect(result.current.canAdvance).toBe(false);

    // Confirm a name: can advance.
    act(() => {
      result.current.actions.setCategoryName('Cryptids');
    });
    expect(result.current.canAdvance).toBe(true);
  });
});

describe('StudioAction typing', () => {
  it('round-trips a discriminated action through the reducer', () => {
    const action: StudioAction = { type: 'SET_STEP', step: 'save' };
    const next = studioReducer(createInitialDraft(), action);
    expect(next.step).toBe('save');
  });
});
