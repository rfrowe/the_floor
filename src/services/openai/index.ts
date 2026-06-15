/**
 * OpenAI service layer — public surface.
 *
 * The Studio (lazy route) imports from here; the `openai` SDK is reached only
 * through this folder so gameplay never bundles it. Tasks 56/57/58 consume
 * `structuredChat`, `generateCategoryNames`, `generateCardIdeas`, `getOpenAI`,
 * and `GenerationError` from this barrel.
 */

export { getOpenAI, resetOpenAIClient } from './client';
export { structuredChat, DEFAULT_CHAT_MODEL, DEFAULT_IMAGE_MODEL } from './structuredChat';
export type { StructuredChatArgs } from './structuredChat';
export { generateCategoryNames } from './categoryNames';
export { generateCardIdeas } from './cardIdeas';
export { generateImage, buildImagePrompt, QUALITY_SUFFIX } from './images';
export { validateCredentials } from './validate';
export { GenerationError, isGenerationError, toGenerationError } from './errors';
export type { GenerationErrorKind } from './errors';
