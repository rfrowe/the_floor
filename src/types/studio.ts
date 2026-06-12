/**
 * LLM Studio domain types
 *
 * The Studio is a guided wizard that produces the existing gameplay types
 * (Category / Slide / CensorBox), so its output drops straight into a duel.
 * These types describe the in-progress *draft* the wizard edits and persists
 * to IndexedDB. See docs/tasks/phase-12-llm-studio/PHASE_PROPOSAL.md.
 */

import type { Slide } from './slide';

/**
 * The ordered steps of the Studio wizard.
 *
 * Credentials → Category name → Cards → Images → Censor → Save
 */
export type StudioStep = 'credentials' | 'categoryName' | 'cards' | 'images' | 'censor' | 'save';

/**
 * Where a slide's image comes from. Only OpenAI generation is supported in
 * Phase 12; `'search'` (Unsplash/Pexels) is reserved for a future phase.
 */
export type StudioImageSource = 'openai';

/**
 * A single AI-suggested (or user-edited) card idea, before an image exists.
 * Each card becomes one {@link Slide} once an image is generated.
 */
export interface CardIdea {
  /** Stable nanoid — used as the React key so mid-list edits don't remount. */
  id: string;

  /** The correct guess for this card (e.g. "The Terminator"). */
  answer: string;

  /** Retained for future image-search support (not used by generation). */
  imageKeywords: string;

  /** Drives OpenAI image generation in Task 58. */
  imagePrompt: string;
}

/**
 * The complete, serializable state of an in-progress Studio session.
 *
 * Persisted (debounced) to the `studio-drafts` IndexedDB store as a single
 * row keyed by {@link StudioDraft.id}. Transient UI flags (e.g. "is
 * generating") must NOT live here — keep them in component/reducer-local
 * non-persisted state.
 */
export interface StudioDraft {
  /** Schema version for forward-compatible migrations. */
  version: 1;

  /** Single-row store: there is only ever one active draft. */
  id: 'current';

  /** The wizard step the user is currently on. */
  step: StudioStep;

  /** The confirmed category name, or null until the user confirms one. */
  categoryName: string | null;

  /** The editable list of card ideas (answer + prompts). */
  cards: CardIdea[];

  /**
   * One slide per card, derived on entering the `images` step. Images and
   * censor boxes are filled in by Tasks 58/59. Uses the gameplay `Slide` type.
   */
  slides: Slide[];

  /** Image source for this draft (fixed to OpenAI generation in Phase 12). */
  imageSource: StudioImageSource;

  /** ISO timestamp of the last edit. */
  updatedAt: string;
}
