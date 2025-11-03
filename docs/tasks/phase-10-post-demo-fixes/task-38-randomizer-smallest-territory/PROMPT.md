# Task 38: Randomizer Should Only Select Contestants with Smallest Territory

## Objective
Modify the random contestant selection to only consider contestants who are tied for the smallest territory size, per official The Floor rules.

## Status
Not Started

## Priority
**HIGH** - This is a rules compliance bug that affects game fairness and strategy.

## Background

According to The Floor rules, when randomly selecting Player 1 for a new duel, the randomizer should only consider contestants who have the **smallest number of grid squares**. This ensures that players with smaller territories get chosen more frequently, creating strategic pressure and balancing gameplay.

**Current Behavior**:
- Random select button picks any non-eliminated contestant with equal probability
- A player with 1 square has the same chance as a player with 10 squares

**Expected Behavior**:
- Calculate territory size for all non-eliminated contestants
- Identify the minimum territory size (typically 1 square early game)
- Only consider contestants tied for minimum territory
- Randomly select from this filtered pool

**Example Scenarios**:
1. Early game: All contestants have 1 square → all eligible
2. Mid game: Most have 1 square, one player has 3 squares → only 1-square players eligible
3. Late game: Players have 1, 1, 4, 7 squares → only the two 1-square players eligible

## Acceptance Criteria
- [ ] Random selection only considers contestants with minimum territory size
- [ ] All non-eliminated contestants with min territory have equal selection probability
- [ ] Contestants with larger territories are excluded from random selection
- [ ] Territory size calculated from `contestant.territory.squares.length`
- [ ] Empty territory or undefined territory defaults to size 1
- [ ] UI shows which contestants are eligible for random selection
- [ ] Random select button disabled if no eligible contestants
- [ ] Dashboard shows territory size per contestant
- [ ] All existing tests pass
- [ ] New tests cover territory-based selection logic
- [ ] Works with grid view (Task 36) when implemented

## Dependencies
- Task 36: Grid View Floor - ✅ complete (territory data model exists)
- Task 11: Contestant List - ✅ complete (random selection exists)
- Task 04: Data Models - ✅ complete (Contestant model with territory)

## Implementation Guidance

### 1. Territory Size Calculation

