# Task 16: Duel Control Logic

## Objective
Implement Correct and Skip button functionality in Master View that controls duel flow, manages timing, and handles duel completion.

## Status
**NOT STARTED**: Control buttons exist in layout but have no functionality.

## Acceptance Criteria
- [ ] Correct button advances slide and switches players
- [ ] Skip button triggers 3-second animation with time penalty
- [ ] Skip button disables controls during animation
- [ ] Duel ends when slides exhausted or time expires
- [ ] Winner/loser determined correctly
- [ ] Contestant records updated (wins, eliminated, category inheritance)
- [ ] Navigation back to dashboard after duel ends
- [ ] All state changes persist to localStorage
- [ ] Tests verify all control logic

## Dependencies
- Task 14: Master View Layout (✅ or in progress)
- Task 15: useGameTimer hook (⚠️ must be complete)
- Task 05: useDuelState hook (✅ complete)
- Task 05: useContestants hook (✅ complete)

## Implementation Guidance

1. **Correct Button Logic**:
   ```typescript
   const handleCorrect = () => {
     // 1. Pause timer
     pauseTimer();

     // 2. Advance to next slide
     const nextIndex = duelState.currentSlideIndex + 1;

     // 3. Check if last slide
     if (nextIndex >= slides.length) {
       handleDuelEnd(/* active player wins */);
       return;
     }

     // 4. Update duel state: increment slide, switch player
     setDuelState({
       ...duelState,
       currentSlideIndex: nextIndex,
       activePlayer: duelState.activePlayer === 1 ? 2 : 1,
     });

     // 5. Resume timer for new player
     resumeTimer();
   };
   ```

2. **Skip Button Logic**:
   ```typescript
   const handleSkip = () => {
     // 1. Set skip animation flag
     setDuelState({
       ...duelState,
       isSkipAnimationActive: true,
     });

     // 2. Start 3-second countdown
     setTimeout(() => {
       // 3. Deduct 3 seconds from current player
       const newTime = activePlayer === 1
         ? timeRemaining1 - 3
         : timeRemaining2 - 3;

       // 4. Check if time expired
       if (newTime <= 0) {
         handleDuelEnd(/* other player wins */);
         return;
       }

       // 5. Update time via timer hook
       updateTime(activePlayer, newTime);

       // 6. Advance slide and switch player (same as correct)
       const nextIndex = duelState.currentSlideIndex + 1;
       if (nextIndex >= slides.length) {
         handleDuelEnd(/* active player wins by completion */);
         return;
       }

       setDuelState({
         ...duelState,
         currentSlideIndex: nextIndex,
         activePlayer: duelState.activePlayer === 1 ? 2 : 1,
         isSkipAnimationActive: false,
       });
     }, 3000);
   };
   ```

3. **Duel End Logic**:
   ```typescript
   const handleDuelEnd = (winner: Contestant, loser: Contestant) => {
     // 1. Pause timer
     pauseTimer();

     // 2. Update winner
     updateContestant(winner.id, {
       wins: winner.wins + 1,
       // Winner inherits UNPLAYED category (not the duel category)
       category: loser.category,
     });

     // 3. Eliminate loser
     updateContestant(loser.id, {
       eliminated: true,
     });

     // 4. Clear duel state
     setDuelState(null);

     // 5. Navigate to dashboard
     navigate('/');

     // 6. Show completion message (optional)
     alert(`${winner.name} wins! They inherit ${loser.category.name}`);
   };
   ```

4. **Button Disabled State**:
   - Disable both buttons when `isSkipAnimationActive === true`
   - Visual indication: reduced opacity, cursor: not-allowed

5. **Keyboard Shortcuts**:
   - Space: trigger Correct
   - S key: trigger Skip
   - Ensure shortcuts don't fire during animation

6. **Edge Cases**:
   - Last slide + correct → winner by completion
   - Time expires during normal play → loser loses
   - Time expires during skip → loser loses
   - Both times at 0 (shouldn't happen) → handle gracefully

7. **Testing**:
   - Correct advances slide and switches player
   - Skip deducts 3 seconds and triggers animation
   - Duel ends correctly with winner/loser
   - Category inheritance is correct (UNPLAYED category)
   - Controls disabled during skip animation
   - Keyboard shortcuts work

## Success Criteria
- Correct button works instantly and reliably
- Skip animation timing is exactly 3 seconds
- Time deduction during skip is accurate
- Duel completion logic is correct
- Winner/loser determination is accurate
- Category inheritance works as specified
- State persists correctly
- No bugs or race conditions
- All tests passing

## Out of Scope
- Undo functionality
- Pause/resume duel
- Manual slide navigation
- Sound effects
- Detailed end-game modal/screen

## Notes
- **This is core gameplay logic** - must be rock solid
- Timing precision is critical for fairness
- Test edge cases thoroughly
- Category inheritance: winner gets UNPLAYED category (not the duel category)
- The DuelResult type in @types already has `inheritedCategory` field
- Coordinate with Task 15 (timer) for time management
- Reference SPEC.md sections 3.3, 5.2 for requirements
