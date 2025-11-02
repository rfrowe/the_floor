# Task 36: Grid View Floor Display

## Objective
Implement a visual grid representation of "The Floor" game board showing contestant positions with area consolidation, replacing the waiting view on the Audience display.

## Status
Not Started

## Priority
**Low / Dream Feature** - This is a major enhancement that significantly changes the user experience and requires substantial implementation effort. Consider this a "nice to have" post-MVP feature.

## Background

From Wikipedia: [The Floor (American game show)](https://en.wikipedia.org/wiki/The_Floor_\(American_game_show\))

**Key Concepts**:
- Contestants start occupying individual squares on a grid floor
- When a contestant wins a duel, they "absorb" the loser's territory
- Winner's territory expands to include adjacent/neighboring squares
- Visual representation shows territory ownership and consolidation
- The goal is to control the entire floor (all squares)

**Current State**: Audience waiting view shows simple "Waiting for next duel" text.

**Proposed State**: Audience waiting view shows a grid with:
- Each contestant occupying one or more squares
- Visual distinction between contestants (color, name, etc.)
- Winner's territory expands to absorb loser's squares after duel
- Animated transitions when territories consolidate

## Acceptance Criteria
- [ ] Grid view displays during waiting state (no active duel)
- [ ] Grid layout represents all contestants spatially
- [ ] Each contestant's territory is visually distinct
- [ ] Contestant names and/or categories displayed on their squares
- [ ] Territory consolidation animates smoothly after duel
- [ ] Grid is responsive and fills screen appropriately
- [ ] Eliminated contestants' territories are absorbed by winner
- [ ] Grid state persists across page refreshes
- [ ] Data model extends Contestant to include position/territory
- [ ] Dashboard allows initial positioning of contestants (or auto-generated)
- [ ] All tests passing
- [ ] No regressions in existing functionality

## Dependencies
- Task 17: Audience View Layout - ✅ complete
- Task 04: Data Models - ✅ complete (needs extension)
- Task 05: Storage Layer - ✅ complete
- Task 23: Cross-window sync - ✅ complete

## Data Model Extensions

### Current Contestant Model
```typescript
interface Contestant {
  id: string;
  name: string;
  category: Category;
  wins: number;
  eliminated: boolean;
}
```

### Extended Contestant Model
```typescript
interface Contestant {
  id: string;
  name: string;
  category: Category;
  wins: number;
  eliminated: boolean;
  territory: Territory; // NEW: Spatial position on floor
}

interface Territory {
  squares: GridSquare[]; // Array of squares owned by this contestant
}

interface GridSquare {
  row: number; // 0-indexed row position
  col: number; // 0-indexed column position
  id: string;  // Unique identifier for this square
}

interface FloorGrid {
  rows: number;    // Total rows in grid (e.g., 5)
  cols: number;    // Total columns in grid (e.g., 9)
  squares: GridSquare[]; // All squares on the floor
}
```

### Alternative: Simplified Model
```typescript
interface Contestant {
  id: string;
  name: string;
  category: Category;
  wins: number;
  eliminated: boolean;
  gridPosition: { row: number; col: number }; // NEW: Starting position
  controlledSquares: string[]; // NEW: Array of square IDs
}
```

## Implementation Guidance

### Phase 1: Data Structure

#### 1.1 Define Grid Configuration
```typescript
// src/config/gridConfig.ts
export const GRID_CONFIG = {
  rows: 5,
  cols: 9,
  totalSquares: 45, // Should match contestant count
};
```

**Note**: Grid dimensions should match or exceed contestant count. 5×9 = 45 squares supports up to 45 contestants.

#### 1.2 Initialize Contestant Positions

**Option A: Manual Assignment**
- Game master assigns each contestant a starting position via Dashboard
- Drag-and-drop interface to place contestants on grid
- Validates all squares are filled before starting game

**Option B: Auto-Generate**
```typescript
function initializeContestantPositions(contestants: Contestant[]): Contestant[] {
  const { rows, cols } = GRID_CONFIG;
  let squareIndex = 0;

  return contestants.map(contestant => {
    const row = Math.floor(squareIndex / cols);
    const col = squareIndex % cols;
    squareIndex++;

    return {
      ...contestant,
      gridPosition: { row, col },
      controlledSquares: [`${row}-${col}`], // Initial: one square
    };
  });
}
```

**Recommendation**: Start with Option B (auto-generate) for MVP. Add Option A later if needed.

### Phase 2: Grid Visualization Component

#### 2.1 FloorGrid Component

**File**: `src/components/floor/FloorGrid.tsx`
```typescript
interface FloorGridProps {
  contestants: Contestant[];
}

export function FloorGrid({ contestants }: FloorGridProps) {
  const { rows, cols } = GRID_CONFIG;

  // Create map of square ID to contestant
  const squareOwnership = useMemo(() => {
    const map = new Map<string, Contestant>();
    contestants.forEach(contestant => {
      contestant.controlledSquares?.forEach(squareId => {
        map.set(squareId, contestant);
      });
    });
    return map;
  }, [contestants]);

  return (
    <div className={styles['floor-grid']}>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className={styles['grid-row']}>
          {Array.from({ length: cols }).map((_, col) => {
            const squareId = `${row}-${col}`;
            const owner = squareOwnership.get(squareId);
            return (
              <GridSquare
                key={squareId}
                squareId={squareId}
                owner={owner}
                row={row}
                col={col}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

#### 2.2 GridSquare Component

**File**: `src/components/floor/GridSquare.tsx`
```typescript
interface GridSquareProps {
  squareId: string;
  owner?: Contestant;
  row: number;
  col: number;
}

export function GridSquare({ squareId, owner, row, col }: GridSquareProps) {
  const backgroundColor = owner ? getContestantColor(owner.id) : '#ccc';
  const displayName = owner && shouldDisplayName(owner, row, col);

  return (
    <div
      className={styles['grid-square']}
      style={{ backgroundColor }}
      data-owner={owner?.id}
    >
      {displayName && (
        <div className={styles['square-label']}>
          {owner.name}
        </div>
      )}
    </div>
  );
}
```

#### 2.3 Grid Styling

**File**: `src/components/floor/FloorGrid.module.css`
```css
.floor-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 20px;
  background: #000;
  height: 100vh;
  justify-content: center;
  align-items: center;
}

