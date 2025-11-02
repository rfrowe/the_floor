# Manual Browser Testing Guide
## For Timer Accuracy and Duel State Management

**Purpose:** Validate timer accuracy and duel state management through manual browser testing, since these are difficult to test programmatically without E2E framework.

**When to use:** After completing Task 24 (unit tests) to validate real-world behavior before Task 26 (E2E tests).

---

## Test Environment Setup

### Prerequisites
1. Development server running: `npm run dev`
2. Two browser windows open:
   - Window 1: Master View (http://localhost:5173/master)
   - Window 2: Audience View (http://localhost:5173/audience)
3. Browser DevTools open in both windows (F12)
4. External stopwatch or phone timer for accuracy validation

### Initial Data Setup
1. Navigate to Dashboard (http://localhost:5173)
2. Import two contestants with categories:
   - Use `npm run parse:pptx` to create category JSON files
   - Or manually create contestants in UI
3. Ensure each contestant has a category with at least 5 slides

---

## Test Suite 1: Timer Accuracy

### Test 1.1: Basic Countdown Accuracy
**Goal:** Verify timer counts down at correct rate without drift

**Steps:**
1. Start duel from dashboard with 30-second timer
2. When duel starts, immediately start external stopwatch
3. Watch both timers side-by-side for full 30 seconds
4. Record results at key intervals:

| Real Time | App Timer | Difference | Notes |
|-----------|-----------|------------|-------|
| 10s       | ?         | ?          |       |
| 20s       | ?         | ?          |       |
| 30s       | ?         | ?          |       |

**Expected Result:**
- Drift < 1 second over 30 seconds
- Timer displays smooth countdown (no jumps)
- Timer reaches exactly 0:00.0 when stopwatch hits 30s (±1s acceptable)

**Pass Criteria:** ✅ Drift ≤ 1 second

---

### Test 1.2: Timer Synchronization Between Views
**Goal:** Verify Master View and Audience View timers stay in sync

**Steps:**
1. Start duel (30-second timer)
2. Arrange windows side-by-side
3. Watch both timers simultaneously
4. Record sync status every 5 seconds:

| Real Time | Master View | Audience View | Difference |
|-----------|-------------|---------------|------------|
| 5s        | ?           | ?             | ?          |
| 10s       | ?           | ?             | ?          |
| 15s       | ?           | ?             | ?          |
| 20s       | ?           | ?             | ?          |
| 25s       | ?           | ?             | ?          |
| 30s       | ?           | ?             | ?          |

**Expected Result:**
- Both timers show same time (±0.5s acceptable)
- Both timers update simultaneously
- No visual lag between views

**Pass Criteria:** ✅ Sync difference ≤ 0.5 seconds

---

### Test 1.3: Timer Accuracy During Interactions
**Goal:** Verify timer accuracy while user interacts with UI

**Steps:**
1. Start duel (30-second timer)
2. Start external stopwatch
3. While timer runs, perform these actions:
   - Click Correct button 3 times
   - Click Skip button 2 times
   - Press Space key 2 times
   - Press S key 1 time
   - Switch browser tabs back and forth
   - Minimize and restore window
4. After all actions, compare timers:

| Action Performed | Master Timer | Audience Timer | Stopwatch | Notes |
|------------------|--------------|----------------|-----------|-------|
| After 3 Correct  | ?            | ?              | ?         |       |
| After 2 Skip     | ?            | ?              | ?         |       |
| After tab switch | ?            | ?              | ?         |       |
| Final (at 0)     | ?            | ?              | ?         |       |

**Expected Result:**
- Timer continues counting during all interactions
- Timer accuracy maintained (drift < 1s)
- Skip actions deduct 3 seconds immediately

**Pass Criteria:** ✅ Timer accuracy maintained, skip penalty applied correctly

---

### Test 1.4: Long Duration Timer Test
**Goal:** Verify no cumulative drift over extended periods

**Steps:**
1. Modify game config to use 2-minute timer (120 seconds)
   - Open DevTools Console
   - Run: `localStorage.setItem('gameConfig', JSON.stringify({timerDuration: 120}))`
   - Refresh page
2. Start duel with 2-minute timer
3. Start external stopwatch
4. Record at 30-second intervals:

| Real Time | App Timer | Difference | Cumulative Drift |
|-----------|-----------|------------|------------------|
| 30s       | ?         | ?          | ?                |
| 60s       | ?         | ?          | ?                |
| 90s       | ?         | ?          | ?                |
| 120s      | ?         | ?          | ?                |

**Expected Result:**
- Cumulative drift < 2 seconds over 2 minutes
- Drift does not accelerate (linear at worst)

**Pass Criteria:** ✅ Cumulative drift ≤ 2 seconds over 120 seconds

---

### Test 1.5: Timer Warning Thresholds
**Goal:** Verify visual warnings appear at correct thresholds

**Steps:**
1. Start duel (30-second timer)
2. Watch timer display and note when colors change:

| Threshold | Expected Color | Actual Color | Time When Changed | Correct? |
|-----------|----------------|--------------|-------------------|----------|
| > 10s     | White/Normal   | ?            | N/A               | ?        |
| ≤ 10s     | Yellow         | ?            | ?                 | ?        |
| ≤ 5s      | Red (pulsing)  | ?            | ?                 | ?        |

**Expected Result:**
- Timer turns yellow at exactly 10.0s (±0.5s)
- Timer turns red and pulses at exactly 5.0s (±0.5s)
- Colors visible in both Master and Audience views

**Pass Criteria:** ✅ Colors change within ±0.5s of thresholds

---

### Test 1.6: Timer After Browser Sleep/Wake
**Goal:** Verify timer handles system sleep gracefully

**Steps:**
1. Start duel (30-second timer)
2. After 5 seconds, put computer to sleep (close laptop lid or sleep mode)
3. Wait 10 seconds (real time)
4. Wake computer
5. Observe timer behavior:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Timer value after wake | ~5s (continues counting) or 0s (expired) | ? | ? |
| Sync between views | Maintained | ? | ? |
| No crashes/errors | No errors | ? | ? |

**Expected Result:**
- Timer either continues or expires (both acceptable)
- No JavaScript errors in console
- App remains functional after wake

**Pass Criteria:** ✅ No crashes, app remains functional

---

## Test Suite 2: Duel State Management

### Test 2.1: State Persistence Across Refresh
**Goal:** Verify duel state survives page refresh

**Steps:**
1. Start duel from dashboard
2. Answer 2 questions correctly (advance 2 slides)
3. Note current state:
   - Active player: ?
   - Current slide: ?
   - Player 1 time: ?
   - Player 2 time: ?
4. Refresh Master View (F5)
5. Check state after refresh:

| State Field | Before Refresh | After Refresh | Preserved? |
|-------------|----------------|---------------|------------|
| Active player | ? | ? | ? |
| Current slide | ? | ? | ? |
| Player 1 time | ? | ? | ? |
| Player 2 time | ? | ? | ? |
| Slide images | ? | ? | ? |

**Expected Result:**
- All state preserved after refresh
- Timer continues from where it left off
- Current slide displayed correctly

**Pass Criteria:** ✅ All state preserved

---

### Test 2.2: Cross-Window State Synchronization
**Goal:** Verify state syncs between Master and Audience views

**Steps:**
1. Start duel (both windows open)
2. In Master View, click "Correct" button
3. Observe Audience View (should update automatically)
4. Record sync behavior:

| Action in Master | Audience View Response | Sync Time | Pass? |
|------------------|------------------------|-----------|-------|
| Click Correct (slide 1→2) | Advances slide | ? | ? |
| Click Skip | Shows skip animation | ? | ? |
| Player 1 finishes slides | Switches to Player 2 | ? | ? |
| Duel ends | Shows result/redirects | ? | ? |

**Expected Result:**
- Audience View updates within 1 second of Master action
- All state changes propagated correctly
- No missed updates

**Pass Criteria:** ✅ Sync delay ≤ 1 second

---

### Test 2.3: Skip Button Behavior
**Goal:** Verify skip functionality works correctly

**Steps:**
1. Start duel (30-second timer)
2. Click "Skip" button in Master View
3. Record observations:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Skip animation appears (Audience) | Yes, 3-second countdown | ? | ? |
| Timer pauses during skip | Yes | ? | ? |
| 3 seconds deducted | Yes | ? | ? |
| Slide advances after skip | Yes | ? | ? |
| Master view shows overlay | Yes | ? | ? |

4. Verify time deduction:
   - Time before skip: ?
   - Time after skip: ?
   - Difference: ? (should be ~3 seconds)

**Expected Result:**
- Skip animation plays for 3 seconds
- Exactly 3 seconds deducted from active player
- Slide advances after animation

**Pass Criteria:** ✅ 3-second deduction accurate, animation plays correctly

---

### Test 2.4: Correct Button Behavior
**Goal:** Verify correct answer advances game properly

**Steps:**
1. Start duel
2. Note current state (slide 1, Player 1 active)
3. Click "Correct" button
4. Record state changes:

| State Change | Before | After | Correct? |
|--------------|--------|-------|----------|
| Slide number | 1 | ? | Should be 2 |
| Active player | Player 1 | ? | Should stay Player 1 |
| Timer | Running | ? | Should keep running |
| Slide image | Slide 1 | ? | Should show Slide 2 |

5. Continue clicking "Correct" until Player 1 finishes all slides
6. Verify player switch:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Active player switches | Yes, to Player 2 | ? | ? |
| Timer switches | Yes, to Player 2's timer | ? | ? |
| Slides reset | Yes, to Player 2's slide 1 | ? | ? |

**Expected Result:**
- Each "Correct" click advances one slide
- Player completes all slides before switching
- Timer for active player continues counting

**Pass Criteria:** ✅ Slide advancement and player switching work correctly

---

### Test 2.5: Duel End Conditions
**Goal:** Verify duel ends correctly under different conditions

#### Test 2.5a: Normal Completion (Both Players Finish)
**Steps:**
1. Start duel
2. Complete all slides for Player 1 (click Correct repeatedly)
3. Complete all slides for Player 2
4. Record end state:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Winner determined | Player with more time remaining | ? | ? |
| Winner shown | Yes, in UI | ? | ? |
| Redirects to dashboard | Yes, after 3s | ? | ? |
| Winner's record updated | Wins +1 | ? | ? |
| Loser's record updated | Eliminated = true | ? | ? |

**Pass Criteria:** ✅ Winner determined correctly, records updated

---

#### Test 2.5b: Time Expiration (One Player Runs Out)
**Steps:**
1. Start duel with short timer (10 seconds)
2. Wait for Player 1's timer to reach 0:00.0
3. Do not answer any questions (let time run out)
4. Record behavior:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Timer stops at 0 | Yes | ? | ? |
| Player can still answer | No, disabled | ? | ? |
| Switches to Player 2 | Yes | ? | ? |
| Player 2 continues | Yes | ? | ? |
| Winner determined | Player 2 (has time) | ? | ? |

**Pass Criteria:** ✅ Time expiration handled correctly

---

#### Test 2.5c: Both Players Run Out of Time
**Steps:**
1. Start duel with very short timer (5 seconds)
2. Let both players' timers expire without answering
3. Record behavior:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Duel ends | Yes | ? | ? |
| Winner determined | Player who advanced more slides, or tie | ? | ? |
| Tie handling | Both eliminated or both survive | ? | ? |

**Pass Criteria:** ✅ Tie condition handled gracefully (no crash)

---

### Test 2.6: Keyboard Shortcuts
**Goal:** Verify keyboard shortcuts work correctly

**Steps:**
1. Start duel
2. Test each keyboard shortcut:

| Key | Expected Action | Actual Action | Works in Master? | Works in Audience? |
|-----|-----------------|---------------|------------------|-------------------|
| Space | Correct (advance slide) | ? | ? | Should not work |
| S | Skip | ? | ? | Should not work |
| Escape | Exit to dashboard | ? | ? | Should not work |

3. Verify shortcuts only work in Master View
4. Verify shortcuts don't interfere with typing (if any input fields)

**Expected Result:**
- All shortcuts work in Master View
- Shortcuts do NOT work in Audience View (security)
- No accidental triggers

**Pass Criteria:** ✅ All shortcuts work correctly in Master View only

---

### Test 2.7: State Cleanup After Duel
**Goal:** Verify state is properly cleaned up when duel ends

**Steps:**
1. Start duel
2. Complete duel (finish both players)
3. Return to dashboard
4. Check localStorage (DevTools → Application → Local Storage):

| Key | Expected | Actual | Clean? |
|-----|----------|--------|--------|
| `duel` | null or absent | ? | ? |
| `contestants` | Still present | ? | ? |
| `gameConfig` | Still present | ? | ? |

5. Try starting a new duel immediately after:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Can select contestants | Yes | ? | ? |
| Old duel data doesn't interfere | No interference | ? | ? |
| New duel starts fresh | Yes | ? | ? |

**Expected Result:**
- Duel state cleared from localStorage
- Contestant data preserved
- Can start new duel without issues

**Pass Criteria:** ✅ State cleaned up properly

---

## Test Suite 3: Edge Cases and Error Conditions

### Test 3.1: Rapid Button Clicking
**Goal:** Verify UI handles rapid input correctly

**Steps:**
1. Start duel
2. Click "Correct" button as fast as possible 10 times
3. Observe behavior:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Slides advance correctly | Yes, no skipped slides | ? | ? |
| No duplicate advances | Correct count | ? | ? |
| UI remains responsive | Yes | ? | ? |
| No JavaScript errors | No errors | ? | ? |

**Expected Result:**
- Each click registers exactly once
- No race conditions or duplicate state updates

**Pass Criteria:** ✅ All clicks processed correctly, no errors

---

### Test 3.2: Network Disconnect During Duel
**Goal:** Verify app handles offline state gracefully

**Steps:**
1. Start duel
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Continue playing duel (click Correct, Skip)
5. Record behavior:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| App continues working | Yes (localStorage-based) | ? | ? |
| No network errors | No visible errors | ? | ? |
| Sync still works | Yes (localStorage) | ? | ? |

**Expected Result:**
- App fully functional offline (no API calls needed)
- State sync via localStorage works

**Pass Criteria:** ✅ App works completely offline

---

### Test 3.3: Multiple Duels in Sequence
**Goal:** Verify app handles multiple duels without memory leaks

**Steps:**
1. Start duel #1 → Complete it → Return to dashboard
2. Start duel #2 → Complete it → Return to dashboard
3. Start duel #3 → Complete it → Return to dashboard
4. Check DevTools Console and Performance:

| Observation | After Duel #1 | After Duel #2 | After Duel #3 | Leak? |
|-------------|---------------|---------------|---------------|-------|
| Console errors | ? | ? | ? | ? |
| Memory usage (MB) | ? | ? | ? | ? |
| Event listeners count | ? | ? | ? | ? |
| DOM nodes count | ? | ? | ? | ? |

**Expected Result:**
- No memory increase between duels
- No orphaned event listeners
- No console errors

**Pass Criteria:** ✅ No memory leaks detected

---

### Test 3.4: Browser Back Button During Duel
**Goal:** Verify app handles navigation correctly

**Steps:**
1. Start duel
2. Click browser back button
3. Record behavior:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Returns to dashboard | Yes | ? | ? |
| Duel state cleared | Yes | ? | ? |
| No errors | No errors | ? | ? |
| Can start new duel | Yes | ? | ? |

4. Click browser forward button:

| Observation | Expected | Actual | Pass? |
|-------------|----------|--------|-------|
| Returns to duel | Maybe (depends on implementation) | ? | ? |
| Or shows error page | Acceptable | ? | ? |

**Expected Result:**
- Back button returns to dashboard gracefully
- No broken state

**Pass Criteria:** ✅ Navigation handled without errors

---

## Test Results Summary Template

### Test Session Information
- **Date:** _______________
- **Tester:** _______________
- **Browser:** _______________ (version: _______)
- **OS:** _______________
- **Commit SHA:** _______________

### Test Suite Results

| Test Suite | Tests Passed | Tests Failed | Pass Rate | Notes |
|------------|--------------|--------------|-----------|-------|
| Timer Accuracy (6 tests) | ? / 6 | ? | ?% | |
| Duel State Management (7 tests) | ? / 7 | ? | ?% | |
| Edge Cases (4 tests) | ? / 4 | ? | ?% | |
| **TOTAL** | **? / 17** | **?** | **?%** | |

### Critical Failures (if any)
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Recommended Actions
- [ ] All tests pass → Proceed to Task 25
- [ ] Minor issues found → Document and proceed
- [ ] Critical failures → Fix before proceeding

### Sign-off
- [ ] Timer accuracy validated (< 1s drift)
- [ ] State synchronization works correctly
- [ ] Duel end conditions handled properly
- [ ] No critical bugs found

**Tester Signature:** _______________
**Date:** _______________

---

## Tips for Effective Testing

1. **Use a stopwatch app** on your phone for accurate time comparison
2. **Take screenshots** of any unexpected behavior
3. **Check browser console** for errors after each test
4. **Test in multiple browsers** (Chrome, Firefox, Safari) if possible
5. **Test on different devices** (desktop, laptop, tablet) if available
6. **Document all observations**, even if they seem minor
7. **If a test fails, try it 2-3 times** to verify it's reproducible

---

## Troubleshooting Common Issues

### Timer appears frozen
- Check if tab is active (browsers throttle inactive tabs)
- Check console for JavaScript errors
- Verify `useGameTimer` hook is running

### State not syncing between windows
- Check if both windows are on same domain/port
- Verify localStorage is enabled in browser
- Check console for localStorage errors

### Buttons not responding
- Check if event listeners are attached (DevTools → Elements)
- Verify no JavaScript errors blocking execution
- Check if keyboard shortcuts are interfering

---

## After Testing

1. **Compile results** into test summary template
2. **Save this document** with your results in `docs/testing/manual-test-results-YYYY-MM-DD.md`
3. **Report critical issues** as GitHub issues or in task documentation
4. **Proceed to Task 25** (Component Tests) if all tests pass or only minor issues found

---

**End of Manual Browser Testing Guide**