**File**: `src/utils/territoryUtils.ts` (create if doesn't exist)

```typescript
import { Contestant } from '@/types/game';

/**
 * Get the territory size for a contestant
 * @param contestant - The contestant
 * @returns Number of grid squares owned (defaults to 1 if no territory data)
 */
export function getTerritorySize(contestant: Contestant): number {
  if (!contestant.territory || !contestant.territory.squares) {
    return 1; // Default: each contestant starts with 1 square
  }
  return contestant.territory.squares.length;
}

/**
 * Get all non-eliminated contestants with the smallest territory
 * @param contestants - All contestants
 * @returns Contestants tied for smallest territory
 */
export function getEligibleForRandom(contestants: Contestant[]): Contestant[] {
  const active = contestants.filter(c => !c.eliminated);

  if (active.length === 0) {
    return [];
  }

  // Find minimum territory size
  const territorySizes = active.map(getTerritorySize);
  const minSize = Math.min(...territorySizes);

  // Filter to only contestants with min size
  return active.filter(c => getTerritorySize(c) === minSize);
}
```

### 2. Update Random Selection Logic

**File**: `src/pages/Dashboard.tsx` or `src/components/contestant/ContestantList.tsx`

```typescript
import { getEligibleForRandom } from '@/utils/territoryUtils';

function Dashboard() {
  const { contestants } = useGameContext();

  const handleRandomSelect = () => {
    const eligible = getEligibleForRandom(contestants);

    if (eligible.length === 0) {
      // Should not happen, but handle gracefully
      console.warn('No eligible contestants for random selection');
      return;
    }

    const randomIndex = Math.floor(Math.random() * eligible.length);
    const selected = eligible[randomIndex];

    // ... existing selection logic
  };

  const eligibleCount = getEligibleForRandom(contestants).length;

  return (
    <div>
      <button
        onClick={handleRandomSelect}
        disabled={eligibleCount === 0}
      >
        Random Select ({eligibleCount} eligible)
      </button>
      {/* ... rest of component */}
    </div>
  );
}
```

### 3. Visual Indication of Eligibility

**File**: `src/components/contestant/ContestantCard.tsx`

```typescript
import { getTerritorySize, getEligibleForRandom } from '@/utils/territoryUtils';

interface ContestantCardProps {
  contestant: Contestant;
  allContestants: Contestant[]; // Need for eligibility check
  // ... other props
}

export function ContestantCard({ contestant, allContestants }: ContestantCardProps) {
  const territorySize = getTerritorySize(contestant);
  const eligible = getEligibleForRandom(allContestants);
  const isEligible = eligible.some(c => c.id === contestant.id);

  return (
    <div className={`${styles['card']} ${isEligible ? styles['eligible'] : ''}`}>
      <div className={styles['name']}>{contestant.name}</div>
      <div className={styles['territory']}>
        Territory: {territorySize} square{territorySize !== 1 ? 's' : ''}
      </div>
      {isEligible && (
        <div className={styles['eligible-badge']}>Eligible for random</div>
      )}
      {/* ... rest of card */}
    </div>
  );
}
```

### 4. CSS Styling

**File**: `src/components/contestant/ContestantCard.module.css`

```css
.eligible {
  border: 2px solid var(--color-primary);
  box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.3);
}

.eligible-badge {
  background: var(--color-primary);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-top: 0.5rem;
}

.territory {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}
```

## Testing Strategy

### Unit Tests

**File**: `src/utils/territoryUtils.test.ts`
```typescript
import { getTerritorySize, getEligibleForRandom } from './territoryUtils';
import { Contestant } from '@/types/game';

describe('territoryUtils', () => {
  describe('getTerritorySize', () => {
    it('returns 1 for contestant with no territory data', () => {
      const contestant = {
        id: '1',
        name: 'Test',
        eliminated: false,
        // no territory field
      } as Contestant;

      expect(getTerritorySize(contestant)).toBe(1);
    });

    it('returns correct size for contestant with territory', () => {
      const contestant = {
        id: '1',
        name: 'Test',
        eliminated: false,
        territory: {
          squares: [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
            { row: 1, col: 0 },
          ]
        }
      } as Contestant;

      expect(getTerritorySize(contestant)).toBe(3);
    });
  });

  describe('getEligibleForRandom', () => {
    it('returns all contestants when all have equal territory', () => {
      const contestants = [
        { id: '1', name: 'A', eliminated: false, territory: { squares: [{ row: 0, col: 0 }] } },
        { id: '2', name: 'B', eliminated: false, territory: { squares: [{ row: 0, col: 1 }] } },
        { id: '3', name: 'C', eliminated: false, territory: { squares: [{ row: 1, col: 0 }] } },
      ] as Contestant[];

      const eligible = getEligibleForRandom(contestants);
      expect(eligible).toHaveLength(3);
    });

    it('returns only contestants with smallest territory', () => {
      const contestants = [
        { id: '1', name: 'A', eliminated: false, territory: { squares: [{ row: 0, col: 0 }] } },
        { id: '2', name: 'B', eliminated: false, territory: { squares: [
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 }
        ] } },
        { id: '3', name: 'C', eliminated: false, territory: { squares: [{ row: 1, col: 0 }] } },
      ] as Contestant[];

      const eligible = getEligibleForRandom(contestants);
      expect(eligible).toHaveLength(2);
      expect(eligible.map(c => c.name)).toEqual(['A', 'C']);
    });

    it('excludes eliminated contestants', () => {
      const contestants = [
        { id: '1', name: 'A', eliminated: false, territory: { squares: [{ row: 0, col: 0 }] } },
        { id: '2', name: 'B', eliminated: true, territory: { squares: [{ row: 0, col: 1 }] } },
      ] as Contestant[];

      const eligible = getEligibleForRandom(contestants);
      expect(eligible).toHaveLength(1);
      expect(eligible[0]?.name).toBe('A');
    });

    it('handles contestants without territory data', () => {
      const contestants = [
        { id: '1', name: 'A', eliminated: false }, // No territory
        { id: '2', name: 'B', eliminated: false, territory: { squares: [
          { row: 0, col: 0 },
          { row: 0, col: 1 }
        ] } },
      ] as Contestant[];

      const eligible = getEligibleForRandom(contestants);
      expect(eligible).toHaveLength(1);
      expect(eligible[0]?.name).toBe('A'); // Size 1 (default) is smallest
    });
  });
});
```

### Integration Tests

**File**: `src/pages/Dashboard.test.tsx`
```typescript
it('random select only picks from contestants with smallest territory', () => {
  const contestants = [
    { id: '1', name: 'Small1', territory: { squares: [{ row: 0, col: 0 }] } },
    { id: '2', name: 'Large', territory: { squares: Array(5).fill({}) } },
    { id: '3', name: 'Small2', territory: { squares: [{ row: 1, col: 0 }] } },
  ];

  // Render dashboard with contestants
  // Click random select button 100 times
  // Verify only Small1 or Small2 ever selected, never Large
});
```

### Manual Testing
- [ ] Start game with all contestants having 1 square
- [ ] Verify all contestants shown as eligible
- [ ] Click random select, verify any contestant can be chosen
- [ ] Run a few duels so one contestant has 3+ squares
- [ ] Verify large-territory contestant NOT eligible
- [ ] Verify random select only picks from small-territory contestants
- [ ] Check UI shows eligibility correctly
- [ ] Test with grid view if available (Task 36)

## Edge Cases

### Case 1: Only One Contestant Remaining
- Should still be eligible if not eliminated
- Random select becomes deterministic

### Case 2: All Contestants Have Large Territories
- Find minimum among them (e.g., if sizes are 5, 7, 5 → select from the two with size 5)

### Case 3: No Active Contestants
- Return empty array
- Disable random select button

### Case 4: Backwards Compatibility
- If territory data doesn't exist yet (before grid implementation), default to size 1
- All contestants treated equally (current behavior)

## Success Criteria
- Random selection respects territory size rules
- Only minimum-territory contestants eligible
- UI clearly indicates eligible contestants
- Territory size displayed on contestant cards
- All tests passing (517+ tests, plus new tests)
- No impact on gameplay when territory sizes are equal
- Seamless integration with existing random selection

## Out of Scope
- Manual override to select from all contestants (keep rule-compliant)
- Weighted random selection (equal probability among eligible)
- Territory growth animation (covered by Task 36)
- Historical tracking of random selections
- Configurable eligibility rules

## UI/UX Considerations

### Visual Clarity
- Clear indication of which contestants are eligible
- Display territory size prominently
- Consider highlighting eligible contestants during selection

### User Understanding
- Tooltip explaining eligibility rules
- Show count of eligible contestants on button
- Consider "Why am I not eligible?" indicator for large territories

### Strategic Display
- Players should be able to see who's most likely to be picked
- Promotes strategic thinking about territory expansion

## Notes
- This rule creates interesting strategic dynamics
- Players with larger territories are "safer" from random selection
- Encourages aggressive territorial expansion
- Makes early game more dynamic (all players eligible initially)
- Critical for authentic The Floor experience
- Relatively simple implementation due to existing territory data model from Task 36

## Related Tasks
- Task 36: Grid View Floor (provides territory data model)
- Task 11: Contestant List (implements random selection)
- Task 04: Data Models (defines Contestant interface)
