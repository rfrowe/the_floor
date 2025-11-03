# Task 46: Finale Best-of-Three with Tie-Breaker

## Objective
Implement finale rules where the last two contestants compete in a best-of-three duel format with support for a tie-breaker category if the series goes to a third game.

## Status
Not Started

## Priority
**MEDIUM** - Rules compliance for authentic The Floor finale experience.

## Background

According to The Floor rules, the finale between the last two remaining contestants is a best-of-three series. If the series goes to the third game (1-1), a special tie-breaker category may be used.

**Current Behavior**: Standard duel between last two contestants (single game)

**Expected Behavior**:
- Detect when only 2 contestants remain
- Initiate best-of-three series
- Track series score (wins per contestant)
- If series reaches 1-1, offer tie-breaker category selection
- Declare overall winner after best-of-three

## Acceptance Criteria
- [ ] System detects when exactly 2 non-eliminated contestants remain
- [ ] "Start Finale" button appears on dashboard
- [ ] Finale tracks series score (Game 1, Game 2, Game 3)
- [ ] Each game works like normal duel
- [ ] Series ends when one contestant wins 2 games
- [ ] If series is 1-1, game master can select tie-breaker category
- [ ] Tie-breaker category selector shows all categories or previously played categories
- [ ] Final winner declared with celebration
- [ ] All tests passing

## Implementation Guidance

### 1. Detect Finale Condition

**File**: `src/pages/Dashboard.tsx`

```typescript
const activeContestants = contestants.filter(c => !c.eliminated);
const isFinaleCondition = activeContestants.length === 2;

{isFinaleCondition && !finaleInProgress && (
  <button onClick={startFinale} className={styles['finale-button']}>
    🏆 Start Finale (Best of 3)
  </button>
)}
```

### 2. Finale State Management

**File**: `src/types/game.ts`

```typescript
interface FinaleState {
  active: boolean;
  contestant1: Contestant;
  contestant2: Contestant;
  gamesWon: {
    contestant1: number;
    contestant2: number;
  };
  currentGame: number; // 1, 2, or 3
  categoryUsed: Category[];
  tieBreaker?: Category;
}

interface GameState {
  // ... existing fields
  finaleState?: FinaleState;
}
```

### 3. Finale Flow Component

**File**: `src/components/finale/FinaleManager.tsx`

```typescript
export function FinaleManager() {
  const { finaleState, updateFinaleState } = useGameContext();

  if (!finaleState?.active) return null;

  const { contestant1, contestant2, gamesWon, currentGame } = finaleState;
  const seriesComplete = gamesWon.contestant1 === 2 || gamesWon.contestant2 === 2;

  if (seriesComplete) {
    const winner = gamesWon.contestant1 === 2 ? contestant1 : contestant2;
    return <FinaleWinner winner={winner} />;
  }

  const isTieBreaker = gamesWon.contestant1 === 1 && gamesWon.contestant2 === 1;

  return (
    <div className={styles['finale']}>
      <h1>🏆 FINALE - Best of 3 🏆</h1>
      <div className={styles['series-score']}>
        <div>{contestant1.name}: {gamesWon.contestant1}</div>
        <div>{contestant2.name}: {gamesWon.contestant2}</div>
      </div>
      <div>Game {currentGame} of 3</div>

      {isTieBreaker && (
        <TieBreakerCategorySelector
          onSelect={(category) => startFinaleDuel(category)}
        />
      )}

      {!isTieBreaker && (
        <button onClick={() => startFinaleDuel()}>
          Start Game {currentGame}
        </button>
      )}
    </div>
  );
}
```

### 4. Tie-Breaker Category Selector

**File**: `src/components/finale/TieBreakerCategorySelector.tsx`

```typescript
interface TieBreakerCategorySelectorProps {
  onSelect: (category: Category) => void;
}

export function TieBreakerCategorySelector({ onSelect }: TieBreakerCategorySelectorProps) {
  const { categories, duelHistory } = useGameContext();
  const [selected, setSelected] = useState<Category | null>(null);

  // Show all categories, mark which have been played
  const playedCategoryIds = new Set(duelHistory.map(d => d.categoryUsed.id));

  return (
    <div className={styles['tiebreaker-selector']}>
      <h2>Game 3: Tie-Breaker Category</h2>
      <p>Select a category for the final game:</p>

      <select
        value={selected?.id ?? ''}
        onChange={(e) => {
          const cat = categories.find(c => c.id === e.target.value);
          setSelected(cat ?? null);
        }}
      >
        <option value="">-- Select Tie-Breaker --</option>
        {categories.map(cat => {
          const played = playedCategoryIds.has(cat.id);
          return (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.slides.length} slides)
              {played && ' ⚠️ Previously Played'}
            </option>
          );
        })}
      </select>

      <button
        onClick={() => selected && onSelect(selected)}
        disabled={!selected}
      >
        Start Tie-Breaker
      </button>
    </div>
  );
}
```

### 5. Update Duel End Handler for Finale

**File**: `src/contexts/GameContext.tsx`

```typescript
function handleFinaleGameEnd(winner: Contestant, loser: Contestant) {
  if (!finaleState) return;

  // Update series score
  const updatedGamesWon = { ...finaleState.gamesWon };
  if (winner.id === finaleState.contestant1.id) {
    updatedGamesWon.contestant1 += 1;
  } else {
    updatedGamesWon.contestant2 += 1;
  }

  // Check if series is over
  const seriesWinner = updatedGamesWon.contestant1 === 2
    ? finaleState.contestant1
    : updatedGamesWon.contestant2 === 2
    ? finaleState.contestant2
    : null;

  if (seriesWinner) {
    // Finale complete!
    handleFinaleComplete(seriesWinner);
  } else {
    // Continue to next game
    updateFinaleState({
      ...finaleState,
      gamesWon: updatedGamesWon,
      currentGame: finaleState.currentGame + 1,
    });
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('Finale State', () => {
  it('advances to game 2 after game 1 winner', () => {
    // ... test
  });

  it('declares series winner after 2-0', () => {
    // ... test
  });

  it('prompts for tie-breaker category at 1-1', () => {
    // ... test
  });
});
```

### Manual Testing
- [ ] Eliminate all but 2 contestants
- [ ] Start finale
- [ ] Complete game 1
- [ ] Verify series score updates
- [ ] Complete game 2 (different winner)
- [ ] Verify tie-breaker category selector appears
- [ ] Select tie-breaker category
- [ ] Complete game 3
- [ ] Verify finale winner declared

## Edge Cases

### Case 1: 2-0 Sweep
- Series ends after game 2
- Game 3 never played

### Case 2: Tie-Breaker Category Exhausted
- Allow selecting category even if all slides shown
- Or filter to only unplayed categories

### Case 3: Finale Interrupted
- Persist finale state
- Resume on refresh

## Success Criteria
- Best-of-three format works
- Series score tracked accurately
- Tie-breaker category selection functional
- Finale winner declared correctly
- All tests passing

## Out of Scope
- Different formats (best-of-5, single game)
- Automatic category selection for tie-breaker
- Finale-specific time limits
- Special finale UI theme

## Notes
- Adds authenticity to The Floor experience
- Creates climactic ending
- Tie-breaker adds strategic category selection
- Consider showing "Series tied 1-1" prominently

## Related Tasks
- Task 12: Duel Setup
- Task 15: Duel Controls
- Task 44: Winning Animation (enhance for finale)
