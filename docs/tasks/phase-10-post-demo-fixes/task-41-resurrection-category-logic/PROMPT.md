# Task 41: Resurrection Category Logic

## Objective
Define and implement the correct category assignment logic when a contestant is resurrected (brought back into the game after elimination).

## Status
Not Started

## Priority
**MEDIUM** - This is a rules clarification that affects game balance when using the resurrection feature.

## Background

During the first live demo and subsequent planning, the question arose: **What category should a resurrected contestant receive?**

Per the user's specification:
> The category of the duel that got them out, minus the first N slides that were used in that duel, because they've been seen. If there would be no slides left, do whatever you want.

**Current Behavior**: Unknown/undefined (resurrection feature may not be fully implemented)

**Expected Behavior**:
1. Identify the category used in the duel where contestant was eliminated
2. Remove the slides that were already shown during that duel
3. Assign the remaining slides as the resurrected contestant's category
4. If no slides remain, fallback to a default category or allow game master to choose

## Acceptance Criteria
- [ ] System tracks which category was used in each duel
- [ ] System tracks which slides were shown during each duel
- [ ] On resurrection, contestant receives "unplayed portion" of elimination duel category
- [ ] If no slides remain, provide fallback mechanism
- [ ] Fallback options: assign a random unused category, or prompt game master to choose
- [ ] Resurrected contestant's category clearly labeled in UI
- [ ] Category slide index resets appropriately
- [ ] All tests passing
- [ ] Documentation updated with resurrection logic

## Dependencies
- Resurrection feature (may need to be implemented first)
- Task 04: Data Models - ✅ complete
- Task 05: Storage Layer - ✅ complete
- Task 22: Duel Reducer - ✅ complete

## Implementation Guidance

### 1. Track Duel History

**File**: `src/types/game.ts`

```typescript
interface DuelHistory {
  id: string;
  contestant1: Contestant;
  contestant2: Contestant;
  categoryUsed: Category; // The category that was played
  slidesShown: number; // How many slides were shown (0-indexed, so 5 means slides 0-4)
  winner: Contestant;
  loser: Contestant;
  timestamp: number;
}

interface GameState {
  contestants: Contestant[];
  duelHistory: DuelHistory[]; // NEW: Track all duels
  // ... existing fields
}
```

### 2. Record Duel on Completion

**File**: `src/contexts/GameContext.tsx` or duel end handler

```typescript
function handleDuelEnd(winner: Contestant, loser: Contestant, duelState: DuelState) {
  const duelRecord: DuelHistory = {
    id: generateId(),
    contestant1: duelState.contestant1,
    contestant2: duelState.contestant2,
    categoryUsed: duelState.category,
    slidesShown: duelState.currentSlideIndex + 1, // +1 because 0-indexed
    winner,
    loser,
    timestamp: Date.now(),
  };

  // Add to history
  gameState.duelHistory.push(duelRecord);

  // Mark loser as eliminated
  loser.eliminated = true;

  // ... rest of end-duel logic
}
```

### 3. Calculate Resurrection Category

**File**: `src/utils/resurrectionUtils.ts` (create new)

```typescript
import { Contestant, Category, DuelHistory, Slide } from '@/types/game';

/**
 * Calculate the category for a resurrected contestant
 * @param contestant - The contestant being resurrected
 * @param duelHistory - All duel history
 * @returns Category with unused slides, or null if no slides remain
 */
export function getResurrectionCategory(
  contestant: Contestant,
  duelHistory: DuelHistory[]
): Category | null {
  // Find the duel where this contestant was eliminated
  const eliminationDuel = duelHistory
    .filter(duel => duel.loser.id === contestant.id)
    .sort((a, b) => b.timestamp - a.timestamp)[0]; // Most recent if multiple

  if (!eliminationDuel) {
    console.warn('No elimination duel found for contestant', contestant.id);
    return null;
  }

  const { categoryUsed, slidesShown } = eliminationDuel;

  // Get remaining slides (skip the ones already shown)
  const remainingSlides = categoryUsed.slides.slice(slidesShown);

  if (remainingSlides.length === 0) {
    // No slides left in this category
    return null;
  }

  // Return category with only remaining slides
  return {
    id: `${categoryUsed.id}-resurrection-${contestant.id}`,
    name: `${categoryUsed.name} (Partial)`,
    slides: remainingSlides,
  };
}

/**
 * Fallback: Get a random unused category for resurrection
 * @param allCategories - All available categories
 * @param usedCategories - Categories currently owned by contestants
 * @returns Random unused category, or null if none available
 */
export function getFallbackResurrectionCategory(
  allCategories: Category[],
  usedCategories: Category[]
): Category | null {
  const usedIds = new Set(usedCategories.map(c => c.id));
  const unused = allCategories.filter(c => !usedIds.has(c.id));

  if (unused.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * unused.length);
  return unused[randomIndex] ?? null;
}
```

