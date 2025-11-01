# Task 04: Data Models & TypeScript Interfaces

## Objective
Define all TypeScript interfaces and types for the application's data models based on SPEC.md section 4.

## Acceptance Criteria
- [ ] All interfaces from SPEC.md section 4 are defined in `src/types/`
- [ ] Type definitions are properly exported and importable
- [ ] Utility types and helper functions for type guards are created where useful
- [ ] Enums or union types are used for constrained values (e.g., activePlayer: 1 | 2)
- [ ] JSDoc comments document non-obvious fields
- [ ] Types are validated with unit tests where applicable

## Required Interfaces
From SPEC.md section 4:
- `Contestant` - Player with categories, wins, elimination status
- `Category` - Topic with name and slides
- `Slide` - Image with answer and censor boxes
- `CensorBox` - Overlay box with position, size, and color
- `DuelState` - Current duel state with both contestants and timing
- `GameConfig` - Game settings like time limits

## Additional Types to Consider
- `GameState` - Overall game state (contestants, config, current duel)
- Type guards (e.g., `isContestantEliminated`, `isDuelActive`)
- Utility types for partial updates, creation payloads, etc.

## Implementation Guidance
1. Create `src/types/index.ts` as the main export point for all types
2. Consider creating separate files for related types:
   - `contestant.ts` - Contestant, Category
   - `slide.ts` - Slide, CensorBox
   - `duel.ts` - DuelState
   - `game.ts` - GameConfig, GameState
3. Use TypeScript best practices:
   - Prefer interfaces for objects that can be extended
   - Use type aliases for unions, intersections, or utility types
   - Add JSDoc comments for complex or non-obvious fields
4. Create type guard functions for runtime type checking:
   ```typescript
   export function isValidContestant(obj: unknown): obj is Contestant {
     // validation logic
   }
   ```
5. Add helper types for common operations:
   - `ContestantInput` for creating new contestants
   - `DuelResult` for duel outcomes
   - etc.

## Success Criteria
- All types from SPEC.md are implemented accurately
- Types can be imported cleanly: `import { Contestant, Slide } from '@/types'`
- TypeScript compilation shows no errors
- Type guards correctly validate data at runtime
- Code is well-documented with JSDoc comments
- Unit tests verify type guards work correctly

## Out of Scope
- Actual data fetching or state management (later tasks)
- Validation schemas (e.g., Zod) - keep it simple with TypeScript
- Complex generic types unless clearly needed

## Notes
- These types are the foundation for the entire application - take time to get them right
- Refer to SPEC.md section 4 as the source of truth
- Consider future extensibility but don't over-engineer
- Focus on type safety and developer experience
