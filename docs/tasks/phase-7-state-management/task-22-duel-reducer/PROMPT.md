# Task 22: Duel Reducer (DEPRECATED)

## Status
**NOT NEEDED**: This task is deprecated for the hook-based architecture.

## Why Deprecated

The original task planned to use `useReducer` for duel state management. However:

1. **Simple state updates** - Duel state changes are straightforward
2. **Existing hooks work well** - `useDuelState()` hook provides get/set
3. **No complex state transitions** - Direct updates are clearer than actions
4. **Smaller bundle** - No need for additional reducer abstraction

## Current Approach (Better)

Duel state is managed via `useDuelState()` hook with direct updates:

```typescript
const [duelState, setDuelState] = useDuelState();

// Update duel state directly
setDuelState({
  ...duelState,
  currentSlideIndex: duelState.currentSlideIndex + 1,
  activePlayer: duelState.activePlayer === 1 ? 2 : 1,
});
```

This is:
- ✅ Simple and clear
- ✅ Easy to understand
- ✅ Sufficient for duel state complexity
- ✅ No additional abstraction needed

## When You Might Need a Reducer

Consider adding a reducer if:
- State updates become very complex (10+ fields changing together)
- Need to enforce specific state transition rules
- Multiple components need to dispatch same actions
- State logic becomes difficult to test

Currently, none of these apply.

## Alternative: Utility Functions

If update logic gets repetitive, create utility functions:

```typescript
// src/utils/duelHelpers.ts
export function advanceSlide(duelState: DuelState): DuelState {
  return {
    ...duelState,
    currentSlideIndex: duelState.currentSlideIndex + 1,
    activePlayer: duelState.activePlayer === 1 ? 2 : 1,
  };
}

export function applySkipPenalty(duelState: DuelState): DuelState {
  const time = duelState.activePlayer === 1
    ? duelState.timeRemaining1 - 3
    : duelState.timeRemaining2 - 3;

  return {
    ...duelState,
    timeRemaining1: duelState.activePlayer === 1 ? time : duelState.timeRemaining1,
    timeRemaining2: duelState.activePlayer === 2 ? time : duelState.timeRemaining2,
  };
}

// Usage
setDuelState(advanceSlide(duelState));
```

## Next Steps
- Skip this task
- Continue with Task 23 (BroadcastChannel sync)
- Only reconsider if state management becomes problematic

## Notes
- **YAGNI** - You Aren't Gonna Need It
- Keep it simple until complexity demands abstraction
- Direct state updates are perfectly fine for this app's scale
- Reducers add indirection without clear benefit here
