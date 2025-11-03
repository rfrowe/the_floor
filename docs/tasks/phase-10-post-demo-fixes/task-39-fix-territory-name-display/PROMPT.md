# Task 39: Fix Multiple Names on Multi-Square Territories

## Objective
Fix the bug where contiguous multi-square territories display multiple contestant names, ensuring each territory shows exactly one name at its centroid.

## Status
Not Started

## Priority
**HIGH** - This is a visual bug that causes confusion on the grid display and degrades user experience.

## Background

During the first live demo, territories with multiple grid squares sometimes displayed the contestant's name multiple times. This appears to occur primarily with 1xN territories where N is even, likely because the centroid calculation falls exactly between two grid squares.

**Current Behavior**:
- Territory with 4 squares in a row (1x4) shows name twice
- Territory with 2 squares (1x2) shows name on both squares
- Territory with 6 squares (2x3) may show multiple names

**Expected Behavior**:
- Each contiguous territory shows contestant name exactly once
- Name positioned at the visual centroid of the territory
- If centroid falls between squares, round to nearest square
- All squares in territory share the same background color
- Only centroid square displays the name

**Example**:
```
Territory: [X][X][X][X]  (4 squares in a row)
Current:   [A][ ][A][ ]  (name shows twice!)
Expected:  [ ][A][ ][ ]  (name shows once, at centroid)
```

## Acceptance Criteria
- [ ] Each territory displays contestant name exactly once
- [ ] Name positioned at calculated centroid of territory
- [ ] Centroid calculation handles even-sized territories correctly
- [ ] Centroid rounds to nearest grid square when falling between squares
- [ ] Works for all territory shapes (1xN, Nx1, irregular)
- [ ] Category name (added in Task 35) also displays only once
- [ ] Consistent behavior across all territory sizes
- [ ] No flickering or repositioning of names
- [ ] All existing tests pass
- [ ] New tests cover centroid calculation edge cases

## Dependencies
- Task 36: Grid View Floor - ✅ complete (implements territory display)
- Task 35: Demo Hotfixes - ✅ complete (added category names)

## Implementation Guidance

### 1. Analyze Current Centroid Calculation

**File**: `src/components/floor/GridSquare.tsx` (or equivalent)

The bug likely stems from how the centroid is determined. Current logic probably checks if each square is "closest" to the centroid, causing multiple squares to qualify.

**Current (buggy) approach**:
```typescript
// Each square renders name if it's "near" the centroid
const isNearCentroid = (square: GridSquare, centroid: { row: number, col: number }) => {
  return Math.abs(square.row - centroid.row) < 0.5 &&
         Math.abs(square.col - centroid.col) < 0.5;
};
// Problem: Multiple squares can satisfy this condition!
```

### 2. Correct Centroid Calculation

**File**: `src/utils/territoryUtils.ts`

```typescript
interface GridSquare {
  row: number;
  col: number;
}

/**
 * Calculate the centroid (center point) of a territory
 * @param squares - Array of grid squares in the territory
 * @returns The exact centroid coordinates (may be fractional)
 */
export function calculateCentroid(squares: GridSquare[]): { row: number; col: number } {
  if (squares.length === 0) {
    return { row: 0, col: 0 };
  }

  const sumRow = squares.reduce((sum, sq) => sum + sq.row, 0);
  const sumCol = squares.reduce((sum, sq) => sum + sq.col, 0);

  return {
    row: sumRow / squares.length,
    col: sumCol / squares.length,
  };
}

/**
 * Find the single grid square closest to the centroid
 * @param squares - Array of grid squares in the territory
 * @param centroid - The centroid coordinates
 * @returns The ONE square closest to the centroid (deterministic)
 */
export function findCentroidSquare(squares: GridSquare[], centroid: { row: number; col: number }): GridSquare {
  if (squares.length === 0) {
    throw new Error('Cannot find centroid of empty territory');
  }

  if (squares.length === 1) {
    return squares[0]!;
  }

  // Find square with minimum distance to centroid
  let minDistance = Infinity;
  let closestSquare = squares[0]!;

  for (const square of squares) {
    const distance = Math.sqrt(
      Math.pow(square.row - centroid.row, 2) +
      Math.pow(square.col - centroid.col, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestSquare = square;
    }
  }

  return closestSquare;
}

/**
 * Check if a given square is the centroid square for a territory
 * @param square - The square to check
 * @param territory - The territory
 * @returns True if this square should display the name
 */
export function isCentroidSquare(square: GridSquare, territory: Territory): boolean {
  const centroid = calculateCentroid(territory.squares);
  const centroidSquare = findCentroidSquare(territory.squares, centroid);

  return square.row === centroidSquare.row && square.col === centroidSquare.col;
}
```

