# Task 33: Normalize Contestant Data Structure

## Objective
Remove data duplication by normalizing the Contestant type to store only `categoryId` instead of embedding the full `category` object, implementing proper relational data patterns for better maintainability and consistency.

## Status
Not Started

## Acceptance Criteria
- [ ] Contestant type has only `categoryId` field (no `category` object)
- [ ] All contestant creation functions use `categoryId` only
- [ ] Category lookups happen via hook/utility when needed
- [ ] No data duplication in IndexedDB storage
- [ ] Category updates don't leave stale data in contestants
- [ ] All duel logic works with category lookups
- [ ] All UI displays work with category lookups
- [ ] Referential integrity maintained (prevent orphaned references)
- [ ] Performance remains acceptable with category lookups
- [ ] All tests updated and passing
- [ ] Build completes without TypeScript errors

## Dependencies
- Contestant type definition (types/contestant.ts)
- Category storage system (hooks/useCategories.ts)
- All components that display contestant categories
- Duel system (MasterView, DuelSetup, useDuelState)

## Current Problem

### Data Duplication
```typescript
// Current: Category stored in TWO places
interface Contestant {
  id: string;
  name: string;
  categoryId?: string;           // Reference
  category: StoredCategory;      // FULL OBJECT - duplicates data!
  wins: number;
  eliminated: boolean;
}

// Category also stored separately in categories store
```

### Issues
1. **Storage Bloat**: Categories with large slide images duplicated per contestant
2. **Inconsistency Risk**: If category updated, contestant's copy becomes stale
3. **No Single Source of Truth**: Same category data exists in multiple places
4. **Referential Integrity**: No enforcement of categoryId validity

## Proposed Solution

### Normalized Data Structure
```typescript
interface Contestant {
  id: string;
  name: string;
  categoryId: string;  // Required, not optional
  wins: number;
  eliminated: boolean;
  gridPosition?: { row: number; col: number };
  controlledSquares?: string[];
}
```

### Category Access Pattern
```typescript
// Look up category when needed
const { getCategoryById } = useCategoryLookup();
const category = getCategoryById(contestant.categoryId);
const categoryName = category?.name ?? 'Unknown';
```

## Implementation Guidance

### 1. Create Category Lookup Infrastructure

**File**: `src/hooks/useCategoryLookup.ts`
```typescript
import { useCallback } from 'react';
import { useCategories } from './useCategories';
import type { StoredCategory, Contestant } from '@types';

export function useCategoryLookup() {
  const [categories] = useCategories();

  const getCategoryById = useCallback((categoryId: string): StoredCategory | undefined => {
    return categories.find(c => c.id === categoryId);
  }, [categories]);

  const getContestantCategory = useCallback((contestant: Contestant): StoredCategory | undefined => {
    return contestant.categoryId ? getCategoryById(contestant.categoryId) : undefined;
  }, [getCategoryById]);

  const getMultipleCategories = useCallback((categoryIds: string[]): Map<string, StoredCategory> => {
    const map = new Map<string, StoredCategory>();
    categoryIds.forEach(id => {
      const category = getCategoryById(id);
      if (category) map.set(id, category);
    });
    return map;
  }, [getCategoryById]);

  return { getCategoryById, getContestantCategory, getMultipleCategories };
}
```

**File**: `src/storage/indexedDB.ts` (add function)
```typescript
/**
 * Get category by ID asynchronously (for non-hook contexts)
 */
export async function getCategoryByIdAsync(categoryId: string): Promise<StoredCategory | null> {
  return getCategoryById<StoredCategory>(categoryId);
}
```

### 2. Update Type Definition

**File**: `src/types/contestant.ts` (lines 56-80)
```typescript
export interface Contestant {
  id: string;
  name: string;
  categoryId: string;  // Changed: Required, not optional
  // category: Category;  // REMOVED
  wins: number;
  eliminated: boolean;
  gridPosition?: { row: number; col: number };
  controlledSquares?: string[];
}
```