### 4. Resurrection UI

**File**: `src/components/contestant/ResurrectionModal.tsx` (create new)

```typescript
interface ResurrectionModalProps {
  contestant: Contestant;
  suggestedCategory: Category | null;
  fallbackCategories: Category[];
  onConfirm: (category: Category) => void;
  onCancel: () => void;
}

export function ResurrectionModal({
  contestant,
  suggestedCategory,
  fallbackCategories,
  onConfirm,
  onCancel,
}: ResurrectionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    suggestedCategory
  );

  return (
    <Modal open onClose={onCancel}>
      <h2>Resurrect {contestant.name}</h2>

      {suggestedCategory ? (
        <div>
          <p>
            Suggested category: <strong>{suggestedCategory.name}</strong>
          </p>
          <p>
            ({suggestedCategory.slides.length} slides remaining from elimination duel)
          </p>
        </div>
      ) : (
        <div>
          <p>No slides remain from elimination duel category.</p>
          <p>Please select a category:</p>
        </div>
      )}

      {!suggestedCategory && fallbackCategories.length > 0 && (
        <select
          value={selectedCategory?.id ?? ''}
          onChange={(e) => {
            const cat = fallbackCategories.find(c => c.id === e.target.value);
            setSelectedCategory(cat ?? null);
          }}
        >
          <option value="">-- Select Category --</option>
          {fallbackCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.slides.length} slides)
            </option>
          ))}
        </select>
      )}

      <div className={styles['actions']}>
        <button onClick={onCancel}>Cancel</button>
        <button
          onClick={() => selectedCategory && onConfirm(selectedCategory)}
          disabled={!selectedCategory}
        >
          Resurrect
        </button>
      </div>
    </Modal>
  );
}
```

### 5. Resurrection Handler

**File**: `src/pages/Dashboard.tsx`

```typescript
import { getResurrectionCategory, getFallbackResurrectionCategory } from '@/utils/resurrectionUtils';

function Dashboard() {
  const { contestants, duelHistory, allCategories, updateContestant } = useGameContext();

  const handleResurrect = (contestant: Contestant) => {
    // Calculate suggested category
    const suggestedCategory = getResurrectionCategory(contestant, duelHistory);

    // Get fallback options if needed
    const usedCategories = contestants
      .filter(c => !c.eliminated)
      .map(c => c.category);
    const fallbackCategories = allCategories.filter(
      cat => !usedCategories.some(used => used.id === cat.id)
    );

    // Show modal for confirmation
    setResurrectionModal({
      contestant,
      suggestedCategory,
      fallbackCategories,
    });
  };

  const confirmResurrection = (contestant: Contestant, category: Category) => {
    updateContestant({
      ...contestant,
      eliminated: false,
      category,
    });

    closeResurrectionModal();
  };

  // ... rest of component
}
```

## Testing Strategy

### Unit Tests

