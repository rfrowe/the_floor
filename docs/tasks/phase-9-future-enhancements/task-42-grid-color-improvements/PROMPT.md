# Task 42: Improve Grid Territory Color Selection

## Objective
Implement intelligent color selection for contestant territories to ensure visually distinct colors for adjacent territories, preventing the confusion experienced during the live demo.

## Status
Not Started

## Priority
**MEDIUM** - UX improvement that significantly affects visual clarity during gameplay.

## Background

During the first live demo, the grid territory colors were problematic:
- Many adjacent contestants had very similar colors (multiple shades of green)
- All colors were vibrant and visually exhausting
- Difficult to distinguish between territories at a glance
- The color selection appeared random and didn't consider adjacency

This is related to the graph coloring problem, but we need a practical solution that works for typical game sizes (20-81 contestants).

**Current Behavior**: Random or sequential color assignment without considering adjacency

**Expected Behavior**: Colors assigned such that adjacent territories are visually distinct

## Acceptance Criteria
- [ ] Adjacent territories have visually distinct colors
- [ ] Color palette includes sufficient variety for typical game sizes
- [ ] Colors are accessible (consider color blindness)
- [ ] Algorithm handles both initial assignment and dynamic updates (territory expansion)
- [ ] Performance acceptable for grids up to 9x9 (81 contestants)
- [ ] Option to manually override colors in settings
- [ ] Colors persist across sessions
- [ ] All tests passing

## Dependencies
- Task 36: Grid View Floor - ✅ complete

## Implementation Guidance

### 1. Color Palette Design

**File**: `src/utils/colorPalette.ts`

```typescript
/**
 * Carefully selected color palette with high visual distinction
 * Inspired by ColorBrewer and designed for adjacency differentiation
 */
export const TERRITORY_COLORS = [
  '#e41a1c', // Red
  '#377eb8', // Blue
  '#4daf4a', // Green
  '#984ea3', // Purple
  '#ff7f00', // Orange
  '#ffff33', // Yellow
  '#a65628', // Brown
  '#f781bf', // Pink
  '#999999', // Gray
  '#66c2a5', // Teal
  '#fc8d62', // Salmon
  '#8da0cb', // Lavender
  '#e78ac3', // Rose
  '#a6d854', // Lime
  '#ffd92f', // Gold
  '#e5c494', // Tan
  '#b3b3b3', // Silver
  '#8dd3c7', // Aqua
  '#bebada', // Periwinkle
  '#fb8072', // Coral
];

/**
 * Extended palette for larger games
 * Generate programmatically with hue rotation and saturation/lightness variation
 */
export function generateExtendedPalette(count: number): string[] {
  const colors: string[] = [...TERRITORY_COLORS];

  while (colors.length < count) {
    const hue = (colors.length * 137.5) % 360; // Golden angle
    const saturation = 60 + (colors.length % 3) * 15;
    const lightness = 45 + (colors.length % 4) * 10;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
}
```

### 2. Greedy Graph Coloring Algorithm

**File**: `src/utils/territoryColoring.ts`

```typescript
import { Contestant, GridSquare } from '@/types/game';

/**
 * Determine if two territories are adjacent (share an edge)
 */
function areAdjacent(territory1: GridSquare[], territory2: GridSquare[]): boolean {
  for (const sq1 of territory1) {
    for (const sq2 of territory2) {
      const rowDiff = Math.abs(sq1.row - sq2.row);
      const colDiff = Math.abs(sq1.col - sq2.col);

      // Adjacent if one unit away in cardinal direction (not diagonal)
      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Assign colors to contestants using greedy graph coloring
 * Ensures adjacent territories have different colors
 */
export function assignTerritoryColors(contestants: Contestant[]): Map<string, string> {
  const palette = generateExtendedPalette(contestants.length);
  const colorAssignments = new Map<string, string>();

  // Build adjacency list
  const adjacencies = new Map<string, Set<string>>();
  for (const c1 of contestants) {
    adjacencies.set(c1.id, new Set());
    for (const c2 of contestants) {
      if (c1.id !== c2.id && areAdjacent(c1.territory.squares, c2.territory.squares)) {
        adjacencies.get(c1.id)!.add(c2.id);
      }
    }
  }

  // Sort contestants by number of neighbors (most constrained first)
  const sorted = [...contestants].sort((a, b) => {
    const aNeighbors = adjacencies.get(a.id)!.size;
    const bNeighbors = adjacencies.get(b.id)!.size;
    return bNeighbors - aNeighbors;
  });

  // Assign colors greedily
  for (const contestant of sorted) {
    const neighbors = adjacencies.get(contestant.id)!;
    const neighborColors = new Set(
      Array.from(neighbors)
        .map(id => colorAssignments.get(id))
        .filter((color): color is string => color !== undefined)
    );

    // Find first available color not used by neighbors
    const availableColor = palette.find(color => !neighborColors.has(color));

    if (availableColor) {
      colorAssignments.set(contestant.id, availableColor);
    } else {
      // Fallback: reuse a color (shouldn't happen with sufficient palette)
      colorAssignments.set(contestant.id, palette[0]!);
    }
  }

  return colorAssignments;
}
```

### 3. Integrate with Game State

**File**: `src/contexts/GameContext.tsx`

```typescript
function GameContext() {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [colorAssignments, setColorAssignments] = useState<Map<string, string>>(new Map());

  // Recompute colors when territories change
  useEffect(() => {
    const newColors = assignTerritoryColors(contestants);
    setColorAssignments(newColors);
  }, [contestants]); // Recompute when contestants change

  // ... rest of context
}
```

### 4. Apply Colors to Grid

**File**: `src/components/floor/GridSquare.tsx`

```typescript
export function GridSquare({ contestant }: GridSquareProps) {
  const { colorAssignments } = useGameContext();
  const backgroundColor = contestant ? colorAssignments.get(contestant.id) : '#f0f0f0';

  return (
    <div
      className={styles['grid-square']}
      style={{ backgroundColor }}
    >
      {/* ... content */}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('territoryColoring', () => {
  it('assigns different colors to adjacent territories', () => {
    const contestants = [
      { id: '1', territory: { squares: [{ row: 0, col: 0 }] } },
      { id: '2', territory: { squares: [{ row: 0, col: 1 }] } }, // Adjacent
    ];

    const colors = assignTerritoryColors(contestants);

    expect(colors.get('1')).not.toBe(colors.get('2'));
  });

  it('handles complex adjacency patterns', () => {
    // Test with realistic grid layout
  });
});
```

### Visual Testing
- Load game with 20 contestants
- Verify no adjacent territories have similar colors
- Test after territory expansion (duel wins)
- Verify colors remain distinct

## Alternative: Use Library

Consider using `chroma-js` for better color manipulation:

```bash
npm install chroma-js
```

```typescript
import chroma from 'chroma-js';

// Generate visually distinct colors
const colors = chroma.scale(['#fafa6e','#2A4858'])
  .mode('lch')
  .colors(contestantCount);
```

## Success Criteria
- No two adjacent territories have similar colors
- Colors visually distinct at a glance
- Performance acceptable (<100ms for 81 contestants)
- All tests passing

## Out of Scope
- User-selected color themes
- Animated color transitions
- Color blindness simulation mode (future enhancement)

## Notes
- This is a well-studied problem (graph coloring)
- Greedy algorithm works well for sparse graphs (typical game layout)
- Consider using established color palettes (ColorBrewer, Material Design)
- For very large grids (9x9), may need >20 colors

## Related Tasks
- Task 36: Grid View Floor
