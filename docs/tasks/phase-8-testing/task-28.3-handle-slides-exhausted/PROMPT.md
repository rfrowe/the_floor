# Task 28.3: Handle Slides Exhausted Edge Case

## Objective
Implement proper handling for the edge case when a duel runs out of slides before either player's timer reaches zero, ensuring the player with the most time remaining wins (with tiebreaker).

## Status
Not Started

## Priority
**HIGH** - Edge case that could cause game-breaking issues if it occurs

## Acceptance Criteria
- [ ] Detect when all slides in a category are exhausted
- [ ] End duel immediately when last slide is answered
- [ ] Winner is determined by most time remaining
- [ ] Tiebreaker: If times are equal, Player 1 (duel initiator) wins
- [ ] Display appropriate message on Master View
- [ ] Display appropriate message on Audience View
- [ ] Standard duel end logic executes (category transfer, elimination)
- [ ] Edge case logged for game master awareness
- [ ] All tests passing including edge case scenarios

## Background

### Current End Condition
Duels currently end when:
- A player's timer reaches 0 seconds

### Missing End Condition
Duels should ALSO end when:
- All slides in the category are exhausted (all answered or skipped)

### Expected Behavior
When slides are exhausted:
1. Compare `timeRemaining1` and `timeRemaining2`
2. Player with MORE time remaining wins
3. If times are exactly equal (rare), Player 1 wins
4. Execute standard duel end logic
5. Notify game master that slides were exhausted

### Why This Matters
- Categories may have fewer slides than expected
- Rapid correct answers could exhaust slides quickly
- Game should not break or hang waiting for timer
- Clear winner determination prevents disputes

## Dependencies
- Task 15: Duel Controls - ✅ complete (duel end logic)
- Task 16: Timer Logic - ✅ complete (time tracking)
- Task 18: Slide Display - ✅ complete (slide advancement)

## Implementation Guidance

### 1. Detect Slide Exhaustion

**Location**: Master View or duel control logic

```typescript
function checkSlidesExhausted(duelState: DuelState): boolean {
  const { currentSlideIndex, category } = duelState;
  const totalSlides = category.slides.length;

  // Check if we've reached or exceeded the last slide
  return currentSlideIndex >= totalSlides;
}
```

**When to Check**:
- After "Correct" button advances slide
- After "Skip" button advances slide
- After any slide progression

### 2. Determine Winner by Time

```typescript
function determineWinnerByTime(duelState: DuelState): {
  winner: Contestant;
  loser: Contestant;
  reason: 'time-remaining' | 'tiebreaker';
} {
  const { contestant1, contestant2, timeRemaining1, timeRemaining2 } = duelState;

  if (timeRemaining1 > timeRemaining2) {
    return {
      winner: contestant1,
      loser: contestant2,
      reason: 'time-remaining',
    };
  } else if (timeRemaining2 > timeRemaining1) {
    return {
      winner: contestant2,
      loser: contestant1,
      reason: 'time-remaining',
    };
  } else {
    // Exact tie - Player 1 (initiator) wins
    return {
      winner: contestant1,
      loser: contestant2,
      reason: 'tiebreaker',
    };
  }
}
```

### 3. Integrate with Duel End Logic

**File**: `src/pages/MasterView.tsx` (or wherever duel logic resides)

```typescript
function handleCorrect() {
  // Advance to next slide
  const nextSlideIndex = duelState.currentSlideIndex + 1;

  // Check if slides exhausted BEFORE updating state
  if (nextSlideIndex >= duelState.category.slides.length) {
    // No more slides - end duel by time
    handleSlidesExhausted();
    return;
  }

  // Normal flow - advance slide
  setDuelState({
    ...duelState,
    currentSlideIndex: nextSlideIndex,
    activePlayer: duelState.activePlayer === 1 ? 2 : 1,
  });
}

function handleSlidesExhausted() {
  const { winner, loser, reason } = determineWinnerByTime(duelState);

  // Log for awareness
  console.warn('Duel ended: Slides exhausted', {
    winner: winner.name,
    loser: loser.name,
    reason,
    remainingTime: {
      [winner.name]: duelState.timeRemaining1,
      [loser.name]: duelState.timeRemaining2,
    },
  });

  // Show message to game master
  alert(`Slides exhausted! ${winner.name} wins with more time remaining.`);
  // Consider replacing alert with better UI (toast, modal, etc.)

  // Execute standard duel end logic
  endDuel(winner, loser);
}
```

### 4. Display Messages

#### Master View
```typescript
// Add visual indicator when slides are running low
function getSlidesRemainingWarning(duelState: DuelState): string | null {
  const remaining = duelState.category.slides.length - duelState.currentSlideIndex;

  if (remaining <= 3 && remaining > 0) {
    return `⚠️ Only ${remaining} slide${remaining === 1 ? '' : 's'} remaining!`;
  }

  return null;
}

// Display warning in Master View UI
{getSlidesRemainingWarning(duelState) && (
  <div className={styles['warning-banner']}>
    {getSlidesRemainingWarning(duelState)}
  </div>
)}
```

