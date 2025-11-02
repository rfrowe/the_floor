# Task 20: Skip Animation Synchronization

## Objective
Implement skip animation synchronization so the audience view displays the answer overlay when master view triggers a skip.

## Status
**NOT STARTED**: ClockBar has `skipAnswer` prop support, but synchronization logic needs implementation.

## Acceptance Criteria
- [ ] Master view sets `isSkipAnimationActive` flag in duel state
- [ ] Audience view detects flag and shows answer in ClockBar
- [ ] Answer displays for exactly 3 seconds
- [ ] Smooth fade in/out transitions
- [ ] Synchronizes across windows via localStorage
- [ ] No flickering or race conditions

## Dependencies
- Task 16: Duel control logic in Master View (⚠️ skip button must be implemented)
- Task 19: ClockBar component (✅ complete - has `skipAnswer` prop)
- Task 18: Timer integration (⚠️ should be complete)

## Implementation Guidance

1. **Master View Skip Logic** (in Task 16):
   ```typescript
   const handleSkip = () => {
     const currentSlide = duelState.selectedCategory.slides[duelState.currentSlideIndex];
     const answer = currentSlide?.answer ?? 'Skipped';

     // Set skip animation state
     setDuelState({
       ...duelState,
       isSkipAnimationActive: true,
       skipAnswer: answer,  // Add this field to DuelState type
     });

     // After 3 seconds, clear flag and continue
     setTimeout(() => {
       // ... existing skip logic
       setDuelState({
         ...duelState,
         isSkipAnimationActive: false,
         skipAnswer: undefined,
         // ... other updates
       });
     }, 3000);
   };
   ```

2. **Update DuelState Type**:
   ```typescript
   // In @types/game.ts or wherever DuelState is defined
   interface DuelState {
     // ... existing fields
     isSkipAnimationActive: boolean;
     skipAnswer?: string;  // NEW: answer to display during skip
   }
   ```

3. **Audience View Integration**:
   ```typescript
   function AudienceView() {
     const [duelState] = useDuelState();

     return (
       <ClockBar
         // ... other props
         skipAnswer={duelState?.isSkipAnimationActive ? duelState.skipAnswer : undefined}
       />
     );
   }
   ```

4. **ClockBar Skip Overlay** (already exists):
   - ClockBar component already handles `skipAnswer` prop
   - Displays overlay in center of clock bar
   - Fades in/out with CSS transitions

5. **Synchronization**:
   - useDuelState hook saves to localStorage automatically
   - Audience view listens to storage events (existing)
   - Changes propagate within ~100-300ms

6. **Testing**:
   - Open master and audience views side-by-side
   - Click skip in master view
   - Verify answer appears in audience view
   - Confirm it displays for 3 seconds
   - Check that it disappears automatically

## Success Criteria
- Skip answer appears in audience view when skip triggered
- Timing is accurate (3 seconds ±0.1s)
- Synchronization works reliably
- No visual glitches or flickering
- Answer text is readable from distance
- Transitions are smooth

## Out of Scope
- Custom animation styles (keep existing fade)
- Skip animation preview in master view
- Configurable skip duration
- Sound effects or audio cues

## Notes
- ClockBar component is already built with skip overlay support
- Focus on state synchronization between views
- localStorage events provide automatic cross-window sync
- Skip timing happens in master view, audience just displays
- This enables the dramatic "reveal the answer" moment in gameplay
- Reference SPEC.md sections 3.3 and 3.4 for skip animation requirements
