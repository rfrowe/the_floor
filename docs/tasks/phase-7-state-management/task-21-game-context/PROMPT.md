# Task 21: State Management Review (OPTIONAL)

## Objective
Review and optionally refactor state management patterns for consistency and maintainability.

## Status
**OPTIONAL/REVIEW TASK**: Current hook-based approach works well. This task is for future optimization.

## Current State Management
The application currently uses a **hook-based architecture** that works well:

### What Exists (and Works)
- ✅ `useContestants()` - IndexedDB hook for contestant CRUD
- ✅ `useDuelState()` - localStorage hook for duel state
- ✅ `useGameConfig()` - localStorage hook for config
- ✅ `useGameTimer()` - React hook for timer logic
- ✅ Direct hook usage in components (no context provider needed)

### Why It Works
- Simple and straightforward
- No prop drilling - hooks accessed where needed
- localStorage provides automatic persistence
- IndexedDB handles contestant data efficiently
- Each concern is isolated in its own hook

## When to Consider This Task

Only implement if you experience:
1. **Excessive re-renders** - components re-rendering unnecessarily
2. **State inconsistencies** - duel state out of sync between components
3. **Difficult testing** - hard to mock or test state logic
4. **Prop drilling** - passing props through many component layers

## Optional: React Context Approach

If needed, consider adding a context provider:

```typescript
// src/contexts/GameContext.tsx
interface GameContextValue {
  contestants: Contestant[];
  duelState: DuelState | null;
  addContestant: (contestant: Contestant) => Promise<void>;
  updateContestant: (id: string, updates: Partial<Contestant>) => Promise<void>;
  removeContestant: (id: string) => Promise<void>;
  startDuel: (config: DuelConfig) => void;
  updateDuel: (updates: Partial<DuelState>) => void;
  endDuel: (winner: Contestant, loser: Contestant) => void;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [contestants, contestantActions] = useContestants();
  const [duelState, setDuelState] = useDuelState();

  // Combine all state and actions
  const value: GameContextValue = {
    contestants,
    duelState,
    ...contestantActions,
    startDuel: (config) => { /* ... */ },
    updateDuel: setDuelState,
    endDuel: (winner, loser) => { /* ... */ },
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
```

## Optional: Reducer Pattern

If state updates become complex:

```typescript
// src/reducers/gameReducer.ts
type GameAction =
  | { type: 'ADD_CONTESTANT'; contestant: Contestant }
  | { type: 'REMOVE_CONTESTANT'; id: string }
  | { type: 'START_DUEL'; config: DuelConfig }
  | { type: 'UPDATE_DUEL'; updates: Partial<DuelState> }
  | { type: 'END_DUEL'; winner: Contestant; loser: Contestant };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADD_CONTESTANT':
      return { ...state, contestants: [...state.contestants, action.contestant] };
    // ... other cases
  }
}
```

## Decision Criteria

**Stick with current hooks** if:
- ✅ Application works reliably
- ✅ No performance issues
- ✅ Code is maintainable
- ✅ Testing is straightforward

**Add Context/Reducer** if:
- ❌ Experiencing frequent bugs related to state
- ❌ Multiple components need same state
- ❌ State updates are becoming complex
- ❌ Testing is difficult

## Recommendation

**For MVP: Skip this task entirely.**

The current hook-based approach is:
- Simple
- Working
- Easy to understand
- Sufficient for the application's complexity

Consider revisiting after:
- Phase 8 testing reveals issues
- User feedback indicates problems
- Team experiences maintainability challenges

## Notes
- **Don't refactor working code without good reason**
- Current architecture follows React best practices
- Context adds complexity without clear benefit here
- Premature optimization is the root of all evil
- Focus on completing features, not perfect architecture