#### Audience View
```typescript
// Show subtle indicator or no change (Master View handles it)
// Audience sees normal duel end transition
```

### 5. Handle Edge Cases

#### 5.1 Last Slide Skipped
```typescript
function handleSkip() {
  // Show answer for 3 seconds
  setShowSkipAnswer(true);

  setTimeout(() => {
    setShowSkipAnswer(false);

    // Check if this was the last slide
    const nextSlideIndex = duelState.currentSlideIndex + 1;
    if (nextSlideIndex >= duelState.category.slides.length) {
      handleSlidesExhausted();
      return;
    }

    // Normal flow
    advanceSlide();
  }, 3000);
}
```

#### 5.2 Category with Zero Slides
```typescript
// Validate during duel setup
function validateDuelSetup(category: Category): boolean {
  if (category.slides.length === 0) {
    alert('Cannot start duel: Category has no slides!');
    return false;
  }

  if (category.slides.length < 5) {
    // Warn but allow
    const confirmed = confirm(
      `Warning: Category "${category.name}" only has ${category.slides.length} slides. Continue?`
    );
    return confirmed;
  }

  return true;
}
```

#### 5.3 Concurrent Timer Zero and Slide Exhaustion
```typescript
// Timer check has priority
useEffect(() => {
  if (duelState.timeRemaining1 <= 0) {
    // Timer expired - immediate end (takes precedence)
    handleTimerExpired(2); // Player 2 wins
    return;
  }

  if (duelState.timeRemaining2 <= 0) {
    handleTimerExpired(1); // Player 1 wins
    return;
  }

  // Timer check happens more frequently than slide exhaustion check
}, [duelState.timeRemaining1, duelState.timeRemaining2]);
```

### 6. Logging and Analytics

```typescript
// Log slide exhaustion events for analysis
function logSlidesExhausted(duelState: DuelState, winner: Contestant, loser: Contestant) {
  const event = {
    type: 'SLIDES_EXHAUSTED',
    timestamp: new Date().toISOString(),
    category: duelState.category.name,
    totalSlides: duelState.category.slides.length,
    winner: winner.name,
    loser: loser.name,
    timeRemaining1: duelState.timeRemaining1,
    timeRemaining2: duelState.timeRemaining2,
    tiebreaker: duelState.timeRemaining1 === duelState.timeRemaining2,
  };

  // Store in localStorage for later review
  const logs = JSON.parse(localStorage.getItem('the-floor:event-log') || '[]');
  logs.push(event);
  localStorage.setItem('the-floor:event-log', JSON.stringify(logs));

  console.log('Event logged:', event);
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('Slides Exhausted Handling', () => {
  it('detects when slides are exhausted', () => {
    const duelState: DuelState = {
      currentSlideIndex: 10,
      category: { slides: new Array(10) }, // 10 slides, index 10 is out of bounds
      // ... other fields
    };

    expect(checkSlidesExhausted(duelState)).toBe(true);
  });

  it('determines winner by time remaining', () => {
    const duelState: DuelState = {
      contestant1: { id: '1', name: 'Alice' },
      contestant2: { id: '2', name: 'Bob' },
      timeRemaining1: 15,
      timeRemaining2: 10,
      // ... other fields
    };

    const { winner } = determineWinnerByTime(duelState);
    expect(winner.name).toBe('Alice');
  });

  it('uses tiebreaker when times are equal', () => {
    const duelState: DuelState = {
      contestant1: { id: '1', name: 'Alice' },
      contestant2: { id: '2', name: 'Bob' },
      timeRemaining1: 15,
      timeRemaining2: 15, // Exact tie
      // ... other fields
    };

    const { winner, reason } = determineWinnerByTime(duelState);
    expect(winner.name).toBe('Alice'); // Player 1 wins
    expect(reason).toBe('tiebreaker');
  });

  it('handles last slide correctly', () => {
    const duelState: DuelState = {
      currentSlideIndex: 9,
      category: { slides: new Array(10) }, // Last slide (index 9)
      // ... other fields
    };

    // After answering last slide
    const nextIndex = duelState.currentSlideIndex + 1;
    expect(nextIndex >= duelState.category.slides.length).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Duel with Slides Exhaustion', () => {
  it('ends duel when slides exhausted', async () => {
    // Set up duel with only 2 slides
    const contestants = [mockContestant1, mockContestant2];
    const category = { name: 'Test', slides: [slide1, slide2] };

    // Start duel
    const { result } = renderHook(() => useDuelState());
    act(() => {
      startDuel(contestants[0], contestants[1], category);
    });

    // Answer first slide
    act(() => {
      handleCorrect();
    });

    // Answer second slide - should trigger exhaustion
    act(() => {
      handleCorrect();
    });

    // Verify duel ended
    expect(result.current.duelState).toBeNull();
    // Verify winner was determined by time
  });
});
```

### Manual Test Cases

#### Test Case 1: Normal Exhaustion
1. Create category with exactly 5 slides
2. Start duel between two contestants
3. Answer all 5 slides correctly
4. Verify duel ends after 5th slide
5. Verify player with more time wins

