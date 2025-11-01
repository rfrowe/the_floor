# Task 15: Duel Control Buttons

## Objective
Implement the Correct and Skip button functionality that controls duel flow, transfers control between players, and handles skip animations.

## Acceptance Criteria
- [ ] Correct button transfers control to opponent immediately
- [ ] Correct button advances to next slide
- [ ] Skip button triggers 3-second answer display on audience view
- [ ] Skip button counts 3 seconds against current player's time
- [ ] Skip button advances to next slide after animation
- [ ] Buttons disabled during skip animation
- [ ] Duel ends when player reaches 0 seconds
- [ ] Winner/loser determined and handled correctly
- [ ] State updates persist to localStorage
- [ ] Tests verify all control logic

## Button Behaviors

### Correct Button
From SPEC.md section 3.3:
1. Stop current player's clock
2. Advance to next slide
3. Transfer control to opponent (switch activePlayer)
4. Start opponent's clock
5. Update duel state in localStorage

### Skip Button
From SPEC.md sections 3.3 and 3.4:
1. Set `isSkipAnimationActive = true`
2. Trigger 3-second countdown (against current player)
3. Display answer on audience view
4. After 3 seconds:
   - Set `isSkipAnimationActive = false`
   - Advance to next slide
   - Check if current player's time <= 0:
     - If yes: end duel (they lose)
     - If no: transfer control to opponent
5. Update duel state in localStorage

## Implementation Guidance
1. Create custom hook `src/hooks/useDuelControls.ts`:
   ```typescript
   interface DuelControls {
     handleCorrect: () => void;
     handleSkip: () => void;
     canInteract: boolean; // false during skip animation
   }
   ```
2. Correct logic:
   - Pause timer (stop interval)
   - Increment `currentSlideIndex`
   - Toggle `activePlayer` (1 → 2 or 2 → 1)
   - If no more slides: handle duel end
   - Update state and save to localStorage
   - Resume timer for new active player
3. Skip logic:
   - Set `isSkipAnimationActive = true`
   - Start 3-second countdown using separate interval
   - Decrement current player's time during countdown
   - After 3 seconds:
     - Check if time <= 0: call `handleDuelEnd(loser)`
     - Otherwise: same as correct (advance slide, switch player)
   - Set `isSkipAnimationActive = false`
4. Duel end logic:
   - Determine winner and loser
   - Update contestant records:
     - Winner: increment wins
     - Loser: set eliminated = true
     - Winner: inherit loser's unplayed category
   - Clear duel state from localStorage
   - Navigate back to dashboard
   - Show end-of-duel modal/message
5. Disable buttons during skip animation:
   - Return `canInteract = false` while `isSkipAnimationActive`
   - Visually disable buttons (opacity, cursor)
6. Handle edge cases:
   - Last slide: end duel after correct/skip
   - Time reaches 0 during skip: handle immediately
   - Multiple rapid clicks: debounce or disable after click
7. Write tests:
   - Correct button advances slide and switches player
   - Skip button triggers animation and deducts 3 seconds
   - Duel ends correctly when time runs out
   - Winner inherits correct category

## Success Criteria
- Correct button works instantly and reliably
- Skip animation timing is accurate (exactly 3 seconds)
- Control transfers smoothly between players
- Time deduction during skip is accurate
- Duel ends correctly with proper winner/loser handling
- Category inheritance works as specified
- State persists correctly throughout
- Buttons cannot be spammed or cause race conditions
- Tests verify all scenarios

## Out of Scope
- Undo functionality
- Pause/resume duel
- Manual slide navigation
- Sound effects or additional feedback

## Notes
- This is the core game mechanic - must be rock solid
- Timing precision is critical for fair gameplay
- Test thoroughly with edge cases (low time, last slide, etc.)
- Coordinate with task-16 (timer logic) for time management
- Coordinate with task-23 (cross-window sync) for audience updates
- Reference SPEC.md sections 3.3, 5.2 for requirements
