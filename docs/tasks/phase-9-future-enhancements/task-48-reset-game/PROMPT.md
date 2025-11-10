# Task 48: Reset Game State (Keep Contestants)

## Objective
Implement a "Reset Game" feature that resets gameplay state (eliminated status, wins, initial categories) while preserving contestant roster and their original categories. This allows starting a new game with the same players.

## Priority
**MEDIUM** - Quality of life feature for running multiple games with same contestants

## Status
❌ Not Started

## Background
Task 31 (Reset App) provides a "nuclear" reset that deletes ALL data including contestants. This is useful for demos and fresh starts, but running multiple games with the same contestant roster requires:
1. Manually re-importing all contestants
2. Re-assigning starting categories
3. Tedious and error-prone process

A "Reset Game" feature would preserve the contestant roster and their original categories while resetting the game state, enabling quick successive games.

## Acceptance Criteria

### Core Functionality
- [ ] New "Reset Game" button in Dashboard (separate from "Reset App")
- [ ] Confirmation modal warns about resetting game state
- [ ] Modal clearly explains what is preserved vs. reset
- [ ] Resets all contestants:
  - [ ] `eliminated` → `false` (all contestants alive)
  - [ ] `wins` → `0` (win counts cleared)
  - [ ] `category` → original imported category (restore from backup)
  - [ ] `controlledSquares` → initial single square (reset territory)
  - [ ] `gridPosition` → preserved (maintain starting positions)
- [ ] Clears active duel state (localStorage `duel`)
- [ ] Clears timer state
- [ ] Preserves contestants in IndexedDB (roster intact)
- [ ] Preserves game config (settings remain)
- [ ] Preserves theme preference
- [ ] Page reloads after successful reset
- [ ] Error handling for reset failures

### Category Preservation Strategy
- [ ] Store original category when contestant first imported
- [ ] Use new field `originalCategory: Category` on Contestant interface
- [ ] Migration: populate `originalCategory` from existing `category` for legacy data
- [ ] Reset restores `category` from `originalCategory`

### UI/UX
- [ ] "Reset Game" button styled differently from "Reset App" (warning vs danger)
- [ ] Button placement near "Reset App" for logical grouping
- [ ] Clear visual distinction between the two reset options
- [ ] Tooltip/title explains difference between resets
- [ ] Confirmation modal has different color scheme (warning yellow vs danger red)
- [ ] Modal shows before/after comparison of what changes

### Testing
- [ ] Unit tests for reset game utility
- [ ] Tests verify contestants preserved
- [ ] Tests verify game state cleared
- [ ] Tests verify category restoration
- [ ] Tests verify error handling
- [ ] Integration tests for Dashboard button
- [ ] Manual test: import contestants → play game → reset game → verify state

## Implementation Guidance

### Phase 1: Data Model Update

1. **Update Contestant Interface** (`src/types/contestant.ts`):
```typescript
export interface Contestant {
  id: string;
  name: string;
  category: Category;
  originalCategory: Category; // NEW: backup of imported category
  wins: number;
  eliminated: boolean;
  gridPosition?: { row: number; col: number };
  controlledSquares?: string[];
}
```

2. **Migration Utility** (`src/utils/migrateContestants.ts`):
```typescript
/**
 * Migrate contestants to add originalCategory field
 * Run automatically on app load if needed
 */
export async function migrateContestantsToV2() {
  const contestants = await getAllContestants();
  let migrated = false;

  for (const contestant of contestants) {
    if (!contestant.originalCategory) {
      // Populate originalCategory from current category
      const updated = {
        ...contestant,
        originalCategory: contestant.category,
      };
      await updateContestant(updated);
      migrated = true;
    }
  }

  return migrated;
}
```

3. **Update Import Flow** - Ensure new contestants get `originalCategory` set:
```typescript
// In src/pages/Dashboard.tsx or wherever contestants are imported
const newContestant: Contestant = {
  // ... other fields
  category: importedCategory,
  originalCategory: importedCategory, // NEW: set on import
};
```

### Phase 2: Reset Game Utility

Create `src/utils/resetGame.ts`:

```typescript
import { getAllContestants, updateContestant } from '@/storage/indexedDB';
import { clearTimerState } from '@/storage/timerState';
import { resetColorAssignments } from '@/utils/colorUtils';

/**
 * Reset game state while preserving contestants
 * - Resets wins, eliminated status, territories
 * - Restores original categories
 * - Clears duel and timer state
 * - Preserves contestant roster, grid positions, theme
 */
export async function resetGameState(): Promise<void> {
  try {
    // Get all contestants
    const contestants = await getAllContestants();

    // Reset each contestant to initial state
    for (const contestant of contestants) {
      const reset: Contestant = {
        ...contestant,
        wins: 0,
        eliminated: false,
        category: contestant.originalCategory, // Restore original
        controlledSquares: contestant.gridPosition
          ? [`${contestant.gridPosition.row}-${contestant.gridPosition.col}`]
          : undefined,
      };
      await updateContestant(reset);
    }

    // Clear duel state
    localStorage.removeItem('duel');

    // Clear timer state
    clearTimerState();

    // Reset color assignments
    resetColorAssignments();

    // Broadcast reset to all windows
    try {
      const channel = new BroadcastChannel('the_floor_game_reset');
      channel.postMessage('reset');
      channel.close();
    } catch (error) {
      console.warn('BroadcastChannel not supported:', error);
    }

  } catch (error) {
    console.error('Error resetting game state:', error);
    throw new Error(
      `Failed to reset game state: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

