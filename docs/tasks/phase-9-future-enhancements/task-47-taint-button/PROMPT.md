# Task 47: Taint Button for Accidental Reveals

## Objective
Add a "Taint" button to the master controls that advances to the next slide without penalizing the active player, for cases where the answer is accidentally revealed by the audience or other external factors.

## Status
Not Started

## Priority
**MEDIUM** - Practical feature for handling real-world disruptions during gameplay.

## Background

During gameplay, accidents happen:
- Audience member shouts out an answer
- Technical glitch reveals the answer
- Someone looks at the game master's screen
- External disruption makes the question unplayable

In these cases, neither player should be rewarded or penalized. The game master needs a way to skip to the next slide without affecting time or control.

**Current Options**:
- "Correct" button: Gives point to active player (unfair)
- "Skip" button: Shows answer and penalizes time (unnecessary)

**Expected Behavior**:
- "Taint" button: Advances to next slide immediately
- No time penalty
- No control transfer
- No answer reveal (already revealed accidentally)
- Active player remains active
- Brief message explaining the taint

## Acceptance Criteria
- [ ] "Taint" button appears on Master View
- [ ] Clicking Taint advances to next slide immediately
- [ ] No time deducted from active player
- [ ] Active player control is maintained
- [ ] No answer reveal on Audience View (already known)
- [ ] Master View shows "Slide Tainted" message briefly
- [ ] Audience View shows brief message: "Question Skipped"
- [ ] Works at any point during slide display
- [ ] All tests passing
- [ ] Keyboard shortcut (e.g., 'T' key)

## Implementation Guidance

### 1. Add Taint Action to Duel Reducer

**File**: `src/hooks/useDuelState.ts`

```typescript
type DuelAction =
  | { type: 'TAINT'; timestamp: number }
  | // ... existing actions

function duelReducer(state: DuelState, action: DuelAction): DuelState {
  switch (action.type) {
    case 'TAINT': {
      // Advance to next slide without changing time or control
      const nextIndex = state.currentSlideIndex + 1;
      const maxIndex = state.category.slides.length - 1;

      if (nextIndex > maxIndex) {
        // No more slides - end duel
        return { ...state, ended: true };
      }

      return {
        ...state,
        currentSlideIndex: nextIndex,
        revealState: 'none',
        // activePlayer stays the same
        // times stay the same
      };
    }

    // ... other cases
  }
}
```

### 2. Add Taint Button to Master View

**File**: `src/pages/MasterView.tsx`

```typescript
const handleTaint = () => {
  dispatch({ type: 'TAINT', timestamp: Date.now() });
};

// Add keyboard shortcut
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey) {
      handleTaint();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);

return (
  <div>
    {/* ... existing controls */}
    <button
      onClick={handleTaint}
      className={styles['taint-button']}
      title="Skip tainted question (no penalty) - Keyboard: T"
    >
      ⚠️ Taint
    </button>
  </div>
);
```

### 3. Visual Feedback

**File**: `src/pages/MasterView.tsx`

```typescript
const [showTaintMessage, setShowTaintMessage] = useState(false);

const handleTaint = () => {
  dispatch({ type: 'TAINT', timestamp: Date.now() });
  setShowTaintMessage(true);
  setTimeout(() => setShowTaintMessage(false), 2000);
};

{showTaintMessage && (
  <div className={styles['taint-message']}>
    ⚠️ Slide Tainted - Advanced to next question
  </div>
)}
```

**File**: `src/pages/AudienceView.tsx`

```typescript
// Listen for TAINT action via BroadcastChannel
// Show brief message to audience

{showTaintMessage && (
  <div className={styles['taint-overlay']}>
    Question Skipped
  </div>
)}
```

### 4. Styling

**File**: `src/pages/MasterView.module.css`

```css
.taint-button {
  background: #f59e0b; /* Warning orange */
  color: white;
  border: 2px solid #d97706;
  font-weight: bold;
}

.taint-button:hover {
  background: #d97706;
}

.taint-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #f59e0b;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.5rem;
  z-index: 1000;
  animation: fadeInOut 2s;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  10%, 90% { opacity: 1; }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('TAINT action', () => {
  it('advances to next slide without changing time or control', () => {
    const initialState = {
      currentSlideIndex: 2,
      activePlayer: 'contestant1',
      contestant1Time: 30000,
      contestant2Time: 40000,
    };

    const newState = duelReducer(initialState, { type: 'TAINT', timestamp: Date.now() });

    expect(newState.currentSlideIndex).toBe(3);
    expect(newState.activePlayer).toBe('contestant1'); // Unchanged
    expect(newState.contestant1Time).toBe(30000); // Unchanged
    expect(newState.contestant2Time).toBe(40000); // Unchanged
  });

  it('ends duel if no more slides', () => {
    const initialState = {
      currentSlideIndex: 9,
      category: { slides: Array(10).fill({}) }, // Last slide
      activePlayer: 'contestant1',
    };

    const newState = duelReducer(initialState, { type: 'TAINT', timestamp: Date.now() });

    expect(newState.ended).toBe(true);
  });
});
```

### Integration Tests

```typescript
it('taint button advances slide without penalties', () => {
  const { getByText } = render(<MasterView duelState={mockDuelState} />);

  const initialSlide = mockDuelState.currentSlideIndex;
  const initialTime = mockDuelState.contestant1Time;

  fireEvent.click(getByText(/Taint/i));

  expect(mockDuelState.currentSlideIndex).toBe(initialSlide + 1);
  expect(mockDuelState.contestant1Time).toBe(initialTime);
});
```

### Manual Testing
- [ ] Start duel
- [ ] Click "Taint" button
- [ ] Verify next slide appears immediately
- [ ] Verify no time penalty
- [ ] Verify active player unchanged
- [ ] Verify message appears on both views
- [ ] Test keyboard shortcut ('T' key)
- [ ] Test tainting last slide (duel ends)

## Edge Cases

### Case 1: Taint on Last Slide
- No more slides available
- End duel normally
- Determine winner based on remaining time

### Case 2: Multiple Rapid Taints
- Debounce button to prevent accidental multi-click
- Or allow (each click advances one slide)

### Case 3: Taint During Skip Animation
- Cancel skip animation
- Advance to next slide immediately

### Case 4: Taint with Low Time
- Time doesn't change, so no instant-fail
- Continue normally

## Success Criteria
- Taint button advances slide without penalties
- No time deduction
- Active player control maintained
- Clear visual feedback
- Keyboard shortcut works
- All tests passing

## Out of Scope
- Undo/rollback tainted slide
- Logging tainted slides for review
- Different taint reasons (audience, technical, etc.)
- Taint history or statistics

## UI/UX Considerations

### Placement
- Position Taint button away from Correct/Skip to prevent accidental clicks
- Use warning color (orange/yellow)
- Clear label and icon

### Confirmation
- Consider requiring confirmation for first taint of game
- Or add setting to enable/disable confirmation

### Explanation
- Tooltip explains purpose
- On-screen help or guide for game masters

### Keyboard Shortcut
- 'T' for Taint (easy to remember)
- Document in shortcuts modal (if exists)

## Notes
- Essential for real-world gameplay
- Handles unavoidable disruptions gracefully
- Different from Skip (no penalty) and Correct (no reward)
- Maintains game fairness when accidents happen
- Should be rarely used but always available

## Related Tasks
- Task 15: Duel Controls (add alongside Correct/Skip)
- Task 20: Skip Animation (similar flow but different outcome)
- Task 27.5: Shortcuts Modal (document keyboard shortcut)