.grid-row {
  display: flex;
  gap: 2px;
}

.grid-square {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #333;
  transition: background-color 0.5s ease, transform 0.3s ease;
  position: relative;
}

.grid-square:hover {
  transform: scale(1.05);
}

.square-label {
  font-weight: bold;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  font-size: 0.9rem;
  text-align: center;
  padding: 4px;
}

/* Responsive sizing */
@media (max-width: 1200px) {
  .grid-square {
    width: 80px;
    height: 80px;
  }
}
```

### Phase 3: Territory Consolidation

#### 3.1 Determine Adjacent Squares

```typescript
// src/utils/gridUtils.ts
export function getAdjacentSquares(
  position: { row: number; col: number },
  gridConfig: { rows: number; cols: number }
): string[] {
  const { row, col } = position;
  const { rows, cols } = gridConfig;
  const adjacent: string[] = [];

  // Four directions: up, down, left, right
  const directions = [
    { row: row - 1, col },     // Up
    { row: row + 1, col },     // Down
    { row, col: col - 1 },     // Left
    { row, col: col + 1 },     // Right
  ];

  directions.forEach(({ row: r, col: c }) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      adjacent.push(`${r}-${c}`);
    }
  });

  return adjacent;
}
```

#### 3.2 Consolidate Territories After Duel

```typescript
// src/utils/territoryConsolidation.ts
export function consolidateTerritories(
  winner: Contestant,
  loser: Contestant,
  allContestants: Contestant[]
): Contestant[] {
  // Winner absorbs all of loser's squares
  const updatedWinner: Contestant = {
    ...winner,
    controlledSquares: [
      ...(winner.controlledSquares || []),
      ...(loser.controlledSquares || []),
    ],
    wins: winner.wins + 1,
  };

  // Loser is eliminated
  const updatedLoser: Contestant = {
    ...loser,
    eliminated: true,
    controlledSquares: [], // No longer controls any squares
  };

  // Update contestant list
  return allContestants.map(c => {
    if (c.id === winner.id) return updatedWinner;
    if (c.id === loser.id) return updatedLoser;
    return c;
  });
}
```

#### 3.3 Animate Territory Transfer

**Option A: CSS Transitions**
```css
.grid-square {
  transition: background-color 0.8s ease-in-out;
}
```

**Option B: Animation Library**
```typescript
import { motion } from 'framer-motion';

