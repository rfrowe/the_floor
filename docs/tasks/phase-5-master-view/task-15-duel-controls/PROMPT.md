# Task 15: Game Timer Hook

## Objective
Create a useGameTimer hook that manages countdown timers for both players with accurate timing, pause/resume, and time expiration callbacks.

## Status
**NOT STARTED**: Timer functionality needs to be built.

## Acceptance Criteria
- [ ] Create `useGameTimer()` hook in `src/hooks/useGameTimer.ts`
- [ ] Counts down for active player only
- [ ] Updates every 100ms for smooth display
- [ ] Provides pause/resume functionality
- [ ] Triggers callback when player time reaches 0
- [ ] No time drift over long duels (accuracy within 0.1s)
- [ ] Hook is well-tested

## Dependencies
- Task 14: Master View Layout (can develop independently with tests)

## Implementation Guidance

1. **Hook Interface**:
   ```typescript
   interface GameTimerOptions {
     initialTime1: number;  // seconds
     initialTime2: number;  // seconds
     activePlayer: 1 | 2;
     onTimeExpired: (player: 1 | 2) => void;
   }

   interface GameTimerReturn {
     timeRemaining1: number;
     timeRemaining2: number;
     isRunning: boolean;
     pause: () => void;
     resume: () => void;
     updateTime: (player: 1 | 2, newTime: number) => void;
   }

   export function useGameTimer(options: GameTimerOptions): GameTimerReturn
   ```

2. **Timer Implementation**:
   - Use `setInterval` with 100ms interval
   - Track last update timestamp with `Date.now()` or `performance.now()`
   - Calculate elapsed time since last update
   - Decrement active player's time only
   - Prevent drift by comparing actual vs expected time

3. **Accuracy Pattern**:
   ```typescript
   const [lastUpdate, setLastUpdate] = useState(Date.now());

   useEffect(() => {
     const interval = setInterval(() => {
       const now = Date.now();
       const elapsed = (now - lastUpdate) / 1000; // to seconds

       setTimeRemaining(prev => Math.max(0, prev - elapsed));
       setLastUpdate(now);
     }, 100);

     return () => clearInterval(interval);
   }, [lastUpdate]);
   ```

4. **Pause/Resume**:
   - Clear interval on pause
   - Restart interval on resume
   - Maintain accurate time during pause

5. **Time Expiration**:
   - Check if time <= 0 after each update
   - Call `onTimeExpired(player)` when triggered
   - Automatically pause timer after expiration

6. **Update Time**:
   - Allow external updates (for skip penalty deductions)
   - Example: `updateTime(1, currentTime - 3)` for 3-second skip

7. **Testing**:
   - Timer counts down accurately
   - Only active player's time decrements
   - Pause stops counting
   - Resume continues from correct time
   - Time expiration triggers callback
   - No memory leaks from intervals
   - Drift stays within 0.1s over 60 seconds

## Success Criteria
- Timer accuracy within ±0.1 seconds over 60-second duration
- Smooth updates without flickering
- Pause/resume works instantly
- Time expiration handled correctly
- No memory leaks or performance issues
- All tests passing
- Easy to integrate with Master View

## Out of Scope
- Time display formatting (separate utility function)
- Visual countdown animations
- Sound effects or audio cues
- Time boost features
- Multiple simultaneous timers

## Notes
- **This is a critical component** - timing must be accurate
- Use high-precision timestamps
- Test thoroughly with various scenarios
- Consider using `useRef` to store interval ID
- Cleanup interval on unmount is essential
- The hook manages timing logic only, not display formatting
- Master View will use this hook and format time for display