### 3. Update Contestant Creation Functions

**Priority Order (to minimize breaking changes):**

**A. Update `createContestantFromCategory`**
File: `src/utils/jsonImport.ts` (lines 149-164)
```typescript
export function createContestantFromCategory(
  category: Category,
  contestantName: string,
  categoryId: string  // Add parameter
): Contestant {
  return {
    id: nanoid(),
    name: contestantName,
    categoryId,  // Use parameter
    // Remove: category field
    wins: 0,
    eliminated: false,
  };
}
```

**B. Update Dashboard.handleImport**
File: `src/pages/Dashboard.tsx` (lines 54-114)
- Remove `category` field from contestant creation
- Ensure `categoryId` is set correctly

**C. Update CreateContent.handleCreate**
File: `src/components/contestant/creator/CreateContent.tsx` (lines 71-134)
- Remove `category` field
- Keep only `categoryId`

**D. Update ImportContent.handleImportCategory**
File: `src/components/category/manager/ImportContent.tsx` (lines 38-79)
- Remove `category` field from contestant creation

### 4. Update Category Access Components

**A. ContestantCard** (HIGH PRIORITY)
File: `src/components/contestant/ContestantCard.tsx` (line 86)

Before:
```typescript
<span className={categoryClass}>{contestant.category.name}</span>
```

After:
```typescript
export function ContestantCard({ contestant, ... }: ContestantCardProps) {
  const { getCategoryById } = useCategoryLookup();
  const category = getCategoryById(contestant.categoryId);
  const categoryName = category?.name ?? 'Unknown';

  return (
    // ...
    <span className={categoryClass}>{categoryName}</span>
  );
}
```

**B. GridSquare** (HIGH PRIORITY)
File: `src/components/floor/GridSquare.tsx` (line 80)

Before:
```typescript
<span className={styles['square-label'] ?? ''}>{owner.category.name}</span>
```

After:
```typescript
export function GridSquare({ owner, ... }: GridSquareProps) {
  const { getCategoryById } = useCategoryLookup();
  const category = owner ? getCategoryById(owner.categoryId) : undefined;
  const ownerName = owner?.name ?? '';

  return (
    // ...
    <span className={styles['square-label'] ?? ''}>{ownerName}</span>
  );
}
```

**C. DuelSetup** (CRITICAL)
File: `src/components/duel/DuelSetup.tsx` (lines 180-243)

Before:
```typescript
const contestant1Categories = [contestant1.category];
const contestant2Categories = [contestant2.category];
```

After:
```typescript
export function DuelSetup({ contestant1, contestant2, ... }: DuelSetupProps) {
  const { getCategoryById } = useCategoryLookup();

  const contestant1Category = getCategoryById(contestant1.categoryId);
  const contestant2Category = getCategoryById(contestant2.categoryId);

  const contestant1Categories = contestant1Category ? [contestant1Category] : [];
  const contestant2Categories = contestant2Category ? [contestant2Category] : [];

  // Rest of component...
}
```

**D. useDuelState Hook** (CRITICAL)
File: `src/hooks/useDuelState.ts` (lines 43-44)

Before:
```typescript
const selectedCategory = contestant1.category.name === storedCategoryName
  ? contestant1.category
  : contestant2.category;
```

After:
```typescript
// Load category asynchronously
const getCategoryByName = async (name: string): Promise<StoredCategory | null> => {
  const allCategories = await getAllCategories<StoredCategory>();
  return allCategories.find(c => c.name === name) ?? null;
};

const selectedCategory = await getCategoryByName(storedCategoryName);
```

**E. MasterView.handleEndDuel** (CRITICAL)
File: `src/pages/MasterView.tsx` (lines 80-112)

Before:
```typescript
const inheritedCategory = duelState.contestant2.category; // Loser's category
const updatedWinner = {
  ...duelState.contestant1,
  category: inheritedCategory,
  categoryId: duelState.contestant2.categoryId,
};
```