### 3. Update GridSquare Rendering

**File**: `src/components/floor/GridSquare.tsx`

```typescript
import { isCentroidSquare } from '@/utils/territoryUtils';

interface GridSquareProps {
  square: GridSquare;
  contestant?: Contestant;
  territory?: Territory;
}

export function GridSquare({ square, contestant, territory }: GridSquareProps) {
  // Only show name/category if this square is the centroid
  const shouldShowLabel = territory && contestant && isCentroidSquare(square, territory);

  return (
    <div
      className={styles['grid-square']}
      style={{ backgroundColor: contestant?.color }}
    >
      {shouldShowLabel && (
        <>
          <div className={styles['contestant-name']}>
            {contestant.name}
          </div>
          <div className={styles['category-name']}>
            {contestant.category.name}
          </div>
        </>
      )}
    </div>
  );
}
```

### 4. Handle Tie-Breaking Deterministically

If two squares are equidistant from the centroid (rare but possible), we need a deterministic tie-breaker:

```typescript
export function findCentroidSquare(squares: GridSquare[], centroid: { row: number; col: number }): GridSquare {
  // ... existing logic

  // If multiple squares have same minimum distance, use deterministic tie-breaker
  const candidates = squares.filter(sq => {
    const distance = Math.sqrt(
      Math.pow(sq.row - centroid.row, 2) +
      Math.pow(sq.col - centroid.col, 2)
    );
    return Math.abs(distance - minDistance) < 0.0001; // Floating point tolerance
  });

  if (candidates.length > 1) {
    // Tie-breaker: prefer top-left (smallest row, then smallest col)
    candidates.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
  }

  return candidates[0]!;
}
```

## Testing Strategy

### Unit Tests

**File**: `src/utils/territoryUtils.test.ts`
```typescript
describe('Centroid calculations', () => {
  describe('calculateCentroid', () => {
    it('returns center for 1x1 territory', () => {
      const squares = [{ row: 5, col: 5 }];
      const centroid = calculateCentroid(squares);
      expect(centroid).toEqual({ row: 5, col: 5 });
    });

    it('returns fractional center for 1x2 territory', () => {
      const squares = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      const centroid = calculateCentroid(squares);
      expect(centroid).toEqual({ row: 0, col: 0.5 });
    });

    it('returns fractional center for 1x4 territory', () => {
      const squares = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ];
      const centroid = calculateCentroid(squares);
      expect(centroid).toEqual({ row: 0, col: 1.5 });
    });

    it('returns center for L-shaped territory', () => {
      const squares = [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ];
      const centroid = calculateCentroid(squares);
      // Centroid: row = (0+1+1)/3 = 0.667, col = (0+0+1)/3 = 0.333
      expect(centroid.row).toBeCloseTo(0.667, 2);
      expect(centroid.col).toBeCloseTo(0.333, 2);
    });
  });

  describe('findCentroidSquare', () => {
    it('selects correct square for 1x2 territory', () => {
      const squares = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
      const centroid = { row: 0, col: 0.5 };
      const centroidSquare = findCentroidSquare(squares, centroid);

      // Both squares are equidistant (0.5 away), should pick deterministically
      // With top-left preference: should pick (0,0)
      expect(centroidSquare).toEqual({ row: 0, col: 0 });
    });

    it('selects correct square for 1x4 territory', () => {
      const squares = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ];
      const centroid = { row: 0, col: 1.5 };
      const centroidSquare = findCentroidSquare(squares, centroid);

      // Squares at col=1 and col=2 are both 0.5 away
      // Should pick col=1 (top-left preference)
      expect(centroidSquare).toEqual({ row: 0, col: 1 });
    });

    it('selects correct square for L-shaped territory', () => {
      const squares = [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ];
      const centroid = calculateCentroid(squares);
      const centroidSquare = findCentroidSquare(squares, centroid);

      // Square (1,0) should be closest to centroid (0.667, 0.333)
      expect(centroidSquare).toEqual({ row: 1, col: 0 });
    });
  });

  describe('isCentroidSquare', () => {
    it('returns true only for centroid square', () => {
      const territory = {
        squares: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ]
      };

      expect(isCentroidSquare({ row: 0, col: 0 }, territory)).toBe(false);
      expect(isCentroidSquare({ row: 0, col: 1 }, territory)).toBe(true); // Centroid
      expect(isCentroidSquare({ row: 0, col: 2 }, territory)).toBe(false);
      expect(isCentroidSquare({ row: 0, col: 3 }, territory)).toBe(false);
    });
  });
});
```

