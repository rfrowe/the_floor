# Task 37: Show Correct Answer on Duel Timeout

## Objective
When a duel times out (active player reaches 0 seconds), reveal the correct answer on the audience view for 3 seconds before ending the duel, similar to the skip behavior.

## Status
Not Started

## Priority
**HIGH** - This is a rules compliance bug discovered during the first live demo that affects gameplay fairness and audience experience.

## Background

During the first live demo, when a player's time ran out, the duel immediately ended without showing the correct answer. This left the audience wondering what the answer was and felt abrupt.

**Current Behavior**:
- Player reaches 0 seconds
- Duel immediately ends
- Loser is determined (player who ran out of time)
- No answer reveal

**Expected Behavior**:
- Player reaches 0 seconds
- Clocks pause
- Correct answer displays for 3 seconds on audience view
- After 3 seconds, duel ends
- Loser is determined (player who ran out of time)

This should match the skip behavior: pause time, show answer, then continue/end.

## Acceptance Criteria
- [ ] When active player's timer reaches 0, clocks pause
- [ ] Correct answer displays in ClockBar for 3 seconds
- [ ] Censor boxes are removed during answer display
- [ ] After 3 seconds, duel ends automatically
- [ ] Winner/loser determined correctly (player with time remaining wins)
- [ ] Master view shows "Answer revealing..." state
- [ ] Audience view synchronized with master view
- [ ] No timer drift or synchronization issues
- [ ] All existing tests still pass
- [ ] New tests cover timeout reveal behavior
- [ ] Works with both P1 and P2 timeout scenarios

## Dependencies
- Task 20: Skip Animation - ✅ complete (reuse answer reveal logic)
- Task 28.1: Timer Sync Fix - ✅ complete
- Task 23: Cross-window sync - ✅ complete

## Implementation Guidance

### 1. Identify Timeout Event

**File**: `src/hooks/useAuthoritativeTimer.ts`

The timeout currently triggers an immediate end. We need to:
1. Detect when timer reaches 0
2. Pause both clocks
3. Trigger answer reveal
4. After 3s, end duel

```typescript
// Current behavior (simplified)
if (timeRemaining <= 0) {
  onDuelEnd(winner, loser);
}

// New behavior
if (timeRemaining <= 0) {
  onTimeout(activePlayer); // New callback
}
```

### 2. Add Timeout State

**File**: `src/types/game.ts`

```typescript
interface DuelState {
  // ... existing fields
  revealState: 'none' | 'skipping' | 'timeout' | 'correct'; // Extend existing or add new
}
```

### 3. Handle Timeout in Duel Reducer

**File**: `src/hooks/useDuelState.ts`

Add new action type:
```typescript
type DuelAction =
  | { type: 'TIMEOUT'; player: 'contestant1' | 'contestant2'; timestamp: number }
  | // ... existing actions

function duelReducer(state: DuelState, action: DuelAction): DuelState {
  switch (action.type) {
    case 'TIMEOUT':
      return {
        ...state,
        revealState: 'timeout',
        revealStartTime: action.timestamp,
        // Pause clocks (implementation depends on timer structure)
      };
    // ... other cases
  }
}
```

### 4. Reuse Skip Animation Logic

**File**: `src/components/duel/ClockBar.tsx`

The skip animation already shows the correct answer for 3s. Extend it to also show on timeout:

```typescript
const shouldShowAnswer =
  revealState === 'skipping' || revealState === 'timeout';

if (shouldShowAnswer) {
  // Display answer in center of clock bar
  // Hide censor boxes
}
```

### 5. Auto-End After Timeout Reveal

**File**: `src/pages/MasterView.tsx`

```typescript
useEffect(() => {
  if (revealState === 'timeout' && revealStartTime) {
    const elapsed = Date.now() - revealStartTime;
    if (elapsed >= 3000) {
      // End duel, determine winner
      const winner = activePlayer === 'contestant1' ? contestant2 : contestant1;
      const loser = activePlayer === 'contestant1' ? contestant1 : contestant2;
      endDuel(winner, loser);
    }
  }
}, [revealState, revealStartTime, activePlayer]);
```

### 6. Master View UI Update

Show visual indication that timeout occurred:
```typescript
{revealState === 'timeout' && (
  <div className={styles['timeout-message']}>
    Time's up! Revealing answer...
  </div>
)}
```

## Testing Strategy

### Unit Tests

**File**: `src/hooks/useDuelState.test.ts`
```typescript
it('should enter timeout reveal state when TIMEOUT action dispatched', () => {
  const { result } = renderHook(() => useDuelState());

  act(() => {
    result.current.dispatch({
      type: 'TIMEOUT',
      player: 'contestant1',
      timestamp: Date.now()
    });
  });

  expect(result.current.state.revealState).toBe('timeout');
});
```

### Integration Tests

**File**: `src/pages/MasterView.test.tsx`
```typescript
it('should show correct answer for 3s when player times out', async () => {
  // Mock timer reaching 0
  // Verify answer displays
  // Verify 3s delay before duel end
  // Verify correct winner determined
});
```

### Manual Testing
- [ ] Start duel with 5 seconds per player
- [ ] Let P1 run out of time without answering
- [ ] Verify answer shows for 3s
- [ ] Verify P2 wins
- [ ] Repeat with P2 timing out
- [ ] Verify audience view matches master view
- [ ] Check timer synchronization across windows

## Edge Cases

### Case 1: Timeout During Skip
If somehow a timeout occurs while skip animation is showing:
- Complete skip animation first
- Then process timeout

### Case 2: Multiple Rapid Timeouts
Should not be possible (only one player active), but guard against it.

### Case 3: Page Refresh During Timeout Reveal
- Persist reveal state to localStorage
- Resume reveal countdown on refresh

### Case 4: Last Slide + Timeout
- Show answer reveal as normal
- Then end duel
- Handle slide exhaustion separately (existing Task 28.3)

## Success Criteria
- Player timeout triggers 3-second answer reveal
- Answer displays on both master and audience views
- Clocks remain paused during reveal
- Duel ends automatically after 3 seconds
- Winner determined correctly (player with remaining time)
- No timer synchronization issues
- All tests passing (517+ tests)
- No regressions in skip behavior

## Out of Scope
- Custom timeout duration (hardcoded 3s is fine)
- Sound effects for timeout (covered by Task 33)
- Visual differentiation between skip and timeout reveals (can look identical)
- Timeout warnings before reaching 0 (future enhancement)
- Configurable timeout behavior

## UI/UX Considerations

### Visual Consistency
- Timeout reveal should look identical to skip reveal
- Use same ClockBar answer display
- Same censor box removal
- Same 3-second duration

### Game Master Clarity
- Master view should clearly indicate "Timeout" vs "Skip"
- But audience view can be identical (both show answer)

### Timing Accuracy
- Must be exactly 3 seconds (not 2.9 or 3.1)
- Synchronized across windows
- No timer drift

## Notes
- This behavior mirrors The Floor TV show rules
- Answer reveal on timeout is standard game show practice
- Improves audience experience (they learn the answer)
- Makes timeout less abrupt
- Reuses existing skip animation infrastructure
- Should be straightforward implementation since skip logic already exists

## Related Tasks
- Task 20: Skip Animation (reuse logic)
- Task 28.1: Timer Sync Fix (ensure no conflicts)
- Task 35: Demo Hotfixes (context of discovery)
- Task 40: Instant Fail Late Pass (related timing logic)