After:
```typescript
const inheritedCategoryId = duelState.contestant2.categoryId;
const updatedWinner = {
  ...duelState.contestant1,
  categoryId: inheritedCategoryId,
};
```

### 5. Update All Test Files (21 files)

**Create Test Utilities**
File: `src/utils/testUtils.ts`
```typescript
import { nanoid } from 'nanoid';
import type { Contestant, StoredCategory } from '@types';

export function createMockContestant(
  categoryId: string,
  overrides?: Partial<Contestant>
): Contestant {
  return {
    id: nanoid(),
    name: 'Test Contestant',
    categoryId,
    wins: 0,
    eliminated: false,
    ...overrides,
  };
}

export function createMockCategory(
  id?: string,
  overrides?: Partial<StoredCategory>
): StoredCategory {
  return {
    id: id ?? nanoid(),
    name: 'Test Category',
    slides: [],
    createdAt: new Date().toISOString(),
    thumbnailUrl: '',
    ...overrides,
  };
}

export function mockCategoryLookup(categories: StoredCategory[]) {
  return vi.spyOn(useCategoryLookup, 'useCategoryLookup').mockReturnValue({
    getCategoryById: (id: string) => categories.find(c => c.id === id),
    getContestantCategory: (contestant: Contestant) =>
      categories.find(c => c.id === contestant.categoryId),
    getMultipleCategories: (ids: string[]) => {
      const map = new Map();
      ids.forEach(id => {
        const cat = categories.find(c => c.id === id);
        if (cat) map.set(id, cat);
      });
      return map;
    },
  });
}
```

**Update Pattern for Tests**
Before:
```typescript
const mockContestant = {
  id: '1',
  name: 'Alice',
  category: { name: 'Math', slides: [] },
  categoryId: 'cat-1',
  wins: 0,
  eliminated: false,
};
```

After:
```typescript
const mockCategory = createMockCategory('cat-1', { name: 'Math' });
const mockContestant = createMockContestant('cat-1', { name: 'Alice' });

// Mock category lookup
mockCategoryLookup([mockCategory]);
```

## Files Requiring Changes

### Source Files (23 total)

#### Critical Path (Must Update First)
1. `src/types/contestant.ts` - Type definition
2. `src/hooks/useCategoryLookup.ts` - NEW FILE
3. `src/utils/jsonImport.ts` - createContestantFromCategory
4. `src/storage/indexedDB.ts` - Add getCategoryByIdAsync

#### High Priority (Core Functionality)
5. `src/pages/Dashboard.tsx` - Contestant creation
6. `src/pages/MasterView.tsx` - Duel winner logic
7. `src/components/duel/DuelSetup.tsx` - Category selection
8. `src/hooks/useDuelState.ts` - State hydration
9. `src/components/contestant/ContestantCard.tsx` - Display
10. `src/components/floor/GridSquare.tsx` - Display

#### Medium Priority (Import Flows)
11. `src/components/category/manager/ImportContent.tsx`
12. `src/components/contestant/creator/CreateContent.tsx`
13. `src/components/CategoryImporter.tsx`

#### Low Priority (Already Correct or Utility)
14. `src/components/category/manager/ListContent.tsx` - Already uses categoryId
15. `src/utils/migrateCategories.ts` - Can be deprecated

### Test Files (21 total)
16. `src/pages/Dashboard.test.tsx`
17. `src/pages/MasterView.test.tsx`
18. `src/pages/AudienceView.test.tsx`
19. `src/components/contestant/ContestantCard.test.tsx`
20. `src/components/duel/DuelSetup.test.tsx`
21. `src/components/floor/FloorGrid.test.tsx`
22. `src/components/floor/GridSquare.test.tsx`
23. `src/hooks/useDuelState.test.tsx`
24. `src/hooks/useContestantSelection.test.tsx`
25. `src/utils/gridUtils.test.ts`
26. `src/utils/territoryConsolidation.test.ts`
27. Plus 15 more test files...