### Visual Tests

**File**: `src/components/floor/GridSquare.test.tsx`
```typescript
it('displays name only on centroid square of multi-square territory', () => {
  const territory = {
    squares: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]
  };

  const contestant = {
    id: '1',
    name: 'Alice',
    category: { name: 'Movies' },
    territory,
  };

  // Render square (0,0)
  const { container: container1 } = render(
    <GridSquare square={{ row: 0, col: 0 }} contestant={contestant} territory={territory} />
  );

  // Render square (0,1)
  const { container: container2 } = render(
    <GridSquare square={{ row: 0, col: 1 }} contestant={contestant} territory={territory} />
  );

  // Only ONE of them should show the name (based on deterministic logic)
  const name1 = container1.querySelector('.contestant-name');
  const name2 = container2.querySelector('.contestant-name');

  // Exactly one should have the name
  expect((name1 ? 1 : 0) + (name2 ? 1 : 0)).toBe(1);
});
```

### Manual Testing
- [ ] Create territory with 2 squares in a row (1x2)
- [ ] Verify name appears only once
- [ ] Create territory with 4 squares in a row (1x4)
- [ ] Verify name appears only once (at position col=1)
- [ ] Create territory with 6 squares (2x3 grid)
- [ ] Verify name appears only once at center
- [ ] Test various irregular territory shapes
- [ ] Verify category name also appears only once
- [ ] Test after territory expansion (winning duels)

## Edge Cases

### Case 1: Single Square Territory
- Centroid is the square itself
- Name always shows (current behavior works)

### Case 2: Perfect Square Territory (NxN)
- Centroid falls at exact center if N is odd
- Centroid falls between squares if N is even (use tie-breaker)

### Case 3: Thin Long Territory (1xN where N is large)
- Centroid at middle column
- Should pick center or center-left square

### Case 4: Irregular Territory (T-shape, L-shape, etc.)
- Centroid may not even be within the territory!
- Still pick closest square within territory

### Case 5: Territory Update During Animation
- Ensure centroid recalculates after territory changes
- No stale positions

## Success Criteria
- Each territory shows exactly one contestant name
- Each territory shows exactly one category name
- Name positioned at mathematically correct centroid
- Deterministic behavior (same territory always shows name in same place)
- All tests passing (517+ tests, plus new tests)
- No visual flickering or duplicate names
- Works with all territory shapes

## Out of Scope
- Custom name positioning (always use centroid)
- Multiple names for split territories (should not happen per game rules)
- Animated repositioning of names (instant is fine)
- Font size scaling based on territory size

## UI/UX Considerations

### Visual Clarity
- Name must be readable and centered within its square
- If territory is large, name appears in the logical "center of mass"
- Consistent positioning across all territory updates

### Performance
- Centroid calculation should be fast (simple arithmetic)
- Don't recalculate on every render (use memoization if needed)

### Color Contrast
- Ensure text readable on all territory background colors
- Consider white text with dark outline for visibility

## Notes
- This is a relatively simple math bug
- The centroid calculation itself is straightforward
- The key is ensuring only ONE square is identified as the centroid
- Tie-breaking must be deterministic to avoid flickering
- This bug likely went unnoticed in testing because most test territories were single squares
- Live demo with larger territories exposed the issue

## Related Tasks
- Task 36: Grid View Floor (implements territory display)
- Task 35: Demo Hotfixes (added category names to grid)
