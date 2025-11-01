# Task 22: Duel Reducer

## Objective
Create a reducer to manage duel state transitions, handling actions like advancing slides, switching players, skip animations, and time updates.

## Acceptance Criteria
- [ ] Reducer handles all duel state transitions
- [ ] Actions are type-safe with discriminated unions
- [ ] State updates are immutable
- [ ] Logic is well-tested and bug-free
- [ ] Handles edge cases (last slide, time expiring, etc.)
- [ ] Pure functions (no side effects)
- [ ] Clear action types and creators
- [ ] Tests verify all state transitions

## Duel Actions
```typescript
type DuelAction =
  | { type: 'ADVANCE_SLIDE' }
  | { type: 'SWITCH_PLAYER' }
  | { type: 'UPDATE_TIME'; player: 1 | 2; time: number }
  | { type: 'START_SKIP_ANIMATION'; answer: string }
  | { type: 'END_SKIP_ANIMATION' }
  | { type: 'SET_ACTIVE_PLAYER'; player: 1 | 2 }
  | { type: 'RESET_DUEL'; duelState: DuelState };
```

## Implementation Guidance
1. Create `src/reducers/duelReducer.ts`:
   ```typescript
   export function duelReducer(
     state: DuelState,
     action: DuelAction
   ): DuelState {
     switch (action.type) {
       case 'ADVANCE_SLIDE':
         return { ...state, currentSlideIndex: state.currentSlideIndex + 1 };

       case 'SWITCH_PLAYER':
         return { ...state, activePlayer: state.activePlayer === 1 ? 2 : 1 };

       case 'UPDATE_TIME':
         if (action.player === 1) {
           return { ...state, timeRemaining1: action.time };
         } else {
           return { ...state, timeRemaining2: action.time };
         }

       // ... other cases
     }
   }
   ```

2. Action creators (optional but recommended):
   ```typescript
   export const duelActions = {
     advanceSlide: (): DuelAction => ({ type: 'ADVANCE_SLIDE' }),
     switchPlayer: (): DuelAction => ({ type: 'SWITCH_PLAYER' }),
     updateTime: (player: 1 | 2, time: number): DuelAction => ({
       type: 'UPDATE_TIME',
       player,
       time,
     }),
     // ...
   };
   ```

3. Handle complex actions:
   - **ADVANCE_SLIDE**: Increment currentSlideIndex, check bounds
   - **SWITCH_PLAYER**: Toggle activePlayer (1 ↔ 2)
   - **UPDATE_TIME**: Update correct player's time
   - **START_SKIP_ANIMATION**: Set isSkipAnimationActive = true
   - **END_SKIP_ANIMATION**: Set isSkipAnimationActive = false
   - **RESET_DUEL**: Replace entire state (for new duel)

4. Compose actions for complex operations:
   - Correct answer: ADVANCE_SLIDE + SWITCH_PLAYER
   - Skip: START_SKIP_ANIMATION + (wait 3s) + END_SKIP_ANIMATION + ADVANCE_SLIDE + SWITCH_PLAYER
   - These compositions happen at the hook/component level, not in reducer

5. Handle edge cases:
   - currentSlideIndex >= total slides: don't advance further
   - Time < 0: clamp to 0
   - Invalid player: throw error or ignore

6. Keep reducer pure:
   - No side effects (API calls, localStorage, timers)
   - Always return new state object
   - Don't mutate input state
   - Deterministic: same input → same output

7. Write comprehensive tests:
   - Each action type produces correct state
   - Edge cases handled properly
   - State immutability maintained
   - Invalid actions handled gracefully

## Usage Example
```typescript
const [duelState, dispatch] = useReducer(duelReducer, initialDuelState);

// When correct button clicked:
dispatch({ type: 'ADVANCE_SLIDE' });
dispatch({ type: 'SWITCH_PLAYER' });

// When time ticks:
dispatch({ type: 'UPDATE_TIME', player: activePlayer, time: newTime });
```

## Success Criteria
- All duel state transitions work correctly
- Reducer is pure and testable
- Actions are type-safe
- Edge cases don't break the reducer
- Tests cover all actions and edge cases
- Code is clear and maintainable
- No mutations of state

## Out of Scope
- Side effects (handled by hooks/components)
- Async actions
- Middleware
- Time management (handled separately)

## Notes
- Keep the reducer simple and focused
- Complex logic should be in action creators or hooks
- Reducer should be easy to reason about
- Consider using Immer if updates get complex
- Coordinate with task-21 (game context) for integration
- Coordinate with task-15 (duel controls) for action usage
- Reference SPEC.md sections 3.3, 4.5, and 5.2 for requirements