### New Files to Create
- `src/hooks/useCategoryLookup.ts`
- `src/utils/testUtils.ts`

## Migration Strategy

### Recommended: Big Bang Approach

**Advantages:**
- Clean cut, no intermediate states
- Forces complete solution
- Easier to test comprehensively
- Type system catches all issues

**Process:**
1. Create infrastructure (useCategoryLookup, testUtils)
2. Update type definition (breaks everything)
3. Fix all TypeScript errors in dependency order
4. Update all tests
5. Verify build and test suite
6. Manual testing of all flows

### Alternative: Gradual Migration

**Advantages:**
- Lower risk per commit
- Can test incrementally
- Easier to debug

**Disadvantages:**
- Must support both patterns temporarily
- More complex type handling
- Longer timeline

## Implementation Order

### Phase 1: Infrastructure (30 min)
1. Create `useCategoryLookup.ts` hook
2. Create `testUtils.ts` with mock utilities
3. Add `getCategoryByIdAsync` to indexedDB.ts
4. Commit: "feat: add category lookup infrastructure"

### Phase 2: Type Update (5 min)
1. Update Contestant type definition
2. Update ContestantInput type
3. This will BREAK the build - expected
4. Commit: "refactor: remove category field from Contestant type"

### Phase 3: Fix Contestant Creation (45 min)
1. Update createContestantFromCategory
2. Update Dashboard.handleImport
3. Update CreateContent.handleCreate
4. Update ImportContent.handleImportCategory
5. Update CategoryImporter internal state
6. Commit: "refactor: update contestant creation to use categoryId only"

### Phase 4: Fix Category Access (60 min)
1. Update ContestantCard (add useCategoryLookup)
2. Update GridSquare (add useCategoryLookup)
3. Update DuelSetup (add useCategoryLookup)
4. Update useDuelState (async category lookup)
5. Update MasterView.handleEndDuel
6. Commit: "refactor: update category access to use lookups"

### Phase 5: Update Tests (90 min)
1. Update Dashboard.test.tsx
2. Update MasterView.test.tsx
3. Update DuelSetup.test.tsx
4. Update all remaining test files
5. Add useCategoryLookup mocks
6. Commit: "test: update mocks for normalized contestant data"

### Phase 6: Cleanup (15 min)
1. Remove or deprecate migrateCategories.ts
2. Run full test suite
3. Run build
4. Manual testing
5. Commit: "chore: cleanup after contestant data normalization"

**Total Estimated Time:** 4 hours

## Potential Risks and Mitigations

### Critical Risks

**Risk 1: Orphaned Category References**
- **Problem**: Contestant references category that no longer exists
- **Mitigation**:
  - Add validation before deleting categories
  - Check if any contestants reference the category
  - Prevent deletion if references exist
  - Display graceful fallback ("Unknown") if reference broken

**Risk 2: Duel State Hydration Failure**
- **Problem**: Can't restore duel state if category lookup fails
- **Mitigation**:
  - Robust error handling in useDuelState
  - Clear duel state if categories missing
  - User notification: "Could not restore duel - category deleted"

**Risk 3: Performance Degradation**
- **Problem**: Multiple category lookups per render
- **Mitigation**:
  - Use `useMemo` for category lookups
  - Implement category caching in hook
  - Batch lookups where possible

### Medium Risks

**Risk 4: Test Coverage Gaps**
- **Problem**: Tests don't catch all category lookup failures
- **Mitigation**:
  - Add explicit tests for missing category scenarios
  - Test null/undefined handling
  - Test category deletion edge cases

**Risk 5: Migration Complexity**
- **Problem**: 44 files to update increases chance of mistakes
- **Mitigation**:
  - Use TypeScript compiler to find all errors
  - Follow strict dependency order
  - Test after each phase
  - Use git bisect if issues found later

### Low Risks