export function GridSquare({ squareId, owner }: GridSquareProps) {
  return (
    <motion.div
      className={styles['grid-square']}
      animate={{ backgroundColor: getContestantColor(owner?.id) }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Square content */}
    </motion.div>
  );
}
```

**Recommendation**: Start with CSS transitions (simpler). Add animation library if needed.

### Phase 4: Integration with Audience View

**File**: `src/pages/AudienceView.tsx`
```typescript
export function AudienceView() {
  const [duelState] = useDuelState();
  const [contestants] = useContestants();

  if (!duelState) {
    // No active duel - show grid view
    return <FloorGrid contestants={contestants} />;
  }

  // Active duel - show existing duel view
  return (
    <div className={styles['duel-view']}>
      <ClockBar {...duelState} />
      <SlideViewer slide={getCurrentSlide(duelState)} />
    </div>
  );
}
```

### Phase 5: Color Assignment

**File**: `src/utils/colorUtils.ts`
```typescript
export function getContestantColor(contestantId?: string): string {
  if (!contestantId) return '#cccccc'; // Empty square

  // Generate consistent color based on ID
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33F3',
    '#33FFF3', '#F3FF33', '#FF8C33', '#8CFF33', '#338CFF',
    // Add more colors as needed...
  ];

  // Use hash of ID to select color (ensures consistency)
  const hash = contestantId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}
```

**Alternative**: Allow manual color assignment in Dashboard.

### Phase 6: Dashboard Configuration

Add UI to Dashboard for grid initialization:

**File**: `src/components/dashboard/GridInitializer.tsx`
```typescript
export function GridInitializer() {
  const [contestants, setContestants] = useContestants();

  const handleAutoPosition = () => {
    const positioned = initializeContestantPositions(contestants);
    setContestants(positioned);
  };

  return (
    <div className={styles['grid-initializer']}>
      <h3>Grid Positioning</h3>
      <button onClick={handleAutoPosition}>
        Auto-Position Contestants
      </button>
      <p>
        {contestants.filter(c => c.controlledSquares?.length > 0).length} / {contestants.length} positioned
      </p>
    </div>
  );
}
```

## Advanced Features (Optional)

### Multi-Square Labels
When a contestant controls multiple squares, show name only in "central" square:

```typescript
function shouldDisplayName(owner: Contestant, row: number, col: number): boolean {
  if (!owner.controlledSquares || owner.controlledSquares.length === 1) {
    return true; // Always show for single square
  }

  // Calculate centroid of controlled squares
  const positions = owner.controlledSquares.map(parseSquareId);
  const centroidRow = positions.reduce((sum, p) => sum + p.row, 0) / positions.length;
  const centroidCol = positions.reduce((sum, p) => sum + p.col, 0) / positions.length;

  // Show name in square closest to centroid
  const distance = Math.sqrt(
    Math.pow(row - centroidRow, 2) + Math.pow(col - centroidCol, 2)
  );

  return distance < 1; // Show if within threshold
}
```

### Territory Shapes
Ensure territories appear contiguous and realistic:

```typescript
function validateContiguousTerritory(squares: string[]): boolean {
  // Use BFS/DFS to verify all squares are connected
  // Returns true if territory forms a single connected component
}
```

### Adjacency Validation
Ensure new territories only expand to adjacent squares:

```typescript
function validateTerritoryExpansion(
  winnerSquares: string[],
  loserSquares: string[]
): boolean {
  // Verify at least one loser square is adjacent to winner territory
  return loserSquares.some(loserSquare => {
    return winnerSquares.some(winnerSquare => {
      return areAdjacent(parseSquareId(winnerSquare), parseSquareId(loserSquare));
    });
  });
}
```

**Note**: If contestants aren't adjacent, may need to allow non-contiguous territories temporarily or enforce adjacency in duel selection.

## Testing Strategy

### Visual Testing
- [ ] Grid displays with correct dimensions
- [ ] All contestants have colored territories
- [ ] Names display correctly
- [ ] Territory consolidation animates smoothly
- [ ] Responsive on different screen sizes

### Functional Testing
```typescript
describe('FloorGrid', () => {
  it('renders grid with correct dimensions', () => {
    const contestants = generateMockContestants(45);
    render(<FloorGrid contestants={contestants} />);

    const squares = screen.getAllByRole('gridcell'); // May need custom role
    expect(squares).toHaveLength(45); // 5 rows × 9 cols
  });

  it('assigns unique colors to each contestant', () => {
    const contestants = generateMockContestants(10);
    render(<FloorGrid contestants={contestants} />);

    // Verify unique colors
    const colors = new Set();
    contestants.forEach(c => {
      colors.add(getContestantColor(c.id));
    });
    expect(colors.size).toBe(contestants.length);
  });
});

