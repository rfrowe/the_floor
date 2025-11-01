# Task 21: Game Context & State Provider

## Objective
Create a React Context to manage global game state (contestants, configuration, duel state) and provide it to all components throughout the application.

## Acceptance Criteria
- [ ] GameContext created with React Context API
- [ ] GameProvider wraps the application
- [ ] State includes contestants, config, and current duel
- [ ] State loads from localStorage on mount
- [ ] State saves to localStorage on updates
- [ ] Custom hooks for accessing game state
- [ ] Type-safe context with TypeScript
- [ ] Tests verify context behavior

## State Structure
```typescript
interface GameState {
  contestants: Contestant[];
  config: GameConfig;
  duel: DuelState | null;
}
```

## Implementation Guidance
1. Create `src/contexts/GameContext.tsx`:
   ```typescript
   interface GameContextValue {
     state: GameState;
     actions: {
       // Contestant actions
       addContestant: (contestant: Contestant) => void;
       updateContestant: (id: string, updates: Partial<Contestant>) => void;
       removeContestant: (id: string) => void;

       // Config actions
       updateConfig: (config: Partial<GameConfig>) => void;

       // Duel actions
       startDuel: (config: DuelConfig) => void;
       updateDuel: (updates: Partial<DuelState>) => void;
       endDuel: (winner: Contestant, loser: Contestant) => void;
       clearDuel: () => void;
     };
   }
   ```

2. GameProvider implementation:
   - Initialize state from localStorage on mount
   - Provide state and actions via context
   - Save to localStorage whenever state changes
   - Use useReducer for complex state updates

3. Create custom hooks for convenient access:
   - `useGameState()` - returns full state and actions
   - `useContestants()` - returns contestants array and contestant actions
   - `useGameConfig()` - returns config and update function
   - `useDuelState()` - returns current duel and duel actions

4. localStorage integration:
   - Load initial state from localStorage (or defaults)
   - Subscribe to state changes and save automatically
   - Use debouncing to avoid excessive writes
   - Handle localStorage errors gracefully

5. Actions implementation:
   - **addContestant**: Append to contestants array, save to localStorage
   - **updateContestant**: Update by id, save to localStorage
   - **removeContestant**: Filter out by id, save to localStorage
   - **updateConfig**: Merge with existing config, save to localStorage
   - **startDuel**: Create new DuelState, save to localStorage
   - **updateDuel**: Update duel state, save to localStorage
   - **endDuel**: Update contestant records, clear duel, save to localStorage
   - **clearDuel**: Set duel to null, save to localStorage

6. Handle duel end logic:
   ```typescript
   function endDuel(winner: Contestant, loser: Contestant) {
     // Update winner: increment wins, inherit loser's unplayed category
     // Update loser: set eliminated = true
     // Clear duel state
     // Save to localStorage
   }
   ```

7. Type safety:
   - Use TypeScript generics for type-safe context
   - Provide proper return types for all hooks
   - Validate context exists (throw error if used outside provider)

8. Write tests:
   - Context provides state and actions
   - Actions update state correctly
   - Changes persist to localStorage
   - Hooks work as expected
   - End duel updates contestants properly

## Success Criteria
- All components can access game state via hooks
- State updates trigger re-renders appropriately
- localStorage sync works bidirectionally
- Actions are type-safe and well-documented
- No prop drilling throughout component tree
- Tests provide confidence in state management
- Performance is good (no excessive re-renders)

## Out of Scope
- Undo/redo functionality
- State versioning or migrations
- Server synchronization
- State debugging tools (can add later)

## Notes
- This is the central nervous system of the application
- Keep actions simple and predictable
- Use reducer pattern for complex updates
- Consider using Immer for immutable updates
- Coordinate with task-05 (storage layer) for localStorage abstraction
- Coordinate with task-15 (duel controls) for duel end logic
- Reference SPEC.md sections 3.5, 4, and 5.2 for requirements
