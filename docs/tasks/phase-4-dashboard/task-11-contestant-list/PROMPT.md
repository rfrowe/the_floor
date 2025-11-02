# Task 11: Random Contestant Selection Hook

## Objective
Create a useRandomSelect hook that provides random contestant selection functionality for the Dashboard.

## Status
**NOT STARTED**: Selection logic exists inline in Dashboard, but random selection feature is missing.

## Acceptance Criteria
- [ ] Create `useRandomSelect()` hook in `src/hooks/useRandomSelect.ts`
- [ ] Hook provides `randomSelect()` function
- [ ] Selects one random contestant from non-eliminated pool
- [ ] Returns selected contestant (or null if none available)
- [ ] Hook is well-tested with edge cases
- [ ] Integration with Dashboard is straightforward

## Dependencies
- Task 10: Dashboard Layout (⚠️ partially complete - selection logic exists)

## Implementation Guidance

1. **Create Hook File**:
   ```typescript
   // src/hooks/useRandomSelect.ts
   import type { Contestant } from '@types';

   export function useRandomSelect() {
     const randomSelect = (contestants: Contestant[]): Contestant | null => {
       // Filter to non-eliminated contestants
       const eligibleContestants = contestants.filter(c => !c.eliminated);

       if (eligibleContestants.length === 0) {
         return null;
       }

       // Use crypto.getRandomValues for better randomness
       const randomIndex = Math.floor(Math.random() * eligibleContestants.length);
       const selected = eligibleContestants[randomIndex];

       return selected ?? null;
     };

     return { randomSelect };
   }
   ```

2. **Hook Behavior**:
   - Takes array of contestants as parameter
   - Filters out eliminated contestants
   - Returns random selection from eligible pool
   - Returns null if no eligible contestants

3. **Dashboard Integration** (for future task):
   - Add "Random Select" button to DuelSetup component
   - Call hook when button clicked
   - Handle result (select as contestant1 or contestant2)

4. **Testing**:
   - Test with empty array → returns null
   - Test with all eliminated → returns null
   - Test with one eligible → returns that one
   - Test with multiple eligible → returns random selection
   - Test distribution over many calls (verify randomness)

## Success Criteria
- Hook exists and exports randomSelect function
- Returns null when no eligible contestants
- Returns random contestant from eligible pool
- Randomness is fair (no obvious bias)
- All tests passing
- Hook is easy to integrate

## Out of Scope
- UI button or integration (Dashboard task)
- Animation or visual effects
- Multi-select or batch random selection
- Weighted randomness
- Exclusion lists (e.g., "don't pick this contestant")

## Notes
- **Keep it simple** - just the random selection logic
- Dashboard already has selection state management
- This hook is a pure utility function
- Consider using `crypto.getRandomValues()` for better randomness than `Math.random()`
- The hook doesn't need React state - it's just a utility function
- Could be a simple exported function instead of a hook, but keeping as hook for consistency
