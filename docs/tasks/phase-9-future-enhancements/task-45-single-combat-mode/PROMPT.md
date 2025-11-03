# Task 45: Single-Combat Mode

## Objective
Implement a "single-combat" mode where the game master can initiate exhibition duels between any two contestants for fun, without affecting game state (eliminations, territories, or categories).

## Status
Not Started

## Priority
**MEDIUM** - Feature that adds flexibility for entertainment and practice rounds.

## Background

During the live demo, there was desire to let contestants play additional duels for fun or practice without impacting the actual game state. This would allow:
- Entertainment between rounds
- Practice for new contestants
- Showcase specific categories
- Skip past already-seen slides

**Current Behavior**: All duels affect game state (eliminations, categories, territory)

**Expected Behavior**:
- Game master can initiate "single-combat" mode
- Select any two contestants (including eliminated)
- Select any category
- Specify slide offset (skip N slides)
- Duel runs normally but results don't affect game
- Wins still increment (for bragging rights)
- No eliminations, no category changes, no territory changes

## Acceptance Criteria
- [ ] "Single Combat" button on Dashboard
- [ ] Modal to select two contestants, category, and slide offset
- [ ] Form validation: offset must be < total slides
- [ ] Duel runs with normal game mechanics
- [ ] Winner's win count increments
- [ ] No contestant eliminated
- [ ] No category ownership changes
- [ ] No territory changes
- [ ] Clear visual indication that it's single-combat mode
- [ ] Return to dashboard after completion
- [ ] All tests passing

## Implementation Guidance

### 1. Add Single-Combat Flag to Duel State

**File**: `src/types/game.ts`

```typescript
interface DuelState {
  // ... existing fields
  isSingleCombat: boolean; // NEW
}
```

### 2. Single-Combat Setup Modal

**File**: `src/components/duel/SingleCombatSetup.tsx`

```typescript
interface SingleCombatSetupProps {
  contestants: Contestant[];
  categories: Category[];
  onStart: (config: SingleCombatConfig) => void;
  onCancel: () => void;
}

interface SingleCombatConfig {
  contestant1: Contestant;
  contestant2: Contestant;
  category: Category;
  slideOffset: number;
  timePerPlayer: number;
}

export function SingleCombatSetup({ contestants, categories, onStart, onCancel }: SingleCombatSetupProps) {
  const [config, setConfig] = useState<Partial<SingleCombatConfig>>({
    slideOffset: 0,
    timePerPlayer: 45,
  });

  const selectedCategory = config.category;
  const maxOffset = selectedCategory ? selectedCategory.slides.length - 1 : 0;

  return (
    <Modal open onClose={onCancel}>
      <h2>🎭 Single Combat Mode</h2>
      <p>For fun only - no eliminations or category changes</p>

      <label>
        Contestant 1:
        <select onChange={(e) => setConfig({...config, contestant1: findById(e.target.value)})}>
          <option value="">-- Select --</option>
          {contestants.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label>
        Contestant 2:
        <select onChange={(e) => setConfig({...config, contestant2: findById(e.target.value)})}>
          <option value="">-- Select --</option>
          {contestants.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label>
        Category:
        <select onChange={(e) => setConfig({...config, category: findCategoryById(e.target.value)})}>
          <option value="">-- Select --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.slides.length} slides)
            </option>
          ))}
        </select>
      </label>

      <label>
        Start at slide:
        <input
          type="number"
          min="0"
          max={maxOffset}
          value={config.slideOffset ?? 0}
          onChange={(e) => setConfig({...config, slideOffset: parseInt(e.target.value)})}
        />
        <span className={styles['help']}>
          Skip the first N slides (max: {maxOffset})
        </span>
      </label>

      <label>
        Time per player (seconds):
        <input
          type="number"
          min="10"
          max="300"
          value={config.timePerPlayer ?? 45}
          onChange={(e) => setConfig({...config, timePerPlayer: parseInt(e.target.value)})}
        />
      </label>

      <div className={styles['actions']}>
        <button onClick={onCancel}>Cancel</button>
        <button
          onClick={() => onStart(config as SingleCombatConfig)}
          disabled={!isValidConfig(config)}
        >
          Start Single Combat
        </button>
      </div>
    </Modal>
  );
}
```

