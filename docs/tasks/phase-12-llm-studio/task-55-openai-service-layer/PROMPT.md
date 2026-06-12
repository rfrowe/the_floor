# Task 55: OpenAI Service Layer

**Status**: 📋 NOT STARTED
**Priority**: HIGH (foundational for all generation)
**Complexity**: Medium–High
**Estimated effort**: 2–3 days

## Objective

Build a typed service layer that wraps the OpenAI API for the browser: a configured client (custom base URL + `dangerouslyAllowBrowser`), a structured-output chat helper, the category-name and card-idea generators, and a typed error model. This is the I/O foundation that Tasks 56–58 consume.

## Background

Generation must work against both the official OpenAI API and a user-supplied **OpenAI-compatible base URL** (locked decision). The official `openai` Node/JS SDK supports both `baseURL` and `dangerouslyAllowBrowser`, plus typed errors and the images endpoint — so adding it is cleaner than hand-rolling `fetch`. The `@services` alias already exists (`src/services/`, currently only `timerSync.ts`).

Use **Structured Outputs** (`response_format: { type: 'json_schema', ... }`) so responses parse deterministically.

## Acceptance Criteria

- [ ] Add the `openai` npm dependency (pin a current version; verify it resolves via the configured registry).
- [ ] `getOpenAI(config)` builds and memoizes an `OpenAI` client with `{ apiKey, baseURL: config.baseURL || undefined, dangerouslyAllowBrowser: true }`; re-memoize when key or base URL changes.
- [ ] `structuredChat<T>(...)` issues a chat completion with a JSON schema, parses + validates `choices[0].message.content`, and throws a typed `GenerationError` on failure.
- [ ] `generateCategoryNames(count)` → `Promise<string[]>` (distinct, short, guessing-game-appropriate titles).
- [ ] `generateCardIdeas(categoryName, count)` → `Promise<CardIdea[]>` (`answer`, `imageKeywords`, `imagePrompt`; uses `nanoid` ids — or the caller assigns ids).
- [ ] `GenerationError` carries `kind: 'auth' | 'rateLimit' | 'network' | 'cors' | 'parse' | 'unknown'` derived from `OpenAI.APIError.status` (401/403→auth, 429→rateLimit, network reject→network) and a user-facing `message`.
- [ ] Default chat model `gpt-4o-mini` (overridable); no key is ever logged.

## Implementation Guidance

### Files to create
- `src/services/openai/client.ts` — `getOpenAI(config)` (memoized).
- `src/services/openai/structuredChat.ts` — schema-constrained completion + parse/validate + error mapping.
- `src/services/openai/categoryNames.ts` — `generateCategoryNames`.
- `src/services/openai/cardIdeas.ts` — `generateCardIdeas`.
- `src/services/openai/errors.ts` — `GenerationError` + `toGenerationError(err)`.
- `src/services/openai/index.ts` — barrel.

### Files to modify
- `package.json` / lockfile — add `openai`.

### Client sketch
```ts
import OpenAI from 'openai';
import type { OpenAIConfig } from '@hooks/useCredentials';

let cached: { key: string; baseURL: string; client: OpenAI } | null = null;
export function getOpenAI(cfg: OpenAIConfig): OpenAI {
  if (cached && cached.key === cfg.apiKey && cached.baseURL === cfg.baseURL) return cached.client;
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL || undefined,
    dangerouslyAllowBrowser: true,
  });
  cached = { key: cfg.apiKey, baseURL: cfg.baseURL, client };
  return client;
}
```

### structuredChat sketch
```ts
export async function structuredChat<T>(args: {
  config: OpenAIConfig;
  system: string;
  user: string;
  schema: Record<string, unknown>;   // JSON schema
  schemaName: string;
  model?: string;
  validate: (v: unknown) => v is T;
}): Promise<T> {
  try {
    const client = getOpenAI(args.config);
    const res = await client.chat.completions.create({
      model: args.model ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
      response_format: { type: 'json_schema', json_schema: { name: args.schemaName, schema: args.schema, strict: true } },
    });
    const content = res.choices[0]?.message?.content ?? '';
    const parsed: unknown = JSON.parse(content);
    if (!args.validate(parsed)) throw new GenerationError('parse', 'Unexpected response shape');
    return parsed;
  } catch (err) {
    throw toGenerationError(err);   // GenerationError passes through
  }
}
```
- Wrap list outputs in an object (`{ items: [...] }`) — Structured Outputs requires an object root.
- Provide tight type guards in each generator (no `as`); the repo bans unchecked casts (`CLAUDE.md`).
- `toGenerationError` should detect `OpenAI.APIError` (use `instanceof` / `err.status`) and treat opaque network/TypeError rejections (common for CORS) as `network`/`cors`.

## Dependencies
**Required:** [Task 53](../task-53-studio-shell-and-state/PROMPT.md) (`CardIdea` type), [Task 54](../task-54-credentials-management/PROMPT.md) (`OpenAIConfig`).
**Enables:** [Task 56](../task-56-category-name-generation/PROMPT.md), [Task 57](../task-57-card-ideas-editor/PROMPT.md), [Task 58](../task-58-image-generation/PROMPT.md).

## Out of Scope
- Image generation (Task 58 adds `images.ts` in this same folder).
- Batching/prefetch (Task 56) and UI.
- Cost/token tracking (future).

## Testing Strategy
- Mock the client via `vi.mock('openai')` (or mock `global.fetch`). Assert:
  - `categoryNames.test.ts` / `cardIdeas.test.ts` — correct parsing of structured JSON; `baseURL` passthrough when set vs. default when empty.
  - `errors.test.ts` — `status` 401→auth, 429→rateLimit, thrown `TypeError`→network/cors, bad JSON→parse.
- No real network calls in tests.

## Success Criteria
- `generateCategoryNames`/`generateCardIdeas` return typed, validated data against a mocked client, honoring a custom base URL.
- `npm run build`, `npm test -- --run`, `npm run lint` pass.

## Notes
- Bundle size: import the SDK only inside `src/services/openai/*`, reached from the lazy `Studio` route (Task 53), so players never download it.
- Models evolve — keep the model id a constant that's easy to update; don't hardcode it in multiple places.

## Related Tasks
- [Task 53](../task-53-studio-shell-and-state/PROMPT.md), [Task 54](../task-54-credentials-management/PROMPT.md), [Task 56](../task-56-category-name-generation/PROMPT.md)
