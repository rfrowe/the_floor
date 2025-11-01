# Task 05: localStorage Abstraction Layer

## Objective
Create a clean abstraction over the browser's localStorage API with custom React hooks for managing game state persistence.

## Acceptance Criteria
- [ ] Storage utility functions wrap localStorage with error handling
- [ ] Custom React hooks for reading and writing game state
- [ ] Type-safe storage operations using TypeScript interfaces from task-04
- [ ] Automatic JSON serialization/deserialization
- [ ] Error handling for quota exceeded, unavailable storage, etc.
- [ ] Unit tests for storage functions
- [ ] Hook tests verify React integration works correctly

## Required Storage Keys
Based on SPEC.md section 3.5:
- `the-floor:contestants` - Array of all contestants
- `the-floor:config` - Game configuration
- `the-floor:duel` - Current duel state (nullable)

## Implementation Guidance
1. Create `src/storage/localStorage.ts` with utility functions:
   ```typescript
   export function getItem<T>(key: string, defaultValue: T): T
   export function setItem<T>(key: string, value: T): void
   export function removeItem(key: string): void
   export function clear(): void
   ```
2. Create custom hooks in `src/hooks/`:
   - `useLocalStorage<T>(key: string, initialValue: T)` - Generic hook for any localStorage value
   - `useContestants()` - Specific hook for contestant list
   - `useGameConfig()` - Specific hook for game config
   - `useDuelState()` - Specific hook for current duel
3. Handle edge cases:
   - localStorage unavailable (private browsing mode)
   - Quota exceeded errors
   - Invalid JSON data
   - Concurrent tab updates (storage events)
4. Add proper TypeScript typing to ensure type safety
5. Write unit tests for storage functions using vitest
6. Write hook tests using @testing-library/react-hooks patterns

## Success Criteria
- Storage functions handle all error cases gracefully
- Hooks work seamlessly in React components
- Data persists across page refreshes
- Invalid or corrupted data doesn't crash the app (falls back to defaults)
- All functions and hooks are fully typed
- Tests provide good coverage of happy paths and error cases
- Storage keys use a consistent prefix to avoid conflicts

## Out of Scope
- IndexedDB or other storage mechanisms
- Encryption or data security
- Cross-tab synchronization (handled in task-23)
- Automatic migrations for schema changes

## Notes
- Keep the API simple and intuitive for other developers
- Fail gracefully - if localStorage isn't available, use in-memory fallback
- Consider adding debug logging that can be enabled during development
- Reference SPEC.md section 3.5 for the game state structure