### 3. Modify Duel End Logic

**File**: `src/contexts/GameContext.tsx`

```typescript
function handleDuelEnd(winner: Contestant, loser: Contestant, duelState: DuelState) {
  if (duelState.isSingleCombat) {
    // Single-combat mode: only increment win count
    winner.wins += 1;
    // Don't eliminate loser
    // Don't change categories
    // Don't change territories
  } else {
    // Normal duel: full game state updates
    winner.wins += 1;
    loser.eliminated = true;
    winner.category = /* inherit unplayed category */;
    // Update territories
  }

  // Save state
  saveGameState();
}
```

### 4. Visual Indicator

**File**: `src/pages/MasterView.tsx`

```typescript
{duelState.isSingleCombat && (
  <div className={styles['single-combat-banner']}>
    🎭 SINGLE COMBAT MODE - For Fun Only
  </div>
)}
```

**File**: `src/pages/AudienceView.tsx`

```typescript
// Add similar banner on audience view
```

## Testing Strategy

### Unit Tests

```typescript
describe('Single Combat Mode', () => {
  it('increments win count but does not eliminate loser', () => {
    const winner = { id: '1', wins: 5, eliminated: false };
    const loser = { id: '2', wins: 2, eliminated: false };

    handleDuelEnd(winner, loser, { isSingleCombat: true });

    expect(winner.wins).toBe(6);
    expect(loser.eliminated).toBe(false);
  });

  it('does not change category ownership in single combat', () => {
    const originalCategory = winner.category;

    handleDuelEnd(winner, loser, { isSingleCombat: true });

    expect(winner.category).toBe(originalCategory);
  });
});
```

### Integration Tests
- Start single-combat duel
- Complete duel
- Verify loser not eliminated
- Verify categories unchanged
- Verify win count incremented

### Manual Testing
- [ ] Click "Single Combat" button
- [ ] Select two contestants (including one eliminated)
- [ ] Select category and offset
- [ ] Verify duel runs normally
- [ ] Verify no game state changes except win count

## Edge Cases

### Case 1: Single-Combat with Eliminated Contestant
- Allow eliminated contestants to participate
- Still don't resurrect them after

### Case 2: Invalid Slide Offset
- Validate offset < slide count
- Show error if invalid

### Case 3: Same Contestant Selected Twice
- Prevent or allow (for demo purposes)?
- Suggest preventing for clarity

### Case 4: Category with Few Slides + Large Offset
- If offset leaves <2 slides, warn user
- Suggest reducing offset

## Success Criteria
- Single-combat mode works without affecting game state
- Win counts still increment
- Clear visual differentiation from normal duels
- Form validation prevents invalid configurations
- All tests passing

## Out of Scope
- Separate single-combat leaderboard
- Replay/recording of single-combat duels
- Best-of-N single-combat series
- Single-combat tournament bracket

## UI/UX Considerations

### Clarity
- Make it VERY clear this is exhibition mode
- Banner visible throughout duel
- Different color scheme (e.g., purple instead of blue)

### Accessibility
- Button clearly labeled "Single Combat (Exhibition)"
- Tooltip explaining it's for fun

### Workflow
- Quick setup (don't require elaborate configuration)
- Default values populated
- Return to dashboard immediately after

## Notes
- Useful for audience engagement between rounds
- Good for warming up new players
- Allows showcasing specific categories
- Slide offset feature lets you skip already-seen content
- Win count increment provides minor stakes
- No impact on strategy or game progression

## Related Tasks
- Task 12: Duel Setup (reuse selection logic)
- Task 15: Duel Controls (same mechanics)
- Task 21: Game Context (modify state update logic)