**Risk 6: Existing Data Migration**
- **Problem**: Contestants in user's IndexedDB still have old structure
- **Mitigation**:
  - Not critical - category field will be ignored
  - Can add one-time migration on app load if needed
  - Document that old data harmless

## Component Updates Required

### High Priority (User-Facing)
- [x] ContestantCard.tsx - Display category name
- [x] GridSquare.tsx - Display category name
- [x] DuelSetup.tsx - Category selection dropdown
- [x] MasterView.tsx - Category inheritance logic

### Medium Priority (Import Flows)
- [ ] CategoryImporter.tsx - Internal contestant state
- [ ] ImportContent.tsx - Category import with contestant
- [ ] CreateContent.tsx - Contestant creation

### Low Priority (Already Correct)
- [ ] ListContent.tsx - Already uses categoryId correctly

## Testing Strategy

### Unit Tests
- [ ] Test useCategoryLookup hook
  - [ ] getCategoryById returns correct category
  - [ ] getCategoryById returns undefined for missing ID
  - [ ] getContestantCategory works correctly
  - [ ] getMultipleCategories batch lookup

### Integration Tests
- [ ] Test contestant creation without category field
- [ ] Test duel setup with category lookups
- [ ] Test duel completion with category inheritance
- [ ] Test category display in ContestantCard
- [ ] Test category display in GridSquare

### Manual Testing Checklist
- [ ] Create contestant with existing category
- [ ] Create contestant with sample category
- [ ] Import category with contestant
- [ ] Start duel and select category
- [ ] Complete duel and verify category inheritance
- [ ] Delete category (should be blocked if contestants exist)
- [ ] View contestant card shows category name
- [ ] Grid squares show category names
- [ ] Duel state saves/restores correctly

## Success Criteria
- Contestant objects only store `categoryId`, not full `category`
- All category data lookups use `useCategoryLookup` hook
- No data duplication in IndexedDB
- Category updates don't affect contestant data
- All duel logic works correctly
- All UI displays work correctly
- Referential integrity enforced
- All tests pass
- Build completes without errors
- No performance regressions
- Manual testing confirms all flows work

## Out of Scope
- Migrating existing user data in IndexedDB (harmless to leave old structure)
- Advanced caching strategies (simple lookup sufficient for now)
- Optimistic UI updates for category changes
- Category change notifications to contestants
- Undo/redo for category assignments
- Category history tracking
- Soft delete for categories
- Category archiving system

## Performance Considerations

### Category Lookup Performance
- **Current Approach**: O(n) linear search through categories array
- **Scale**: < 100 categories expected - acceptable performance
- **Optimization**: If needed later, can add Map-based lookup

### Rendering Performance
- **Impact**: Additional hook calls per contestant card render
- **Mitigation**: `useMemo` in useCategoryLookup prevents recalculation
- **Acceptable**: Categories array rarely changes, lookups cached

### Memory Usage
- **Before**: ~10MB per contestant with embedded category (100 slides with images)
- **After**: ~0.1MB per contestant with just categoryId
- **Savings**: ~99% reduction in contestant storage size
- **Impact**: Significant improvement for many contestants

## Future Enhancements
- Implement Map-based category cache for O(1) lookups
- Add category validation on contestant creation
- Implement foreign key constraints
- Add cascade delete options (delete contestant when category deleted)
- Add category change audit log
- Implement optimistic UI updates
- Add batch category lookup optimization
- Cache category lookups at component level

## Notes
- This is a foundational data architecture improvement
- Reduces storage by ~99% for contestants with large categories
- Eliminates stale data issues permanently
- Follows database normalization best practices
- Makes future category management features easier
- Breaking change but worth the benefits
- Consider this a prerequisite for advanced category features

## Related Tasks
- Task 15: Category Management (already benefits from normalization)
- Task 16: Duel Logic (critical dependency)
- Task 17: Grid Visualization (category display)
- Future: Category versioning, category templates