describe('territoryConsolidation', () => {
  it('winner absorbs loser territory', () => {
    const winner: Contestant = {
      id: '1',
      name: 'Alice',
      controlledSquares: ['0-0', '0-1'],
      // ... other fields
    };

    const loser: Contestant = {
      id: '2',
      name: 'Bob',
      controlledSquares: ['1-0', '1-1'],
      // ... other fields
    };

    const updated = consolidateTerritories(winner, loser, [winner, loser]);
    const updatedWinner = updated.find(c => c.id === '1');

    expect(updatedWinner?.controlledSquares).toEqual([
      '0-0', '0-1', '1-0', '1-1'
    ]);
  });
});
```

### Manual Test Scenarios
1. **Initial Load**: All contestants positioned, grid filled
2. **First Duel**: Winner absorbs loser's square(s)
3. **Multiple Duels**: Territories expand progressively
4. **Final Duel**: One contestant controls entire floor
5. **Refresh**: Grid state persists from localStorage

## Success Criteria
- Grid view replaces waiting view on Audience display
- All contestants have distinct territories
- Territory consolidation is visually smooth
- Grid state persists across sessions
- No performance issues with grid rendering
- All tests passing
- Stakeholder approval of visual design

## Out of Scope

### Explicitly NOT Included
- **Manual contestant positioning** - Use auto-generation for MVP
- **Custom grid dimensions** - Fixed 5×9 grid
- **Non-rectangular grids** - Keep simple rectangular grid
- **Animated contestant avatars** - Static colored squares sufficient
- **Interactive grid** (clicking squares) - View-only for Audience
- **Strategic positioning logic** - Random/sequential positioning fine
- **Territory battle animations** - Simple color transition sufficient
- **3D visualization** - 2D grid only
- **Map/topology features** - Flat grid, no terrain

### Future Enhancements (Post-MVP)
- Drag-and-drop positioning in Dashboard
- Custom grid sizes
- Contestant avatars/images in squares
- Advanced animations (explode, absorb, pulse)
- Territory statistics (% of floor controlled)
- Historical view (replay territory changes)

## Performance Considerations

### Rendering Optimization
```typescript
// Memoize grid squares to prevent unnecessary re-renders
export const GridSquare = memo(function GridSquare(props: GridSquareProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.owner?.id === nextProps.owner?.id;
});
```

### Large Grids
For grids larger than 5×9:
- Consider virtualization (react-window)
- Optimize CSS transitions
- Lazy render non-visible squares (if scrolling enabled)

**Note**: 5×9 grid is small enough that optimization isn't critical.

## Accessibility Considerations

### Screen Readers
```typescript
<div
  role="grid"
  aria-label="The Floor game board"
>
  <div role="row">
    <div
      role="gridcell"
      aria-label={`Square ${row}-${col} owned by ${owner?.name || 'empty'}`}
    >
      {/* Square content */}
    </div>
  </div>
</div>
```

### Color Blindness
- Ensure colors have sufficient contrast
- Consider patterns or textures in addition to colors
- Add contestant name labels for clarity

### Keyboard Navigation
- Grid is view-only for Audience, so navigation not critical
- Ensure focus indicators if interactive mode added

## Migration Strategy

### Phase 1: Data Migration
1. Extend Contestant interface with territory fields
2. Run migration script to initialize positions for existing contestants
3. Update storage layer to handle new fields

### Phase 2: UI Implementation
1. Build FloorGrid component in isolation
2. Test with mock data
3. Integrate with AudienceView

### Phase 3: Integration
1. Add grid initialization to Dashboard
2. Update duel end logic to consolidate territories
3. Test cross-window sync with grid updates

### Phase 4: Polish
1. Refine colors and animations
2. Add responsive styling
3. Performance optimization

## Notes
- This is a **major feature** requiring significant effort
- Prioritize core gameplay over this enhancement
- Consider breaking into smaller sub-tasks if implemented
- Visual appeal is important - spend time on polish
- The grid makes the game much more engaging for audience
- May want to consult with designer for color palette
- Test on actual projection equipment to ensure visibility
- Consider adding a toggle to switch between grid and simple waiting view
- Grid dimensions (5×9) based on typical game show setup
- Adjust grid size based on actual contestant count if needed