#### Test Case 2: Exhaustion with Skip
1. Create category with 3 slides
2. Start duel
3. Skip slide 1 (3 second penalty)
4. Answer slide 2 correctly
5. Skip slide 3 (last slide)
6. Verify duel ends after skip animation
7. Verify winner determined by time (accounting for penalties)

#### Test Case 3: Exact Time Tie
1. Create category with 2 slides
2. Pause timers (if possible) or engineer scenario
3. Ensure both players have exactly equal time
4. Exhaust slides
5. Verify Player 1 wins (tiebreaker)

#### Test Case 4: Very Few Slides
1. Create category with only 1 slide
2. Verify warning shown during setup
3. Start duel anyway
4. Answer slide
5. Verify duel ends immediately

### Edge Case Test Matrix

| Scenario | Expected Behavior |
|----------|-------------------|
| Normal exhaustion (P1 > time) | P1 wins |
| Normal exhaustion (P2 > time) | P2 wins |
| Exact tie | P1 wins (tiebreaker) |
| Last slide skipped | Winner after skip animation |
| Timer expires during exhaustion check | Timer takes precedence |
| Category with 0 slides | Prevented during setup |
| Category with 1 slide | Warning shown, allowed |

## UI/UX Considerations

### Game Master Feedback
- Show slide count on Master View: "Slide 3 / 10"
- Warning when < 3 slides remaining
- Clear message when exhaustion occurs
- Time remaining clearly visible

### Audience Experience
- No change needed - normal duel end transition
- Optionally show "All slides completed!" message

### Warning Styling

```css
/* MasterView.module.css */
.warning-banner {
  background: #ff9800;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-weight: bold;
  text-align: center;
}
```

## Success Criteria
- Duel ends gracefully when slides exhausted
- Winner determined by time remaining
- Tiebreaker works correctly
- Game master notified clearly
- No crashes or undefined behavior
- All edge cases handled
- Tests cover exhaustion scenarios
- Works with both Correct and Skip paths

## Out of Scope
- Preventing slides from being exhausted (game design decision)
- Adding more slides dynamically during duel
- Adjusting timer based on remaining slides
- Complex tiebreaker rules beyond "Player 1 wins"
- Replaying exhausted categories
- Slide recycling or repetition

## Performance Considerations

### Slide Count Check
- Very lightweight operation (simple comparison)
- No performance impact

### Logging
- Minimal overhead
- Consider debouncing if logging is expensive

## Accessibility Considerations

### Screen Reader Announcements
```typescript
<div role="status" aria-live="polite">
  {slidesRemaining <= 3 && `${slidesRemaining} slides remaining`}
</div>
```

### Visual Indicators
- Clear progress bar or slide counter
- High contrast warning banner
- Obvious end-of-duel message

## Future Enhancements
- Slide counter progress bar on Audience View
- Slide difficulty scaling (harder slides toward end)
- Bonus time for exhausting all slides
- Achievement: "Sweep" for winning with time to spare
- Analytics: Track average slides per duel

## Notes
- **This edge case is unlikely** but could occur with:
  - Small categories (< 10 slides)
  - Very skilled players answering quickly
  - Categories designed to be exhaustible
- **Prevention**: Encourage categories with 20+ slides
- **Logging helps** identify categories that run out often
- **Tiebreaker rule** (Player 1 wins) is arbitrary but must be consistent
- **Alternative tiebreakers** could be: most wins, random, sudden death slide
- **Game master should be warned** during import if category has few slides
- Consider adding slide count validation to PPTX import (Task 06)
- Document this rule in game instructions for players

## Implementation Checklist

- [ ] Add `checkSlidesExhausted()` function
- [ ] Add `determineWinnerByTime()` function
- [ ] Integrate exhaustion check in `handleCorrect()`
- [ ] Integrate exhaustion check in `handleSkip()`
- [ ] Add slide count warning UI to Master View
- [ ] Add exhaustion message/notification
- [ ] Add validation during duel setup
- [ ] Add logging for analytics
- [ ] Write unit tests for edge case logic
- [ ] Write integration tests for exhaustion scenario
- [ ] Manual testing with small categories
- [ ] Update documentation
- [ ] Code review focusing on edge cases

## Related Code Locations

### Files to Modify
```
src/pages/MasterView.tsx          - Add exhaustion detection
src/hooks/useDuelState.ts         - May need helper functions
src/utils/duelHelpers.ts          - Add winner determination logic
src/components/duel/SlideCounter.tsx (new?) - Show slide progress
```

### Functions to Update
- `handleCorrect()` - Add exhaustion check
- `handleSkip()` - Add exhaustion check
- `endDuel()` - Accept winner determined by time
- `startDuel()` - Add slide count validation

## Documentation Updates

After implementation:
1. Document tiebreaker rule in README or game rules
2. Add "Slides Exhausted" to event log documentation
3. Update SPEC.md if needed
4. Add comment explaining tiebreaker logic in code
5. Include in troubleshooting guide
