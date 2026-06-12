/**
 * useStudioState — the LLM Studio wizard state machine.
 *
 * Holds a single serializable `StudioDraft` in a reducer and exposes typed
 * action dispatchers, a derived `canAdvance` guard, and draft persistence
 * (debounced writes + hydrate-on-mount) via an injectable draft store.
 *
 * Step guards (PROMPT acceptance criteria):
 *  - cannot advance to `cards` without a confirmed `categoryName`
 *  - cannot advance to `images` with zero cards
 *  - entering `images` derives one Slide per card (preserving order)
 *
 * Transient UI flags (e.g. "is generating") deliberately do NOT live in the
 * persisted draft; keep them in component-local state.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import type { CardIdea, Slide, StudioDraft, StudioStep } from '@types';
import {
  useStudioDraftStore,
  STUDIO_DRAFT_ID,
  type StudioDraftStore,
} from '@hooks/useStudioDraftStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('useStudioState');

/** Debounce window for persisting draft edits to IndexedDB. */
const PERSIST_DEBOUNCE_MS = 500;

/** The wizard steps in order. The stepper and guards rely on this ordering. */
export const STUDIO_STEPS: readonly StudioStep[] = [
  'credentials',
  'categoryName',
  'cards',
  'images',
  'censor',
  'save',
] as const;

/**
 * Build a fresh, empty draft. `updatedAt` is set at creation so an untouched
 * draft still has a sensible timestamp.
 */
