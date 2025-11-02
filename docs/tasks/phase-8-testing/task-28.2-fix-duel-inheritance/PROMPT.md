# Task 28.2: Fix Duel Category Inheritance Bug

## Objective
Fix critical bug where winning contestants incorrectly inherit the category that was played in the duel instead of the loser's currently owned category.

## Status
Not Started

## Priority
**HIGH** - Critical bug affecting core game logic and rule compliance

## Bug Report

**Issue**: When a contestant wins a duel, they are inheriting the category that was played (the slides used in the duel) instead of the loser's currently owned category.

**Expected Behavior**: Per SPEC.md section 4.1:
> "When a contestant wins a duel, they replace their current category with the loser's category (not the category that was played in the duel)."

**Current Behavior**: Winner takes the category that was used for the duel slides.

**Example Scenario**:
1. Alice owns "80s Movies" category
2. Bob owns "State Capitals" category
3. Duel is played using "80s Movies" slides (Alice's category)
4. Bob wins the duel
5. **Bug**: Bob now owns "80s Movies" (the played category) ✗
6. **Expected**: Bob should now own "80s Movies" (Alice's owned category) ✓

**In this specific example**, the bug doesn't appear because the played category and Alice's owned category are the same. The bug manifests in these scenarios:

**Actual Bug Example**:
1. Alice owns "80s Movies" category
2. Bob owns "State Capitals" category
3. Duel is played using "Science Facts" slides (from a third contestant Charlie who was eliminated)
4. Bob wins the duel
5. **Bug**: Bob now owns "Science Facts" (the played category) ✗
6. **Expected**: Bob now owns "80s Movies" (Alice's owned category) ✓

## Acceptance Criteria
- [ ] Winner inherits loser's currently owned category
- [ ] Winner does NOT inherit the category used for duel slides
- [ ] Loser is marked as eliminated
- [ ] Loser's previous category is transferred to winner
- [ ] Category transfer updates contestant state in storage
- [ ] All existing tests pass
- [ ] New test added to verify correct inheritance behavior
- [ ] Bug cannot reproduce after fix

## Dependencies
- Task 15: Duel Controls - ✅ complete (contains duel end logic)
- Task 05: Storage Layer - ✅ complete (contestant updates)
- Task 04: Data Models - ✅ complete (Contestant interface)

## Root Cause Analysis

### Likely Location
The bug is likely in the duel completion logic where the winner is determined and category transfer occurs.

**Files to Investigate**:
- `src/pages/MasterView.tsx` - Duel end handling
- `src/hooks/useDuelState.ts` - Duel state management
- `src/hooks/useContestants.ts` - Contestant updates
- Anywhere `handleDuelEnd()` or similar function is implemented

### Expected Logic Flow
```typescript
function handleDuelEnd(winner: Contestant, loser: Contestant) {
  // ✅ CORRECT: Winner takes loser's owned category
  const winnerNewCategory = loser.category; // Loser's OWNED category

  // Update winner
  updateContestant(winner.id, {
    category: winnerNewCategory, // ← loser's category
    wins: winner.wins + 1,
  });

  // Update loser
  updateContestant(loser.id, {
    eliminated: true,
  });
}
```

### Incorrect Logic (Current Bug)
```typescript
function handleDuelEnd(winner: Contestant, loser: Contestant, duelCategory: Category) {
  // ❌ INCORRECT: Winner takes duel category
  const winnerNewCategory = duelCategory; // Duel's PLAYED category

  // This is wrong! Should use loser.category instead
  updateContestant(winner.id, {
    category: winnerNewCategory, // ← wrong category
    wins: winner.wins + 1,
  });
}
```

## Implementation Guidance

### 1. Locate Duel End Logic

**Search for**:
```bash
# Find where duel ends are handled
grep -r "handleDuelEnd\|duel.*end\|winner.*category" src/
```

**Likely locations**:
- Master View component (button handlers)
- Duel state hook
- Game context provider

### 2. Review Current Implementation

Examine the code that executes when:
- A player's timer reaches 0
- "Correct" button advances to next slide and timer runs out
- Any other duel end condition

**Key Questions**:
- What category is being assigned to the winner?
- Is it `loser.category` (correct) or `duelState.category` (wrong)?
- Where is `duelState.category` coming from?

### 3. Understand Data Flow

**Duel State Structure** (from SPEC.md):
```typescript
interface DuelState {
  contestant1: Contestant;
  contestant2: Contestant;
  category: Category;        // ← Category used for THIS duel's slides
  currentSlideIndex: number;
  activePlayer: 1 | 2;
  timeRemaining1: number;
  timeRemaining2: number;
  status: 'active' | 'paused' | 'ended';
}
```

**Important**: `duelState.category` is the category being PLAYED (the slides), not necessarily the loser's owned category.

### 4. Fix the Bug

**Before** (Incorrect):
```typescript
const winner = determineWinner(duelState);
const loser = determineLoser(duelState);

// ❌ BUG: Using duel's played category
updateContestant(winner.id, {
  category: duelState.category, // WRONG
  wins: winner.wins + 1,
});
```

**After** (Correct):
```typescript
const winner = determineWinner(duelState);
const loser = determineLoser(duelState);

// ✅ CORRECT: Using loser's owned category
updateContestant(winner.id, {
  category: loser.category, // CORRECT - loser's owned category
  wins: winner.wins + 1,
});

// Mark loser as eliminated
updateContestant(loser.id, {
  eliminated: true,
});
```

### 5. Edge Cases to Handle

#### Case 1: Loser's owned category IS the duel category
```typescript
// This should work the same - no special handling needed
// Winner gets loser.category, which happens to equal duelState.category
```

#### Case 2: Duel uses a neutral/shared category
```typescript
// Winner should STILL get loser.category, not the neutral category
// The duel category is irrelevant to inheritance
```

#### Case 3: First duel (contestants may not have categories yet)
```typescript
// Verify contestants have categories before duel starts
// This should be validated during duel setup
if (!contestant1.category || !contestant2.category) {
  throw new Error('Contestants must have categories before dueling');
}
```

### 6. Add Tests

**File**: Create or update tests for duel logic

```typescript
describe('Duel Category Inheritance', () => {
  it('winner inherits loser owned category, not played category', () => {
    const alice: Contestant = {
      id: '1',
      name: 'Alice',
      category: { id: 'a', name: '80s Movies', slides: [] },
      wins: 2,
      eliminated: false,
    };

    const bob: Contestant = {
      id: '2',
      name: 'Bob',
      category: { id: 'b', name: 'State Capitals', slides: [] },
      wins: 1,
      eliminated: false,
    };

    const playedCategory: Category = {
      id: 'c',
      name: 'Science Facts', // Different from both owned categories
      slides: [], // ... slides for duel
    };

    // Simulate duel with Bob winning
    const duelState: DuelState = {
      contestant1: alice,
      contestant2: bob,
      category: playedCategory, // Played category (Science Facts)
      activePlayer: 1,
      timeRemaining1: 0, // Alice ran out of time
      timeRemaining2: 15,
      // ... other fields
    };

    // End duel
    const { winner, loser } = handleDuelEnd(duelState);

    // Verify winner (Bob) gets loser's (Alice's) owned category
    expect(winner.category.id).toBe('a'); // Alice's 80s Movies
    expect(winner.category.name).toBe('80s Movies');
    expect(winner.category.id).not.toBe('c'); // NOT Science Facts

    // Verify loser is eliminated
    expect(loser.eliminated).toBe(true);
  });

  it('winner inherits category even when played category matches', () => {
    const alice: Contestant = {
      id: '1',
      name: 'Alice',
      category: { id: 'a', name: '80s Movies', slides: [] },
      wins: 2,
      eliminated: false,
    };

    const bob: Contestant = {
      id: '2',
      name: 'Bob',
      category: { id: 'b', name: 'State Capitals', slides: [] },
      wins: 1,
      eliminated: false,
    };

    // Duel uses Alice's owned category
    const duelState: DuelState = {
      contestant1: alice,
      contestant2: bob,
      category: alice.category, // Alice's category is played
      activePlayer: 1,
      timeRemaining1: 0, // Alice loses
      timeRemaining2: 15,
      // ... other fields
    };

    const { winner, loser } = handleDuelEnd(duelState);

    // Bob (winner) should get Alice's category
    expect(winner.category.id).toBe('a');
    expect(winner.category.name).toBe('80s Movies');
  });
});
```

## Testing Strategy

### Reproduce the Bug
1. Set up three contestants with distinct categories:
   - Alice: "80s Movies"
   - Bob: "State Capitals"
   - Charlie: "Science Facts"
2. Eliminate Charlie
3. Start duel between Alice and Bob using Charlie's "Science Facts" category
4. Have Bob win the duel
5. **Bug**: Check if Bob now owns "Science Facts" (incorrect)
6. **Expected**: Bob should own "80s Movies" (Alice's category)

### Verify the Fix
1. Apply the fix
2. Repeat steps 1-4 above
3. Verify Bob now owns "80s Movies" (Alice's owned category)
4. Verify Alice is marked as eliminated
5. Run all tests and ensure they pass

### Manual Test Cases
- [ ] Test 1: Winner inherits loser's category (different from played)
- [ ] Test 2: Winner inherits loser's category (same as played)
- [ ] Test 3: Multiple duels in sequence - categories transfer correctly
- [ ] Test 4: Verify storage updates correctly
- [ ] Test 5: Refresh page and verify persisted state is correct

### Automated Tests
- [ ] Unit test for duel end logic
- [ ] Integration test for category transfer
- [ ] Test edge cases (same category, different category)

## Success Criteria
- Winner consistently inherits loser's owned category
- Winner never inherits played category (unless it's the loser's owned category)
- All tests pass including new inheritance test
- Bug cannot be reproduced with fix applied
- Code clearly documents expected behavior
- No regressions in other duel logic

## Verification Checklist

After implementing the fix:
- [ ] Review code changes - ensure loser.category is used, not duelState.category
- [ ] Add console logging to verify correct category transfer
- [ ] Test with multiple duels in sequence
- [ ] Verify localStorage reflects correct categories
- [ ] Check Dashboard shows correct categories after duel
- [ ] Confirm no TypeScript errors
- [ ] Run full test suite
- [ ] Manual testing with various scenarios

## Related Code Locations

### Files to Review
```
src/pages/MasterView.tsx          - Duel control logic
src/hooks/useDuelState.ts         - Duel state management
src/hooks/useContestants.ts       - Contestant updates
src/contexts/GameContext.tsx      - Global state (if used)
src/utils/duelHelpers.ts          - Helper functions (if exist)
```

### Key Functions
- `handleDuelEnd()` - Main duel completion logic
- `determineWinner()` - Determines winner based on time/state
- `updateContestant()` - Updates contestant in storage
- `endDuel()` - Cleanup and state reset

## Documentation Updates

After fixing:
1. Add comment in code explaining inheritance rule
2. Update SPEC.md if needed (should already be correct)
3. Document the bug fix in commit message
4. Add to CHANGELOG or known issues list

```typescript
// Example inline documentation
function handleDuelEnd(duelState: DuelState) {
  const winner = determineWinner(duelState);
  const loser = determineLoser(duelState);

  // IMPORTANT: Winner inherits the loser's OWNED category,
  // NOT the category that was played in the duel.
  // The played category (duelState.category) may be different
  // from the loser's owned category (loser.category).
  updateContestant(winner.id, {
    category: loser.category, // ← Always use loser's owned category
    wins: winner.wins + 1,
  });

  updateContestant(loser.id, {
    eliminated: true,
  });
}
```

## Regression Prevention

### Code Review Checklist
- [ ] Verify loser.category is used (not duelState.category)
- [ ] Check all paths to duel end trigger correct inheritance
- [ ] Ensure timeout and button-triggered ends both work correctly
- [ ] Validate tests cover this specific bug scenario

### Future Safeguards
- Add TypeScript types to make the distinction clearer
- Add linting rule or code comment warnings
- Include this test case in regression test suite

## Notes
- This is a **critical bug** that affects core game rules
- Fix should be prioritized over enhancements
- Thoroughly test before considering complete
- The bug may have been introduced by conflating "duel category" with "owned category"
- Clear naming conventions would prevent this: `playedCategory` vs `ownedCategory`
- Consider refactoring variable names for clarity after fix
