# Task 28.1: Master-Audience Timer Synchronization Fix

## Objective
Fix timer synchronization between Master View and Audience View to ensure accurate, fair gameplay with the Audience View as the authoritative timer source.

## Status
**CRITICAL BUG**: Timer synchronization has integration issues causing unfair gameplay and desynced displays.

## Problem Statement

**Current Issues:**
1. Master View and Audience View timers can drift out of sync
2. No clear source of truth for timer state
3. Skip penalty timing may not be consistent across views
4. Control transfer may not properly stop/start timers on both views
5. Timer may continue running when no audience view is open (unfair - contestants can't see slides)

**Root Cause:**
- Both views independently manage timer state
- localStorage sync has latency (~100-300ms)
- No authoritative timer source defined
- Race conditions during control transfers and skip animations

## Core Requirements

### 1. Audience View as Timer Authority
**Rule:** The Audience View MUST be the authoritative source for the game clock.

**Rationale:**
- Without the Audience View open, contestants can't see slides
- Running the clock while contestants can't see slides is fundamentally unfair
- Audience View has the larger, more visible timer display
- Matches real game show setup (audience display shows official time)

**Implementation:**
- Audience View owns and controls timer countdown
- Master View displays current time but does not independently count down
- Master View sends commands ("start", "pause", "penalty") via messages
- Audience View executes timing logic and broadcasts current state

### 2. Behavioral Cases

#### Case 1: Duel Start
```
WHEN: Master View clicks "Start Duel"
THEN:
  1. Master View saves DuelState to localStorage
  2. Master View sends TIMER_START command with initial times
  3. Audience View detects duel start
  4. Audience View begins countdown for Player 1
  5. Audience View broadcasts timer state every 100ms
  6. Master View receives broadcasts and displays current time
```

#### Case 2: Correct Answer
```
WHEN: Master View clicks "Correct"
THEN:
  1. Master View sends TIMER_PAUSE command
  2. Audience View pauses timer immediately
  3. Master View advances slide and switches active player
  4. Master View sends TIMER_RESUME command with new activePlayer
  5. Audience View resumes countdown for new active player
  6. Transition completes in <100ms
```

#### Case 3: Skip with 3-Second Penalty
```
WHEN: Master View clicks "Skip"
THEN:
  1. Master View sends SKIP_START command with answer and activePlayer
  2. Audience View:
     a. Shows answer overlay
     b. Continues counting down for 3.0 seconds (exact)
     c. Broadcasts SKIP_ACTIVE state
  3. Master View:
     a. Disables Correct/Skip buttons
     b. Displays "Answer showing to contestants..."
  4. After exactly 3.0 seconds:
     a. Audience View hides answer overlay
     b. Audience View checks if active player still has time
     c. If time > 0: Broadcasts SKIP_END with switch to other player
     d. If time <= 0: Broadcasts PLAYER_TIMEOUT with loser
  5. Master View receives end state and updates UI
```

#### Case 4: Time Expiration During Skip
```
WHEN: Active player's time hits 0 during skip animation
THEN:
  1. Audience View immediately stops countdown at 0
  2. Audience View completes skip animation (shows answer for remaining time up to 3s)
  3. Audience View broadcasts PLAYER_TIMEOUT
  4. Master View receives timeout and shows duel end screen
  5. Active player loses (time = 0), other player wins
```

#### Case 5: Time Expiration During Normal Play
```
WHEN: Active player's time hits 0 during their turn
THEN:
  1. Audience View stops countdown at 0
  2. Audience View broadcasts PLAYER_TIMEOUT immediately
  3. Master View receives timeout
  4. Master View handles duel end (active player loses)
  5. No need to wait for button press
```

#### Case 6: Control Transfer (Player Switch)
```
WHEN: Control transfers from Player A to Player B
THEN:
  1. Master View sends TIMER_SWITCH command with new activePlayer
  2. Audience View stops Player A's countdown
  3. Audience View starts Player B's countdown
  4. Transition is atomic (no gap or overlap)
  5. Both timers displayed correctly on both views
```

#### Case 7: No Audience View Open
```
WHEN: Master View is open but no Audience View exists
THEN:
  1. Master View detects no audience connection
  2. Master View shows warning: "⚠️ No Audience View Detected"
  3. Start Duel button is disabled
  4. Error message: "Open Audience View in new window to begin duel"
  5. Timer does not run (fair gameplay requirement)
```

#### Case 8: Audience View Opens Mid-Duel
```
WHEN: Audience View opens while duel is in progress
THEN:
  1. Audience View loads DuelState from localStorage
  2. Audience View loads TimerState from localStorage
  3. Audience View calculates time elapsed since lastUpdate
  4. Audience View adjusts timer to current time (accounting for elapsed time)
  5. Audience View takes over as authoritative source
  6. Continues countdown from correct position
```

#### Case 9: Master View Closes Mid-Duel
```
WHEN: Master View closes but Audience View is still open
THEN:
  1. Audience View continues displaying duel
  2. Audience View continues countdown (contestants can still see)
  3. When time expires, Audience View shows "Time Expired" message
  4. No winner declared (requires Master View to adjudicate)
  5. Duel state remains in localStorage for Master View to resolve
```

## Edge Cases

### Edge Case 1: Network Lag
```
SCENARIO: localStorage sync has 500ms+ delay
SOLUTION:
  - Audience View is authoritative, continues countdown
  - Master View shows "slightly delayed" indicator if >200ms lag
  - Sync completes when storage event fires
  - No gameplay impact (timer accuracy maintained)
```

### Edge Case 2: Clock Precision
```
SCENARIO: Timer needs to display to 0.1s precision
SOLUTION:
  - Update interval: 100ms (matches display resolution)
  - Display: Math.ceil(time * 10) / 10 for accurate rounding
  - Never display 0.0 while time > 0 (show 0.1 as minimum)
  - Only show 0.0 when time === 0
```

### Edge Case 3: Skip Ends Exactly at 0
```
SCENARIO: Skip animation ends at exactly t=0.0
SOLUTION:
  - Player loses (time expired)
  - Skip animation completes (full 3 seconds shown)
  - Audience View broadcasts PLAYER_TIMEOUT
  - Master View declares other player winner
```

### Edge Case 4: Both Players at 0
```
SCENARIO: Impossible via normal play, but handle defensively
SOLUTION:
  - Winner = player with more slides completed
  - If tied on slides: declare draw (edge case of edge case)
  - Log error: "Both players reached 0 time - should not happen"
```

### Edge Case 5: Multiple Audience Views
```
SCENARIO: User opens multiple Audience View windows
SOLUTION:
  - All audience views receive broadcasts
  - All stay in sync via storage events
  - First-opened view becomes authoritative (tracks in sessionStorage)
  - Others become read-only mirrors
  - If authoritative closes, another takes over seamlessly
```

### Edge Case 6: Skip During Last Second
```
SCENARIO: Player skips with 0.5s remaining
SOLUTION:
  - Skip animation starts
  - After 0.5s, timer hits 0
  - Audience View stops countdown, continues animation
  - Shows answer for remaining 2.5s (total 3s animation)
  - Player loses due to timeout
  - Skip penalty moot (already lost)
```

## Implementation Architecture

### Message Protocol

Use BroadcastChannel for low-latency messaging:

```typescript
// src/services/timerSync.ts

export type TimerMessage =
  | { type: 'TIMER_START'; player1Time: number; player2Time: number; activePlayer: 1 | 2 }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESUME'; activePlayer: 1 | 2 }
  | { type: 'TIMER_SWITCH'; activePlayer: 1 | 2 }
  | { type: 'SKIP_START'; answer: string; activePlayer: 1 | 2 }
  | { type: 'SKIP_END'; switchToPlayer: 1 | 2 }
  | { type: 'PLAYER_TIMEOUT'; loser: 1 | 2 }
  | { type: 'TIMER_UPDATE'; time1: number; time2: number; activePlayer: 1 | 2; timestamp: number }
  | { type: 'DUEL_END' };

interface TimerSyncService {
  // Master View methods
  sendStart(player1Time: number, player2Time: number, activePlayer: 1 | 2): void;
  sendPause(): void;
  sendResume(activePlayer: 1 | 2): void;
  sendSkip(answer: string, activePlayer: 1 | 2): void;
  sendDuelEnd(): void;

  // Audience View methods
  onMessage(callback: (message: TimerMessage) => void): () => void;
  broadcastTimerUpdate(time1: number, time2: number, activePlayer: 1 | 2): void;
  broadcastPlayerTimeout(loser: 1 | 2): void;
  broadcastSkipEnd(switchToPlayer: 1 | 2): void;

  // Connection detection
  isAudienceConnected(): boolean;
  waitForAudience(timeoutMs: number): Promise<boolean>;
}
```

### Hook Architecture

**Master View:**
```typescript
// useTimerCommands.ts - Master View sends commands only
const { sendStart, sendPause, sendResume, sendSkip, currentTime1, currentTime2 } = useTimerCommands();

// Displays time received from Audience broadcasts
// Does not independently count down
// Sends commands for actions (Correct, Skip, etc.)
```

**Audience View:**
```typescript
// useAuthoritativeTimer.ts - Audience View owns the clock
const { time1, time2, activePlayer, isSkipActive, skipAnswer } = useAuthoritativeTimer({
  onPlayerTimeout: (loser) => { /* show timeout message */ },
  onSkipEnd: (winner) => { /* hide answer, switch player */ }
});

// Runs countdown interval (100ms)
// Broadcasts timer updates
// Executes skip animation timing
// Handles all time-based logic
```

### Component Changes

**1. Master View (src/pages/MasterView.tsx)**
```typescript
// Current: Uses useGameTimer (independent countdown)
// New: Uses useTimerCommands (display + commands only)

const timerCommands = useTimerCommands();
const audienceConnected = useAudienceConnection();

// Show warning if no audience
{!audienceConnected && (
  <Alert variant="error">
    ⚠️ No Audience View detected. Open Audience View to start duel.
  </Alert>
)}

// Disable start if no audience
<Button
  onClick={handleStartDuel}
  disabled={!audienceConnected}
>
  Start Duel
</Button>

// Display time from broadcasts
<div>Player 1: {formatTime(timerCommands.currentTime1)}</div>
<div>Player 2: {formatTime(timerCommands.currentTime2)}</div>

// Send commands
<Button onClick={() => timerCommands.sendCorrect()}>Correct</Button>
<Button onClick={() => timerCommands.sendSkip(answer)}>Skip</Button>
```

**2. Audience View (src/pages/AudienceView.tsx)**
```typescript
// Current: Uses polled duelState with derived timer
// New: Uses useAuthoritativeTimer (owns countdown)

const authTimer = useAuthoritativeTimer({
  initialState: duelState,
  onPlayerTimeout: handleTimeout,
  onSkipEnd: handleSkipEnd,
});

// Display authoritative time
<ClockBar
  time1={authTimer.time1}
  time2={authTimer.time2}
  activePlayer={authTimer.activePlayer}
/>

// Show skip overlay when active
{authTimer.isSkipActive && (
  <SkipOverlay answer={authTimer.skipAnswer} />
)}
```

### Storage Strategy

**Dual Storage Approach:**

1. **DuelState (localStorage):**
   - Stores: slides, contestants, currentSlideIndex
   - Updates: On slide advance, player switch (low frequency)
   - Purpose: Game state persistence and recovery

2. **TimerState (BroadcastChannel + localStorage backup):**
   - BroadcastChannel: Real-time timer updates (every 100ms)
   - localStorage: Backup for recovery (updated every 1s)
   - Stores: time1, time2, activePlayer, lastUpdate timestamp
   - Purpose: Fast synchronization + persistence

**Why both?**
- BroadcastChannel: Low latency (~10-50ms) for real-time updates
- localStorage: Persistence for page refresh/recovery
- Separation: Frequent timer updates don't trigger full DuelState re-renders

## Acceptance Criteria

### Functional Requirements
- [ ] Audience View is authoritative timer source
- [ ] Master View cannot start duel without Audience View open
- [ ] Master View shows warning when Audience View not detected
- [ ] Correct button pauses timer, switches player, resumes timer
- [ ] Skip button shows answer for exactly 3.0 seconds
- [ ] Skip continues countdown during animation
- [ ] Skip respects time expiration (player loses if time hits 0 during skip)
- [ ] Control transfer is atomic (no overlap or gap in timing)
- [ ] Time expiration immediately ends turn
- [ ] Timer stops at exactly 0 (not negative)
- [ ] Timer displays to 0.1s precision with correct rounding

### Synchronization Requirements
- [ ] Timer sync latency <100ms under normal conditions
- [ ] Timer drift <0.1s over 30-second countdown
- [ ] Skip animation timing accurate within 50ms
- [ ] Control transfer completes in <100ms
- [ ] Audience View recovers correct time if opened mid-duel
- [ ] Multiple Audience Views stay synchronized
- [ ] Timer state persists across Master View refresh

### Edge Case Handling
- [ ] Graceful handling of no Audience View
- [ ] Correct behavior when Audience View opens mid-duel
- [ ] Proper timeout handling during skip animation
- [ ] Defensive handling of impossible states (both players at 0)
- [ ] Multiple Audience Views don't conflict
- [ ] Skip during last second works correctly

### Testing Requirements
- [ ] Unit tests for timer logic with mock time
- [ ] Integration tests for Master ↔ Audience sync
- [ ] Test all behavioral cases (1-9)
- [ ] Test all edge cases (1-6)
- [ ] Test network lag scenarios (simulated delays)
- [ ] Test rapid action sequences (Correct → Skip → Correct)
- [ ] Test time expiration during skip
- [ ] Verify 100ms update frequency
- [ ] Verify 0.1s display precision

## Implementation Plan

### Phase 1: Timer Sync Service (2 hours)
1. Create `src/services/timerSync.ts`
2. Implement BroadcastChannel messaging
3. Define message protocol (TypeScript types)
4. Add connection detection logic
5. Add fallback to localStorage events
6. Unit tests for message passing

### Phase 2: Authoritative Timer Hook (2 hours)
1. Create `src/hooks/useAuthoritativeTimer.ts`
2. Implement countdown logic with 100ms updates
3. Add skip animation timing (3.0s exact)
4. Add time expiration detection
5. Add player switch logic
6. Add recovery from persisted state
7. Unit tests with mock time

### Phase 3: Command Hook for Master (1 hour)
1. Create `src/hooks/useTimerCommands.ts`
2. Implement send methods (start, pause, skip, etc.)
3. Implement receive/display of timer updates
4. Add audience connection detection
5. Unit tests for command sending

### Phase 4: Master View Integration (1.5 hours)
1. Replace `useGameTimer` with `useTimerCommands`
2. Add audience connection warning UI
3. Disable start button when no audience
4. Update correct/skip handlers to use commands
5. Remove independent countdown logic
6. Update tests

### Phase 5: Audience View Integration (1.5 hours)
1. Replace polled timer with `useAuthoritativeTimer`
2. Update ClockBar to use authoritative time
3. Add skip overlay with answer display
4. Handle timeout notifications
5. Update tests

### Phase 6: Integration Testing (2 hours)
1. Test all behavioral cases manually
2. Test all edge cases
3. Test with simulated network lag
4. Test rapid action sequences
5. Verify precision and accuracy
6. Fix any discovered issues

**Total Estimate:** 10 hours

## Success Criteria

### Functional Success
- ✅ Complete duel playthrough with perfect timer sync
- ✅ Skip animation shows answer for exactly 3 seconds
- ✅ Time expiration during skip handled correctly
- ✅ Multiple player switches maintain sync
- ✅ No audience warning prevents unfair play

### Performance Success
- ✅ Sync latency <100ms (measured)
- ✅ Timer drift <0.1s after 30s (measured)
- ✅ Skip timing accuracy within 50ms (measured)
- ✅ Zero negative time values (verified)
- ✅ Display precision 0.1s (verified)

### Quality Success
- ✅ All tests passing (unit + integration)
- ✅ No console errors or warnings
- ✅ TypeScript strict mode passing
- ✅ Code review approved
- ✅ Manual testing checklist complete

## Testing Checklist

### Manual Test Scenarios

**Scenario 1: Normal Game Flow**
- [ ] Start duel with audience open
- [ ] Player 1 answers correctly (Correct button)
- [ ] Control transfers to Player 2
- [ ] Player 2 skips (Skip button)
- [ ] Answer shows for 3 seconds
- [ ] Control returns to Player 1
- [ ] Continue until duel ends naturally

**Scenario 2: Time Expiration**
- [ ] Start duel with short time (5 seconds)
- [ ] Let Player 1 time run to 0
- [ ] Verify immediate timeout detection
- [ ] Verify Player 2 wins
- [ ] Verify time stops at 0.0 (not negative)

**Scenario 3: Skip During Low Time**
- [ ] Player has 2 seconds remaining
- [ ] Press Skip button
- [ ] Verify countdown continues during answer display
- [ ] Verify timeout after 2 seconds (during skip)
- [ ] Verify answer stays visible for remaining skip time

**Scenario 4: No Audience View**
- [ ] Close all Audience Views
- [ ] Open Master View
- [ ] Verify warning message appears
- [ ] Verify Start Duel disabled
- [ ] Open Audience View
- [ ] Verify warning disappears
- [ ] Verify Start Duel enabled

**Scenario 5: Audience View Opens Mid-Duel**
- [ ] Start duel normally
- [ ] Let 5 seconds elapse
- [ ] Open new Audience View window
- [ ] Verify new view shows correct remaining time
- [ ] Verify countdown continues from correct position
- [ ] Verify no timer reset

**Scenario 6: Multiple Audience Views**
- [ ] Open 2 Audience View windows
- [ ] Start duel
- [ ] Verify both show same time
- [ ] Press Correct button
- [ ] Verify both switch players simultaneously
- [ ] Press Skip button
- [ ] Verify both show answer overlay
- [ ] Verify both countdown during skip

**Scenario 7: Rapid Actions**
- [ ] Press Correct → Correct → Skip → Correct in quick succession
- [ ] Verify all commands execute correctly
- [ ] Verify player switches happen
- [ ] Verify timer stays synchronized
- [ ] Verify no race conditions or crashes

**Scenario 8: Precision Verification**
- [ ] Start duel with 10.0 seconds
- [ ] Watch timer count down
- [ ] Verify displays: 10.0 → 9.9 → 9.8 → ... → 0.1 → 0.0
- [ ] Verify no skipped decimals
- [ ] Verify no premature 0.0 display (0.1 shows before 0.0)

## Out of Scope

- Slow-motion replays of timer expiration
- Timer accuracy better than 0.1s (display limitation)
- Network-based synchronization (multi-machine)
- Timer pause for contestant questions
- Variable skip penalty duration (fixed at 3s)
- Configurable update frequency (fixed at 100ms)

## References

- Task 15: Game Timer Hook (original timer implementation)
- Task 16: Duel Control Logic (correct/skip button logic)
- Task 23: Cross-Window Sync (BroadcastChannel approach)
- SPEC.md Section 4.4: Duel Mechanics
- SPEC.md Section 4.6: Game Flow

## Notes

**Why Audience View is Authoritative:**
This is not just a technical choice but a fundamental fairness requirement. If the timer runs while contestants cannot see slides (no Audience View), it creates an unfair game. The Audience View represents the contestant's perspective - they can only answer what they can see. Making it authoritative ensures the timer only runs when the game is actually playable from the contestant's viewpoint.

**100ms Update Frequency:**
Matches the 0.1s display resolution. Faster updates waste CPU with no user-visible benefit. Slower updates cause visible stuttering in the countdown.

**Skip Animation Timing:**
The 3-second skip penalty is not just a delay but a strategic game mechanic. The active player must watch the answer appear while their clock ticks down, creating tension and making skips costly. The timing must be exact to be fair.

**BroadcastChannel vs localStorage:**
- BroadcastChannel: Fast (~10-50ms), but not persistent
- localStorage: Slower (~100-300ms), but survives refresh
- Solution: Use both - BroadcastChannel for real-time, localStorage for backup

**Testing Strategy:**
Focus on timing-critical scenarios. Use manual testing for precision verification since automated timing tests can be flaky. Mock time in unit tests, verify real timing in integration tests.
