# Task 44: Enhanced Winning Animation

## Objective
Create a celebratory winning animation with confetti and modal to make duel victories more exciting and climactic.

## Status
Not Started

## Priority
**LOW** - Polish feature that enhances user experience but not critical for gameplay.

## Background

During the live demo, duel endings felt anticlimactic. The winner was simply declared without fanfare, which didn't match the excitement of a game show environment.

**Current Behavior**: Duel ends, winner announced in text

**Expected Behavior**:
- Confetti animation
- Modal displaying winner information
- Optional celebratory sound effect
- Brief pause before returning to dashboard

## Acceptance Criteria
- [ ] Confetti animation displays on both master and audience views
- [ ] Modal shows winner name, category won, and win count
- [ ] Animation lasts 3-5 seconds
- [ ] Can be dismissed early with ESC or click
- [ ] Optional sound effect (if Task 33 implemented)
- [ ] Doesn't block navigation or game flow
- [ ] Works on all browsers
- [ ] All tests passing

## Implementation Guidance

### Use Library: canvas-confetti

```bash
npm install canvas-confetti
```

**File**: `src/components/duel/WinnerModal.tsx`

```typescript
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface WinnerModalProps {
  winner: Contestant;
  onClose: () => void;
}

export function WinnerModal({ winner, onClose }: WinnerModalProps) {
  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Auto-close after 5 seconds
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Modal open onClose={onClose}>
      <div className={styles['winner-modal']}>
        <h1>🎉 {winner.name} Wins! 🎉</h1>
        <p>New Category: {winner.category.name}</p>
        <p>Total Wins: {winner.wins}</p>
        <button onClick={onClose}>Continue</button>
      </div>
    </Modal>
  );
}
```

## Testing Strategy
- Trigger winning modal after duel
- Verify confetti displays
- Test auto-dismiss timer
- Test manual dismiss

## Success Criteria
- Winning feels celebratory
- Animation smooth and performant
- All tests passing

## Out of Scope
- Custom confetti colors
- Different animations for different win types
- Leaderboard display

## Related Tasks
- Task 33: Sound Effects (optional integration)
- Task 15: Duel Controls