**File**: `src/utils/resurrectionUtils.test.ts`
```typescript
describe('getResurrectionCategory', () => {
  it('returns category with remaining slides', () => {
    const contestant = { id: '1', name: 'Alice' };
    const category = {
      id: 'cat1',
      name: 'Movies',
      slides: [slide1, slide2, slide3, slide4, slide5], // 5 slides
    };

    const duelHistory = [{
      loser: contestant,
      categoryUsed: category,
      slidesShown: 2, // Showed slides 0 and 1
    }];

    const result = getResurrectionCategory(contestant, duelHistory);

    expect(result).not.toBeNull();
    expect(result?.slides).toHaveLength(3); // 3 remaining slides
    expect(result?.slides).toEqual([slide3, slide4, slide5]);
  });

  it('returns null when no slides remain', () => {
    const contestant = { id: '1', name: 'Alice' };
    const category = {
      id: 'cat1',
      name: 'Movies',
      slides: [slide1, slide2], // 2 slides
    };

    const duelHistory = [{
      loser: contestant,
      categoryUsed: category,
      slidesShown: 2, // Showed both slides
    }];

    const result = getResurrectionCategory(contestant, duelHistory);

    expect(result).toBeNull();
  });

  it('handles contestant with no elimination history', () => {
    const contestant = { id: '1', name: 'Alice' };
    const duelHistory: DuelHistory[] = [];

    const result = getResurrectionCategory(contestant, duelHistory);

    expect(result).toBeNull();
  });
});

describe('getFallbackResurrectionCategory', () => {
  it('returns random unused category', () => {
    const allCategories = [cat1, cat2, cat3];
    const usedCategories = [cat1];

    const result = getFallbackResurrectionCategory(allCategories, usedCategories);

    expect(result).not.toBeNull();
    expect([cat2.id, cat3.id]).toContain(result?.id);
  });

  it('returns null when all categories used', () => {
    const allCategories = [cat1, cat2];
    const usedCategories = [cat1, cat2];

    const result = getFallbackResurrectionCategory(allCategories, usedCategories);

    expect(result).toBeNull();
  });
});
```

### Integration Tests

**File**: `src/pages/Dashboard.test.tsx`
```typescript
it('resurrects contestant with correct category', async () => {
  // Set up: Contestant eliminated after 2 slides of a 5-slide category
  // Resurrect
  // Verify contestant has category with 3 remaining slides
});
```

### Manual Testing
- [ ] Run a duel where loser saw 3 of 5 slides
- [ ] Eliminate the loser
- [ ] Resurrect the contestant
- [ ] Verify they receive category with 2 remaining slides
- [ ] Start a duel with resurrected contestant
- [ ] Verify slides start from index 0 of remaining slides (not index 3)
- [ ] Test case where all slides were shown (fallback triggers)

## Edge Cases

### Case 1: All Slides Shown in Elimination Duel
- Return null
- Prompt game master to select from unused categories
- If no unused categories, warn and allow arbitrary selection

### Case 2: Contestant Eliminated Multiple Times (Resurrected Before)
- Use most recent elimination
- Track multiple eliminations in history

### Case 3: Category No Longer Exists
- If category was deleted from game, fallback to selection

### Case 4: Partial Slide Index
- If duel ended mid-slide (e.g., time ran out), use ceil() to be conservative

### Case 5: Resurrection Without Duel History
- Should not happen, but handle gracefully with fallback

## Success Criteria
- Resurrected contestant receives remaining slides from elimination duel
- If no slides remain, fallback mechanism works
- Game master can override category selection if desired
- UI clearly explains category assignment
- Duel history accurately tracked
- All tests passing
- No impact on normal gameplay

## Out of Scope
- Resurrection animation or ceremony
- Limit on number of resurrections
- Resurrection points or cost system
- Automatic resurrection (always manual)
- Resurrection during active duel

## UI/UX Considerations

### Transparency
- Show game master why a specific category is suggested
- Display number of remaining slides
- Allow override if needed

### Fallback Clarity
- If no slides remain, clearly explain the situation
- Present available options
- Don't auto-assign without confirmation

### Visual Indicators
- Mark partial categories with "(Partial)" suffix
- Show slide count in category picker

## Notes
- This rule makes strategic sense: eliminated player "gave away" part of their category
- Resurrection with partial category is less powerful than starting fresh
- Maintains game balance
- Requires tracking duel history (good for analytics anyway)
- Fallback ensures resurrection always works, even in edge cases
- Game master has final say (can override)

## Related Tasks
- Task 04: Data Models (extend with DuelHistory)
- Task 05: Storage Layer (persist duel history)
- Task 22: Duel Reducer (record duel details)
