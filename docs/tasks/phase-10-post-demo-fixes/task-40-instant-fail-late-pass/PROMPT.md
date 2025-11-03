# Task 40: Instant Fail and Reveal if Pass with <3 Seconds

## Objective
When a contestant passes with less than 3 seconds remaining on their clock, instantly declare them the loser, set their timer to zero, and show the correct answer for 3 seconds.

## Status
Not Started

## Priority
**HIGH** - This is a rules compliance and fairness bug. Passing with <3s currently gives an unfair advantage.

## Background

During the first live demo, it was discovered that passing with less than 3 seconds remaining creates an unfair advantage. Since passing shows the answer for 3 seconds (counted against the passing player's time), if a player has 2 seconds left and passes, they would theoretically go to -1 seconds.

**Current Behavior**:
- Player with 2s remaining clicks "Skip"
- Answer reveals for 3 seconds
- Player's time goes to -1s (or 0s with clamping)
- Game continues or ends unpredictably

**Expected Behavior**:
- Player with 2s remaining clicks "Skip"
- System immediately detects time < 3s
- Player instantly loses (timer set to 0)
- Answer still reveals for 3 seconds (for audience)
- After 3s, duel ends with other player as winner

**Rationale**: If you don't have enough time for the 3-second penalty, you've effectively run out of time. Passing becomes an instant forfeit.

## Acceptance Criteria
- [ ] Detect when "Skip" is pressed with <3s remaining
- [ ] Instantly set passing player's timer to 0
- [ ] Still show answer reveal for 3 seconds
- [ ] Duel ends after reveal with passing player as loser
- [ ] Master view shows "Insufficient time to pass" or similar message
- [ ] Audience view shows answer reveal normally
- [ ] Works for both P1 and P2
- [ ] Timer synchronization maintained
- [ ] All existing tests pass
- [ ] New tests cover late-pass scenario
- [ ] Edge case: Exactly 3s remaining allows normal pass

## Dependencies
- Task 20: Skip Animation - ✅ complete
- Task 28.1: Timer Sync Fix - ✅ complete
- Task 37: Duel Timeout Answer Reveal - Related (similar timeout handling)

## Implementation Guidance

### 1. Detect Late Pass in Skip Handler

**File**: `src/pages/MasterView.tsx`

```typescript
const handleSkip = () => {
  const currentPlayer = duelState.activePlayer;
  const timeRemaining = currentPlayer === 'contestant1'
    ? duelState.contestant1Time
    : duelState.contestant2Time;

  // Check if player has enough time for the 3-second penalty
  const SKIP_PENALTY_SECONDS = 3000; // 3 seconds in milliseconds

  if (timeRemaining < SKIP_PENALTY_SECONDS) {
    // Insufficient time to pass - instant loss
    handleLatePass(currentPlayer);
  } else {
    // Normal pass logic
    dispatch({ type: 'SKIP', timestamp: Date.now() });
  }
};

const handleLatePass = (player: 'contestant1' | 'contestant2') => {
  // Set player's time to 0
  dispatch({
    type: 'LATE_PASS',
    player,
    timestamp: Date.now()
  });

  // Answer will still reveal for 3s, then duel ends
};
```

### 2. Add LATE_PASS Action to Reducer

**File**: `src/hooks/useDuelState.ts`

```typescript
type DuelAction =
  | { type: 'LATE_PASS'; player: 'contestant1' | 'contestant2'; timestamp: number }
  | // ... existing actions

function duelReducer(state: DuelState, action: DuelAction): DuelState {
  switch (action.type) {
    case 'LATE_PASS': {
      const timeField = action.player === 'contestant1'
        ? 'contestant1Time'
        : 'contestant2Time';

      return {
        ...state,
        [timeField]: 0, // Set to zero
        revealState: 'late-pass', // New state
        revealStartTime: action.timestamp,
        // Keep activePlayer as is for reveal
      };
    }

    // ... other cases
  }
}
```

### 3. Handle Auto-End After Late Pass Reveal

**File**: `src/pages/MasterView.tsx`

```typescript
useEffect(() => {
  if (duelState.revealState === 'late-pass' && duelState.revealStartTime) {
    const elapsed = Date.now() - duelState.revealStartTime;

    if (elapsed >= 3000) {
      // Determine winner (the player who didn't late-pass)
      const loser = duelState.activePlayer === 'contestant1'
        ? contestant1
        : contestant2;
      const winner = duelState.activePlayer === 'contestant1'
        ? contestant2
        : contestant1;

      endDuel(winner, loser);
    }
  }
}, [duelState.revealState, duelState.revealStartTime]);
```

### 4. UI Feedback for Late Pass

**File**: `src/pages/MasterView.tsx`

```typescript
{duelState.revealState === 'late-pass' && (
  <div className={styles['late-pass-message']}>
    Insufficient time to pass! Revealing answer...
  </div>
)}
```

**File**: `src/components/duel/ClockBar.tsx`

```typescript
// Audience view shows answer reveal like normal skip
const shouldShowAnswer =
  duelState.revealState === 'skipping' ||
  duelState.revealState === 'late-pass' ||
  duelState.revealState === 'timeout';

if (shouldShowAnswer) {
  // Display answer (same as skip/timeout)
}
```

### 5. Disable Skip Button When Time Critical

Optional: Prevent clicking skip if <3s remaining

```typescript
const canSkip = activePlayerTime >= 3000;

<button
  onClick={handleSkip}
  disabled={!canSkip}
  title={!canSkip ? 'Insufficient time to pass' : 'Skip this question'}
>
  Skip {!canSkip && '(Time Critical)'}
</button>
```

**Note**: This is optional. The instant-fail behavior itself is the main fix. Disabling the button provides additional UX clarity.

## Testing Strategy

### Unit Tests

**File**: `src/hooks/useDuelState.test.ts`
```typescript
describe('LATE_PASS action', () => {
  it('sets player time to 0 and enters late-pass reveal state', () => {
    const initialState = {
      contestant1Time: 2000, // 2 seconds
      contestant2Time: 30000,
      activePlayer: 'contestant1',
      revealState: 'none',
    };

    const newState = duelReducer(initialState, {
      type: 'LATE_PASS',
      player: 'contestant1',
      timestamp: Date.now()
    });

    expect(newState.contestant1Time).toBe(0);
    expect(newState.revealState).toBe('late-pass');
    expect(newState.revealStartTime).toBeDefined();
  });
});
```

### Integration Tests

**File**: `src/pages/MasterView.test.tsx`
```typescript
it('instantly fails player who passes with <3s remaining', async () => {
  // Set up duel with contestant1 having 2s remaining
  const duelState = {
    contestant1Time: 2000,
    contestant2Time: 30000,
    activePlayer: 'contestant1',
  };

  const { getByText } = render(<MasterView duelState={duelState} />);

  // Click skip button
  fireEvent.click(getByText('Skip'));

  // Verify contestant1 time set to 0
  await waitFor(() => {
    expect(duelState.contestant1Time).toBe(0);
  });

  // Verify answer reveals
  expect(getByText(/Insufficient time/i)).toBeInTheDocument();

  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verify duel ended with contestant2 as winner
  // ... assertions
});

it('allows normal pass when >=3s remaining', () => {
  const duelState = {
    contestant1Time: 3000, // Exactly 3s
    contestant2Time: 30000,
    activePlayer: 'contestant1',
  };

  const { getByText } = render(<MasterView duelState={duelState} />);

  fireEvent.click(getByText('Skip'));

  // Should enter normal skip state, not late-pass
  // ... assertions
});
```

### Manual Testing
- [ ] Start duel with 45s per player
- [ ] Advance to slide where P1 has 2s remaining
- [ ] Click "Skip" button
- [ ] Verify timer immediately goes to 0
- [ ] Verify answer reveals for 3s
- [ ] Verify P2 wins after reveal
- [ ] Test with exactly 3s remaining (should allow normal pass)
- [ ] Test with 2.9s remaining (should instant-fail)
- [ ] Test with both players

## Edge Cases

### Case 1: Exactly 3 Seconds
- Use `>=` comparison to allow exactly 3s
- `if (timeRemaining >= 3000)` → normal pass
- `if (timeRemaining < 3000)` → late pass

### Case 2: Skip Button Pressed Multiple Times
- Debounce or disable after first click
- Late-pass logic should be idempotent

### Case 3: Time Runs Out During Skip Animation (Normal Skip)
- If player has 4s, skips, and during the 3s reveal their time reaches <1s
- Current skip logic handles this (time continues during reveal)
- No special handling needed

### Case 4: Both Players Low on Time
- Each player independently subject to late-pass rule
- Last player standing wins

### Case 5: Fractional Seconds
- Use milliseconds for precision
- <3000ms → late pass
- ≥3000ms → normal pass

## Success Criteria
- Passing with <3s instantly sets timer to 0
- Passing player immediately loses
- Answer still reveals for 3 seconds
- Duel ends after reveal period
- Winner determined correctly
- Clear UI feedback for game master
- All tests passing (517+ tests)
- No impact on normal (≥3s) pass behavior

## Out of Scope
- Warning indicator when time is low (future enhancement)
- Disabling skip button when <3s (optional, not required)
- Configurable penalty duration (hardcoded 3s is fine)
- Audio warning for low time (covered by Task 33)
- Different penalty for different time thresholds

## UI/UX Considerations

### Game Master Clarity
- Clear message: "Insufficient time to pass"
- Visual indication that player instantly lost
- Timer should visually snap to 0

### Audience View
- Audience sees answer reveal normally
- No need to explain the late-pass mechanic to audience
- Standard answer display for 3s

### Strategic Implications
- Players must be aware they can't pass with <3s
- Creates tension in low-time situations
- Encourages answering over passing when time is critical

### Button State (Optional)
If implementing button disable:
- Skip button grayed out or shows warning when <3s
- Tooltip: "Not enough time to pass"
- Visual countdown or color change as time approaches 3s

## Notes
- This rule prevents exploitation of the pass mechanic
- Maintains fairness: you need time to pay the penalty
- Answer still reveals for audience education
- Similar to timeout behavior (Task 37) but triggered by player action
- Relatively simple implementation, reuses reveal animation infrastructure
- Critical for competitive play

## Related Tasks
- Task 20: Skip Animation (reuses answer reveal)
- Task 37: Duel Timeout Answer Reveal (similar timeout handling)
- Task 28.1: Timer Sync Fix (timer accuracy)