### Phase 3: Dashboard Integration

Update `src/pages/Dashboard.tsx`:

```typescript
// Add state
const [showResetGameConfirm, setShowResetGameConfirm] = useState(false);

// Add handlers
const handleResetGameClick = () => {
  setShowResetGameConfirm(true);
};

const handleConfirmResetGame = async () => {
  try {
    await resetGameState();
    setShowResetGameConfirm(false);
    window.location.reload();
  } catch (error) {
    console.error('Failed to reset game:', error);
    alert(
      `Failed to reset game: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

const handleCancelResetGame = () => {
  setShowResetGameConfirm(false);
};

// Add button (near Reset App button)
<Button
  variant="warning"
  onClick={handleResetGameClick}
  title="Reset game state while keeping contestants"
>
  Reset Game
</Button>

// Add confirmation modal
<Modal
  isOpen={showResetGameConfirm}
  onClose={handleCancelResetGame}
  title="Reset Game State"
>
  <div className={styles['modal-content']}>
    <p><strong>This will reset the current game while keeping your contestants:</strong></p>

    <div className={styles['reset-comparison']}>
      <div>
        <h4>✅ Preserved:</h4>
        <ul>
          <li>All contestants (names and original categories)</li>
          <li>Grid starting positions</li>
          <li>Theme preference</li>
          <li>Game configuration</li>
        </ul>
      </div>

      <div>
        <h4>🔄 Reset:</h4>
        <ul>
          <li>Eliminated status → all alive</li>
          <li>Win counts → 0</li>
          <li>Current categories → original categories</li>
          <li>Territories → initial squares</li>
          <li>Active duel → cleared</li>
        </ul>
      </div>
    </div>

    <p><em>This allows you to start a new game with the same contestants.</em></p>
  </div>

  <div className={styles['modal-actions']}>
    <Button variant="secondary" onClick={handleCancelResetGame}>
      Cancel
    </Button>
    <Button variant="warning" onClick={handleConfirmResetGame}>
      Reset Game
    </Button>
  </div>
</Modal>
```

### Phase 4: Testing

Create `src/utils/resetGame.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetGameState } from './resetGame';
import * as indexedDB from '@/storage/indexedDB';

vi.mock('@/storage/indexedDB');
vi.mock('@/storage/timerState');
vi.mock('@/utils/colorUtils');

