# Task 18: ClockBar Timer Integration

## Objective
Integrate the useGameTimer hook with the ClockBar component in AudienceView to show real-time countdown.

## Status
**NOT STARTED**: ClockBar component exists but shows static time values from duelState.

## Acceptance Criteria
- [ ] ClockBar displays live countdown using useGameTimer hook
- [ ] Time updates every 100ms smoothly
- [ ] Active player's time counts down
- [ ] Inactive player's time stays frozen
- [ ] Low-time warnings display correctly (< 10s red, < 5s pulsing)
- [ ] Time format is consistent (e.g., "28.5s")
- [ ] No flickering or visual jank

## Dependencies
- Task 15: useGameTimer hook (⚠️ must be complete)
- Task 19: ClockBar component (✅ complete)
- Task 17: AudienceView layout (✅ mostly complete)

## Implementation Guidance

1. **Integrate Timer in AudienceView**:
   ```typescript
   import { useGameTimer } from '@hooks/useGameTimer';

   function AudienceView() {
     const [duelState] = useDuelState();

     const { timeRemaining1, timeRemaining2 } = useGameTimer({
       initialTime1: duelState?.timeRemaining1 ?? 30,
       initialTime2: duelState?.timeRemaining2 ?? 30,
       activePlayer: duelState?.activePlayer ?? 1,
       onTimeExpired: () => {
         // In audience view, just display - don't handle expiration
         // Master view handles duel end logic
       },
     });

     return (
       <div>
         <ClockBar
           contestant1={duelState.contestant1}
           contestant2={duelState.contestant2}
           timeRemaining1={timeRemaining1}
           timeRemaining2={timeRemaining2}
           activePlayer={duelState.activePlayer}
           categoryName={duelState.selectedCategory.name}
         />
         {/* ... rest of view */}
       </div>
     );
   }
   ```

2. **Time Format Utility**:
   - ClockBar already has formatTime function
   - Ensure consistency across views
   - Format: "28.5s" for values < 60, "1:23.5" for 60+

3. **Synchronization Consideration**:
   - Timer runs independently in audience view
   - May drift from master view slightly
   - This is acceptable for now
   - Phase 7 will add BroadcastChannel for tighter sync

4. **Handle No Duel State**:
   - Show waiting screen when duelState is null
   - Don't render ClockBar without active duel

5. **Testing**:
   - Open audience view during active duel
   - Verify time counts down smoothly
   - Check that only active player's time decrements
   - Confirm low-time warnings appear
   - Test with different screen sizes

## Success Criteria
- Time countdown is smooth (no stuttering)
- Only active player's time decrements
- Timer stays accurate (within ~0.5s of master view)
- Low-time warnings are visible and clear
- No performance issues
- Works reliably across page refreshes

## Out of Scope
- Perfect synchronization with master view (Phase 7)
- Pause/resume from audience view
- Manual time adjustment
- Audio cues for low time

## Notes
- Audience view timer runs independently - not directly controlled by master
- Slight drift (<1s) is acceptable for MVP
- BroadcastChannel in Phase 7 will improve sync
- ClockBar already handles visual styling for low time
- Reference SPEC.md section 3.4 for audience view requirements
