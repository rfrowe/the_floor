# Task 54: Credentials Management

**Status**: 📋 NOT STARTED
**Priority**: HIGH
**Complexity**: Low–Medium
**Estimated effort**: 1–2 days

## Objective

Let the user store an OpenAI API key and an optional custom OpenAI-compatible base URL in the browser, surfaced through a `CredentialsStep` form and a `useCredentials` hook, with a prominent security warning and a Clear action.

## Background

Every OpenAI call in Phase 12 needs a key. The app is a static client-only SPA, so the key necessarily lives in the browser. This task owns that storage and the UX around it. Image source is fixed to OpenAI generation (a locked decision), so there is **no second API key** to manage.

The app already has a generic `useLocalStorage<T>` hook (`src/hooks/useLocalStorage.ts`) that prefixes keys with `the-floor:` and syncs across tabs via the `storage` event (~`:48-64`). Build on it rather than touching `localStorage` directly.

## Acceptance Criteria

- [ ] Create `useCredentials()` returning the current config plus setters and an `isConfigured` flag.
- [ ] Persist to `localStorage` key `studio:openai` (becomes `the-floor:studio:openai` via the existing prefix) with shape `{ apiKey: string; baseURL: string; imageSource: 'openai' }`.
- [ ] `isConfigured === apiKey.trim().length > 0`.
- [ ] Cross-tab sync works automatically (inherited from `useLocalStorage`).
- [ ] `clear()` removes the stored credentials.
- [ ] Create `CredentialsStep` with: a password-type API key input, an optional base URL input (placeholder showing the default OpenAI URL; empty = default), a **prominent security warning**, a **Clear credentials** button, and a Continue control gated on `isConfigured`.
- [ ] Warning text covers: the key is stored in plaintext in this browser, recommend a spend-limited key, and it is cleared by this button (and document whether "Reset App" also clears it).

## Implementation Guidance

### Files to create
- `src/hooks/useCredentials.ts`
- `src/components/studio/steps/CredentialsStep.tsx` (+ `.module.css`)

### Hook sketch
```ts
import { useLocalStorage } from '@hooks/useLocalStorage';

export interface OpenAIConfig {
  apiKey: string;
  baseURL: string;          // '' → SDK default
  imageSource: 'openai';
}
const DEFAULT: OpenAIConfig = { apiKey: '', baseURL: '', imageSource: 'openai' };

export function useCredentials() {
  const [config, setConfig] = useLocalStorage<OpenAIConfig>('studio:openai', DEFAULT);
  const setKey = (apiKey: string) => setConfig((c) => ({ ...c, apiKey }));
  const setBaseURL = (baseURL: string) => setConfig((c) => ({ ...c, baseURL }));
  const clear = () => setConfig(DEFAULT);
  const isConfigured = config.apiKey.trim().length > 0;
  return [config, { setKey, setBaseURL, clear, isConfigured }] as const;
}
```
(Confirm the exact `useLocalStorage` signature — match its existing call sites; adapt the setter form if it isn't updater-based.)

### Security posture
- NEVER log the key (`createLogger` usage elsewhere must avoid it).
- The key is sent only to the configured OpenAI endpoint (Task 55).
- Do **not** attempt client-side "encryption" — the decryption key would ship in the bundle. A clear warning + easy Clear is the honest design.
- Check whether the existing "Reset App" flow clears `the-floor:`-prefixed keys (`src/storage/localStorage.ts` `clear()`); if so, state in the warning that resetting the app also wipes credentials.

## Dependencies
**Required:** [Task 53](../task-53-studio-shell-and-state/PROMPT.md) (page shell + step host).
**Enables:** [Task 55](../task-55-openai-service-layer/PROMPT.md) (consumes the config).

## Out of Scope
- Image-service keys (no second API).
- Live key validation / connection-test on Continue — **moved to [Task 55](../task-55-openai-service-layer/PROMPT.md)**, which adds a `validateCredentials` probe and wires it into this step's Continue handler (needs the OpenAI client from that task). Task 54 only does the non-empty `isConfigured` gate.
- Cost tracking (future).

## Testing Strategy
- `useCredentials.test.ts` — set/get key + base URL, `isConfigured` true/false, `clear()`, and cross-tab `storage`-event update (follow `useLocalStorage.test.tsx` patterns).
- `CredentialsStep.test.tsx` — Continue disabled until a key is entered; warning text present; Clear empties the field.

## Success Criteria
- A user can paste a key (and optional base URL), see it persist across reload, advance, and clear it.
- `npm run build`, `npm test -- --run`, `npm run lint` pass.

## Notes
- Keep the base URL input free-form; validation/normalization (trailing slash, `/v1`) is the SDK's concern in Task 55.

## Related Tasks
- [Task 53](../task-53-studio-shell-and-state/PROMPT.md), [Task 55](../task-55-openai-service-layer/PROMPT.md)
