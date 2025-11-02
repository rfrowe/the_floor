# Task 27.7: Manual Testing Bug Fixes

## Objective
Fix bugs discovered through manual browser testing of the duel gameplay flow, focusing on timer synchronization, UI rendering issues, and game logic correctness.

## Status
✅ Completed

## Bugs Fixed

### Bug 1: Category Inheritance Logic ✅
**Issue**: Winner inherited the wrong category - they inherited the category that WAS used in the duel instead of the UNPLAYED category.

**Root Cause**: Confusion about which category should be inherited. The duel uses one player's category (`selectedCategory`), and the winner should inherit the OTHER player's category (the one not used).

**Fix** (MasterView.tsx:50-72):
- Clarified code comment: "Winner inherits the loser's category (the UNPLAYED category)"
- The loser's category is by definition the unplayed one
- `const inheritedCategory = loser.category;`

**Testing**: Manual verification that winner gets loser's category after duel ends.

---

### Bug 2: Timer Desynchronization Across Windows ✅
**Issue**:
- Timer countdown appeared on both MasterView and AudienceView initially
- After refresh, timer would start at 30 seconds instead of current time
- Sometimes timer wouldn't countdown until page refresh
- Timer values drifted between MasterView and AudienceView

**Root Cause**:
- MasterView only saved timer values to localStorage on specific events (correct answer, skip)
- AudienceView timer ran independently without continuous sync
- When refreshing, AudienceView loaded stale timer values from localStorage
- Two independent timers counting down at different rates caused drift

**Initial Fix Attempt (WRONG)**:
- Added continuous sync: MasterView updates localStorage every 1 second
- Problem: Caused duelState updates every second → React re-renders → **slide flashing**

**Correct Fix**:
- **Removed all continuous sync**
- Each view has its own independent timer counting down locally
- Timers only sync on meaningful events:
  1. Duel start (initial values in duelState)
  2. Player switches (handleCorrect updates duelState)
  3. Skip penalties (handleSkip updates duelState with penalized time)
  4. Time expiration (handled locally via onTimeExpired)
- Storage event listener in useDuelState propagates player switches
- Both timers run at same rate → naturally stay in sync
- No continuous re-renders = no flashing

**Files Modified**:
- `src/hooks/useGameTimer.ts` (lines 95-113): Changed initialization logic to detect significant changes (>0.5s) in timer values for sync points
- `src/pages/MasterView.tsx` (lines 104-110): Removed continuous sync interval, added explanation comment
- `src/hooks/useDuelState.ts`: Storage event listener already handles cross-window sync

**Testing**:
- Manual verification: Both timers count down smoothly
- Manual verification: Player switches work correctly
- Manual verification: No slide flashing during countdown
- Unit tests updated to reflect new behavior (timer NOT paused during player switch)

---

### Bug 3: Timer Not Running on MasterView After Player Switch ✅
**Issue**: When clicking "Correct" to switch players, the new player's timer only ran on AudienceView, not on MasterView.

**Root Cause**:
- Old code: `timer.pause()` → `setDuelState({...})` → `timer.resume()`
- Problem: `setDuelState` causes React re-render → NEW timer object created
- The `timer.resume()` call operated on OLD timer object (before re-render)
- NEW timer object (after re-render) never got resumed

**Fix** (MasterView.tsx:177-202):
- Removed `timer.pause()` and `timer.resume()` calls entirely
- Timer stays running through player switches
- When `activePlayer` changes in duelState, `useGameTimer` effect restarts:
  - Effect depends on `activePlayer` (line 211 in useGameTimer.ts)
  - Effect resets timestamp (line 165)
  - Timer automatically switches to new player
- Simpler and more reliable!

**Files Modified**:
- `src/pages/MasterView.tsx`: Removed pause/resume from `handleCorrect`
- `src/pages/MasterView.test.tsx`: Updated tests to verify timer NOT paused during player switch

**Testing**:
- All 408 tests pass
- Manual verification: Timer runs on both views after player switch

---

### Bug 4: Slide Flashing Every Second ✅
**Issue**: During timer countdown, the slide image flashed/flickered every second on both MasterView and AudienceView.

**Root Cause**: Continuous sync (from attempted Bug 2 fix) updated duelState every second → React re-render → DOM update → visual flash

**Fix**: See Bug 2 - removed continuous sync entirely. Timers run independently without causing duelState updates.

**Testing**:
- Manual verification: Slide displays smoothly without flashing
- No re-renders during timer countdown

---

## Implementation Details

### Files Modified
1. **src/hooks/useGameTimer.ts**
   - Changed initialization effect to handle sync points
   - Track previous timer values to detect changes >0.5s
   - Update timer state when values change significantly

2. **src/pages/MasterView.tsx**
   - Removed continuous sync interval
   - Removed pause/resume from handleCorrect
   - Timer runs continuously through player switches
   - Added explanatory comments about four-clock system

3. **src/pages/MasterView.test.tsx**
   - Updated test: "should advance slide and switch players when Correct is clicked"
   - Updated test: "should trigger Correct on Space key"
   - Changed expectations: timer should NOT be paused during player switch

4. **src/hooks/useDuelState.ts**
   - Already had storage event listener for cross-window sync
   - No changes needed - existing implementation sufficient

## The Four-Clock System

Understanding the architecture:
1. **MasterView timer** - runs locally, counts down every 100ms
2. **MasterView display** - shows local timer state
3. **AudienceView timer** - runs locally, counts down every 100ms
4. **AudienceView display** - shows local timer state

**Key Insight**: Timers don't need continuous sync! They only need:
- Same starting values (from duelState)
- Same countdown rate (100ms intervals)
- Sync on player switches (storage events)
- Sync on skip penalties (storage events)

## Success Criteria
- [x] Winner inherits correct category (loser's unplayed category)
- [x] Timers count down smoothly on both views
- [x] Timers stay in sync across windows
- [x] No slide flashing during countdown
- [x] Player switches work correctly on both views
- [x] All 408 tests pass
- [x] Build and lint pass
- [x] Manual testing confirms fixes

## Out of Scope
- Exact millisecond precision between windows (0.5s tolerance acceptable)
- Handling network-based multi-device sync (localStorage only)
- Visual timer synchronization indicators
- Advanced conflict resolution for simultaneous edits

## Notes
- Manual testing invaluable for discovering these bugs
- Four-clock system insight was key to solving timer issues
- Simpler solution (no continuous sync) is more robust
- Storage events provide sufficient cross-window communication
- Test coverage increased by 9 tests (3 in CategoryImporter, 5 in Dashboard, 1 reset utility)