describe('resetGameState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should reset all contestants to initial state', async () => {
    const mockContestants: Contestant[] = [
      {
        id: '1',
        name: 'Alice',
        category: { name: 'History', slides: [] },
        originalCategory: { name: 'Science', slides: [] },
        wins: 5,
        eliminated: true,
        gridPosition: { row: 0, col: 0 },
        controlledSquares: ['0-0', '0-1', '1-0'],
      },
    ];

    vi.mocked(indexedDB.getAllContestants).mockResolvedValue(mockContestants);

    await resetGameState();

    expect(indexedDB.updateContestant).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        wins: 0,
        eliminated: false,
        category: { name: 'Science', slides: [] }, // Restored
        controlledSquares: ['0-0'], // Reset to single square
      })
    );
  });

  it('should clear duel state from localStorage', async () => {
    localStorage.setItem('duel', JSON.stringify({ /* duel data */ }));
    vi.mocked(indexedDB.getAllContestants).mockResolvedValue([]);

    await resetGameState();

    expect(localStorage.getItem('duel')).toBeNull();
  });

  it('should throw error if update fails', async () => {
    vi.mocked(indexedDB.getAllContestants).mockResolvedValue([
      { id: '1', name: 'Alice', /* ... */ } as Contestant,
    ]);
    vi.mocked(indexedDB.updateContestant).mockRejectedValue(new Error('DB error'));

    await expect(resetGameState()).rejects.toThrow('Failed to reset game state');
  });
});
```

### Phase 5: Multi-Window Sync

Update `src/App.tsx` or relevant component:

```typescript
useEffect(() => {
  const cleanup = onGameReset(() => {
    // Redirect to dashboard or reload
    window.location.href = '/';
  });

  return cleanup;
}, []);
```

Add listener to `resetGame.ts`:

```typescript
export function onGameReset(callback: () => void): () => void {
  try {
    const channel = new BroadcastChannel('the_floor_game_reset');
    channel.onmessage = () => callback();
    return () => channel.close();
  } catch (error) {
    console.warn('BroadcastChannel not supported:', error);
    return () => {};
  }
}
```

## Edge Cases

1. **Missing originalCategory** (legacy data):
   - Run migration on first app load
   - If missing, use current category as fallback
   - Log warning for manual review

2. **Contestant with no gridPosition**:
   - Set `controlledSquares` to `undefined`
   - Grid view will handle undefined gracefully

3. **Active duel during reset**:
   - Clear duel state completely
   - Both master and audience views redirect to dashboard

4. **Multiple windows open**:
   - BroadcastChannel triggers reload/redirect in all windows
   - Prevents stale state across views

5. **Reset failure mid-process**:
   - Some contestants reset, others not
   - Show error, recommend "Reset App" for clean state
   - Consider transaction-like behavior (all-or-nothing)

## UI/UX Considerations

### Button Placement
```
┌─────────────────────────────────────┐
│  Dashboard            [Reset Game]  │
│                       [Reset App]   │
└─────────────────────────────────────┘
```

### Visual Distinction
- **Reset Game**: Warning variant (orange/yellow)
  - Icon: ↻ (circular arrow)
  - Tooltip: "Start new game, keep contestants"
- **Reset App**: Danger variant (red)
  - Icon: ⚠ (warning)
  - Tooltip: "Delete all data"

### Confirmation Modal Colors
- **Reset Game**: Yellow/orange border and header
- **Reset App**: Red border and header

### Before/After Table
```
┌──────────────────────────────────────┐
│  Reset Game State                    │
├──────────────────────────────────────┤
│                                      │
│  ✅ Preserved:     │  🔄 Reset:      │
│  • Contestants    │  • Wins → 0     │
│  • Positions      │  • All alive    │
│  • Categories     │  • Territories  │
│  • Settings       │  • Duel state   │
│                                      │
│  Start a new game with same roster   │
│                                      │
├──────────────────────────────────────┤
│  [Cancel]          [Reset Game]      │
└──────────────────────────────────────┘
```

## Testing Strategy

### Unit Tests
- `resetGame.test.ts`: Core utility logic
- Test contestant state reset
- Test localStorage clearing
- Test error handling
- Test edge cases (missing fields)

### Integration Tests
- `Dashboard.test.tsx`: Button and modal interaction
- Test modal open/close
- Test confirmation flow
- Test error display
- Test cancel behavior

### Manual Testing Checklist
1. Import 10 contestants with categories
2. Play several duels (eliminations, wins, territory changes)
3. Click "Reset Game"
4. Verify confirmation modal shows correct info
5. Confirm reset
6. Verify all contestants alive with 0 wins
7. Verify categories restored to originals
8. Verify territories reset to single squares
9. Verify game configuration preserved
10. Verify theme preference preserved
11. Test with multiple windows open
12. Test error scenarios (DB failure)

## Success Criteria

✅ Task complete when:
- [ ] Data model updated with `originalCategory` field
- [ ] Migration utility handles legacy data
- [ ] `resetGameState()` utility implemented and tested
- [ ] Dashboard has "Reset Game" button with confirmation
- [ ] Visual distinction between "Reset Game" and "Reset App" clear
- [ ] Multi-window sync works (BroadcastChannel)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing checklist complete
- [ ] `npm run build` passes
- [ ] `npm test -- --run` passes
- [ ] `npm run lint` passes
- [ ] Documentation updated

## Out of Scope

- **Selective reset** (e.g., "reset wins but keep eliminations")
- **Reset history/undo** - one-way operation
- **Automatic backups before reset** - user responsibility
- **Reset game mid-duel** - must finish or abort duel first
- **Preserve territory shapes** - territories always reset to single square
- **Multi-game history tracking** - only resets current game
- **Import/export game state** - separate feature
- **Reset scheduling** (e.g., "reset every Friday")

## Related Tasks

- **Task 31**: Reset App (nuclear option, deletes everything)
- **Task 05**: localStorage abstraction (used for duel state)
- **Task 03**: IndexedDB abstraction (contestant storage)
- **Task 36**: Grid View Floor (territory visualization affected by reset)
- **Task 30**: Category Manager (category import flow)

## Notes

- This complements Task 31 rather than replacing it
- Both reset options serve different use cases:
  - **Reset App**: Fresh start, demos, testing
  - **Reset Game**: Same contestants, new game, tournaments
- Consider adding to Settings page instead of always-visible header
- Useful for running multiple games at events/parties
- Migration strategy ensures backward compatibility
- BroadcastChannel provides cross-window coordination
- Future enhancement: "New Game" wizard with contestant selection

## Timeline Estimate
**3-4 days**
- Day 1: Data model update, migration utility
- Day 2: Reset utility, tests
- Day 3: UI integration, confirmation modal
- Day 4: Multi-window sync, manual testing, polish