export function createInitialDraft(): StudioDraft {
  return {
    version: 1,
    id: STUDIO_DRAFT_ID,
    step: 'credentials',
    categoryName: null,
    cards: [],
    slides: [],
    imageSource: 'openai',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create a new blank card idea with a stable id.
 */
export function createBlankCard(): CardIdea {
  return { id: nanoid(), answer: '', imageKeywords: '', imagePrompt: '' };
}

/**
 * Derive one slide per card, preserving order. Images and censor boxes are
 * filled in by later steps; here every slide starts empty.
 */
export function deriveSlidesFromCards(cards: CardIdea[]): Slide[] {
  return cards.map((card) => ({ imageUrl: '', answer: card.answer, censorBoxes: [] }));
}

export type StudioAction =
  | { type: 'SET_STEP'; step: StudioStep }
  | { type: 'SET_CATEGORY_NAME'; name: string | null }
  | { type: 'SET_CARDS'; cards: CardIdea[] }
  | { type: 'UPDATE_CARD'; id: string; changes: Partial<Omit<CardIdea, 'id'>> }
  | { type: 'DELETE_CARD'; id: string }
  | { type: 'ADD_CARD'; card?: CardIdea }
  | { type: 'SET_SLIDE_IMAGE'; index: number; imageUrl: string }
  | { type: 'SET_SLIDE_CENSOR_BOXES'; index: number; censorBoxes: Slide['censorBoxes'] }
  | { type: 'HYDRATE_DRAFT'; draft: StudioDraft }
  | { type: 'RESET' };

/**
 * Can the wizard advance from the given step with the current draft?
 *
 * `save` is the terminal step, so it cannot advance further.
 */
export function canAdvanceFrom(draft: StudioDraft): boolean {
  switch (draft.step) {
    case 'credentials':
      // Credential validation is owned by Task 54; the shell does not gate here.
      return true;
    case 'categoryName':
      // Need a confirmed, non-empty category name to reach `cards`.
      return draft.categoryName !== null && draft.categoryName.trim().length > 0;
    case 'cards':
      // Need at least one card to reach `images`.
      return draft.cards.length > 0;
    case 'images':
      return true;
    case 'censor':
      return true;
    case 'save':
      return false;
    default:
      return false;
  }
}

/**
 * Pure reducer for the Studio draft. Exported for direct unit testing.
 * Every state-changing action stamps `updatedAt`; HYDRATE_DRAFT replaces the
 * whole draft as-is (the stored timestamp is authoritative).
 */
export function studioReducer(state: StudioDraft, action: StudioAction): StudioDraft {
  const touch = (next: StudioDraft): StudioDraft => ({
    ...next,
    updatedAt: new Date().toISOString(),
  });

  switch (action.type) {
    case 'SET_STEP': {
      // Derive slides when entering the images step so later steps have a
      // slide per card. Preserve any slides already present (e.g. on a
      // back-and-forth) only when the card set is unchanged in length.
      if (action.step === 'images') {
        const needsDerive =
          state.slides.length !== state.cards.length ||
          state.cards.some((card, i) => state.slides[i]?.answer !== card.answer);
        const slides = needsDerive ? deriveSlidesFromCards(state.cards) : state.slides;
        return touch({ ...state, step: action.step, slides });
      }
      return touch({ ...state, step: action.step });
    }

    case 'SET_CATEGORY_NAME':
      return touch({ ...state, categoryName: action.name });

    case 'SET_CARDS':
      return touch({ ...state, cards: action.cards });

    case 'UPDATE_CARD':
      return touch({
        ...state,
        cards: state.cards.map((card) =>
          card.id === action.id ? { ...card, ...action.changes } : card
        ),
      });

    case 'DELETE_CARD':
      return touch({
        ...state,
        cards: state.cards.filter((card) => card.id !== action.id),
      });

    case 'ADD_CARD':
      return touch({
        ...state,
        cards: [...state.cards, action.card ?? createBlankCard()],
      });

    case 'SET_SLIDE_IMAGE':
      return touch({
        ...state,
        slides: state.slides.map((slide, i) =>
          i === action.index ? { ...slide, imageUrl: action.imageUrl } : slide
        ),
      });

    case 'SET_SLIDE_CENSOR_BOXES':
      return touch({
        ...state,
        slides: state.slides.map((slide, i) =>
          i === action.index ? { ...slide, censorBoxes: action.censorBoxes } : slide
        ),
      });

    case 'HYDRATE_DRAFT':
      // Replace wholesale with the persisted draft; do not re-stamp.
      return action.draft;

    case 'RESET':
      return createInitialDraft();

    default:
      return state;
  }
}

export interface StudioStateActions {
  setStep: (step: StudioStep) => void;
  setCategoryName: (name: string | null) => void;
  setCards: (cards: CardIdea[]) => void;
  updateCard: (id: string, changes: Partial<Omit<CardIdea, 'id'>>) => void;
  deleteCard: (id: string) => void;
  addCard: (card?: CardIdea) => void;
  setSlideImage: (index: number, imageUrl: string) => void;
  setSlideCensorBoxes: (index: number, censorBoxes: Slide['censorBoxes']) => void;
  hydrate: (draft: StudioDraft) => void;
  reset: () => void;
}

export interface UseStudioStateResult {
  /** The current wizard draft. */
  draft: StudioDraft;
  /** Whether the wizard can advance from the current step. */
  canAdvance: boolean;
  /** Typed action dispatchers. */
  actions: StudioStateActions;
  /** Raw dispatch for callers that prefer dispatching actions directly. */
  dispatch: React.Dispatch<StudioAction>;
  /** True until the initial hydrate-from-storage attempt completes. */
  isHydrating: boolean;
  /**
   * A previously-saved draft found on mount, awaiting a Resume / Start over
   * decision. Null once resolved (resumed or discarded) or if none existed.
   */
  pendingDraft: StudioDraft | null;
  /** Adopt the pending persisted draft (Resume). */
  resumeDraft: () => void;
  /** Discard the pending persisted draft and start fresh (Start over). */
  discardDraft: () => void;
}

/**
 * Wizard state hook with debounced IndexedDB persistence and resume support.
 *
 * @param store Optional injectable draft store; tests can pass a fake. When
 *              omitted, the IndexedDB-backed store is used.
 */
export function useStudioState(store?: StudioDraftStore): UseStudioStateResult {
  // Always create the default store (hooks must run unconditionally); prefer
  // an injected store when provided.
  const defaultStore = useStudioDraftStore();
  const activeStore = store ?? defaultStore;

  const [draft, dispatch] = useReducer(studioReducer, undefined, createInitialDraft);
  const [isHydrating, setIsHydrating] = useState(true);
  const [pendingDraft, setPendingDraft] = useState<StudioDraft | null>(null);

  // Suppress the debounced write that the very first render would otherwise
  // trigger, and any write while a resume decision is still pending.
  const skipPersistRef = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storeRef = useRef(activeStore);
  storeRef.current = activeStore;

  // Hydrate-on-mount: load any persisted draft and surface it for a
  // Resume / Start over decision rather than silently adopting it. A ref guards
  // against setting state after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    void (async () => {
      try {
        const loaded = await storeRef.current.load();
        if (mountedRef.current && loaded) {
          setPendingDraft(loaded);
        }
      } catch (error) {
        log.error('Failed to load studio draft', error);
      } finally {
        if (mountedRef.current) {
          setIsHydrating(false);
        }
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Debounced persistence: writes are skipped during hydration and while a
  // resume decision is pending so we don't clobber the stored draft.
  useEffect(() => {
    if (skipPersistRef.current || isHydrating || pendingDraft !== null) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void storeRef.current.save(draft).catch((error: unknown) => {
        log.error('Failed to persist studio draft', error);
      });
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [draft, isHydrating, pendingDraft]);

  const resumeDraft = useCallback(() => {
    setPendingDraft((current) => {
      if (current) {
        dispatch({ type: 'HYDRATE_DRAFT', draft: current });
      }
      // Allow subsequent edits to persist.
      skipPersistRef.current = false;
      return null;
    });
  }, []);

  const discardDraft = useCallback(() => {
    setPendingDraft(null);
    skipPersistRef.current = false;
    dispatch({ type: 'RESET' });
    void storeRef.current.clear().catch((error: unknown) => {
      log.error('Failed to clear studio draft', error);
    });
  }, []);

  // Wrapped dispatchers. Any explicit dispatch enables persistence (a no-op
  // once already enabled).
  const enablePersist = useCallback(() => {
    if (pendingDraft === null) {
      skipPersistRef.current = false;
    }
  }, [pendingDraft]);

  const actions = useMemo<StudioStateActions>(
    () => ({
      setStep: (step) => {
        enablePersist();
        dispatch({ type: 'SET_STEP', step });
      },
      setCategoryName: (name) => {
        enablePersist();
        dispatch({ type: 'SET_CATEGORY_NAME', name });
      },
      setCards: (cards) => {
        enablePersist();
        dispatch({ type: 'SET_CARDS', cards });
      },
      updateCard: (id, changes) => {
        enablePersist();
        dispatch({ type: 'UPDATE_CARD', id, changes });
      },
      deleteCard: (id) => {
        enablePersist();
        dispatch({ type: 'DELETE_CARD', id });
      },
      addCard: (card) => {
        enablePersist();
        dispatch(card ? { type: 'ADD_CARD', card } : { type: 'ADD_CARD' });
      },
      setSlideImage: (index, imageUrl) => {
        enablePersist();
        dispatch({ type: 'SET_SLIDE_IMAGE', index, imageUrl });
      },
      setSlideCensorBoxes: (index, censorBoxes) => {
        enablePersist();
        dispatch({ type: 'SET_SLIDE_CENSOR_BOXES', index, censorBoxes });
      },
      hydrate: (next) => {
        enablePersist();
        dispatch({ type: 'HYDRATE_DRAFT', draft: next });
      },
      reset: () => {
        enablePersist();
        dispatch({ type: 'RESET' });
      },
    }),
    [enablePersist]
  );

  const canAdvance = useMemo(() => canAdvanceFrom(draft), [draft]);

  return {
    draft,
    canAdvance,
    actions,
    dispatch,
    isHydrating,
    pendingDraft,
    resumeDraft,
    discardDraft,
  };
}
