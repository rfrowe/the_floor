# Task 16: Timer Logic & Display

## Objective
Implement accurate countdown timers for both players that update in real-time, pause/resume correctly, and trigger duel end when time expires.

## Acceptance Criteria
- [ ] Timer counts down for active player only
- [ ] Updates every 100ms for smooth display
- [ ] Pauses when control transfers (between correct/skip actions)
- [ ] Continues for skip animation (3 seconds against current player)
- [ ] Triggers duel end when player reaches 0 seconds
- [ ] Displays time remaining in clear format (MM:SS or SS.S)
- [ ] Visual warning when time is low (< 10 seconds)
- [ ] Timer state persists across page refreshes
- [ ] No time drift or inaccuracy over long duels
- [ ] Tests verify timer accuracy

## Timer Requirements
- **Precision**: Update every 100ms (10 times per second) for smooth countdown
- **Accuracy**: Use performance.now() or Date.now() to prevent drift
- **Format**: Display as "30s" or "0:30" for readability
- **Warning state**: Red color or pulsing when < 10 seconds
- **Persistence**: Save time remaining to localStorage periodically

## Implementation Guidance
1. Create custom hook `src/hooks/useGameTimer.ts`:
   ```typescript
   interface GameTimer {
     timeRemaining1: number; // seconds
     timeRemaining2: number; // seconds
     isRunning: boolean;
     activePlayer: 1 | 2;
     pause: () => void;
     resume: () => void;
     reset: () => void;
   }
   ```
2. Timer implementation:
   - Use `setInterval` with 100ms interval
   - Track last update timestamp to calculate exact elapsed time
   - Prevent drift by comparing actual time vs expected time
   - Update only the active player's timer
   - Round to 1 decimal place for display
3. Pause/resume logic:
   - Pause when control transfers
   - Resume after state update completes
   - Maintain accurate time during pause
4. Persistence:
   - Save time remaining to localStorage every second
   - Load from localStorage on page refresh
   - Adjust for time elapsed during refresh (optional)
5. Time display component:
   - Format seconds as "MM:SS" (e.g., "1:23") or "SS" (e.g., "45s")
   - Large, clear font
   - Color coding:
     - Green: > 15 seconds
     - Yellow: 10-15 seconds
     - Red: < 10 seconds
     - Pulsing red: < 5 seconds
6. End-of-time handling:
   - When time reaches 0, trigger `onTimeExpired(player)`
   - Coordinate with task-15 for duel end logic
   - Ensure timer stops immediately (no negative time)
7. Write tests:
   - Timer counts down accurately
   - Only active player's timer decrements
   - Pause and resume work correctly
   - Time expiration triggers callback
   - No memory leaks from intervals

## Display Format Options
Choose based on UX testing:
- **Option 1**: "30s" (simple, clean)
- **Option 2**: "0:30" (familiar format)
- **Option 3**: "30.0s" (shows precision)

## Success Criteria
- Timer is accurate to within 0.1 seconds over 60-second duration
- Display updates smoothly without flickering
- No drift or cumulative errors
- Pause/resume works instantly
- Low time warning is visually obvious
- Time expiration handled immediately
- No memory leaks or performance issues
- Tests verify timing accuracy

## Out of Scope
- Time boost power-up (future feature)
- Adding time back to clock
- Custom timer speeds
- Slow-motion or fast-forward

## Notes
- Timing accuracy is critical for fair gameplay
- Use high-precision timestamps (performance.now())
- Test with various scenarios: quick answers, long waits, skip animations
- Consider audio cues for low time (< 10s) as future enhancement
- Coordinate with task-15 (controls) for integration
- Reference SPEC.md sections 3.3, 3.4, and 5.2 for requirements
