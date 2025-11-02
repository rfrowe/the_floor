# Task 30: Category Manager

## Status
**BACKLOG** - Future enhancement for managing categories independently of contestants

## Objective
Create a category management system that allows viewing, editing, and reassigning categories independently of contestants, enabling easier testing and category reuse.

## Problem Statement

**Current Architecture:**
- Categories are embedded within Contestant objects
- No separate category storage - only exists in IndexedDB as part of contestants
- When a contestant is deleted, their category (with all slide images) is permanently lost
- Cannot easily swap categories between contestants
- No way to browse available categories or reuse them

**Use Cases:**
1. **Testing:** Need to quickly change a contestant's category without re-importing PPTX
2. **Category Reuse:** Multiple contestants might use the same category
3. **Category Backup:** Preserve categories even when contestants are eliminated
4. **Category Editing:** Edit category name or slides without re-importing

## Acceptance Criteria

### Data Layer
- [ ] Create `categories` object store in IndexedDB (separate from contestants)
- [ ] Category has unique ID and is stored independently
- [ ] Contestant references category by ID instead of embedding full Category object
- [ ] Migration utility to convert existing embedded categories to references

### Category Library UI
- [ ] "Manage Categories" button on Dashboard
- [ ] Modal showing all available categories in a grid/list
- [ ] Each category shows: name, slide count, thumbnail of first slide
- [ ] Search/filter categories by name
- [ ] Delete category (with confirmation if in use by contestants)
- [ ] View category slides in modal

### Category Assignment
- [ ] Edit contestant modal with category dropdown
- [ ] Dropdown shows all available categories
- [ ] Can change contestant's category without re-importing
- [ ] Validation: warn if category is already in use by another contestant

### PPTX Import Flow Changes
- [ ] Check if category with same name already exists
- [ ] Option to: (1) Reuse existing, (2) Create new with suffix, (3) Overwrite
- [ ] Store category once, reference it from contestant

## Implementation Guidance

### Step 1: Data Model Changes

**New Type:**
```typescript
// src/types/contestant.ts
export interface Contestant {
  id: string;
  name: string;
  categoryId: string;  // Changed from `category: Category`
  wins: number;
  eliminated: boolean;
}

export interface CategoryReference {
  id: string;
  name: string;
  slideCount: number;
  thumbnailUrl: string; // First slide image (low-res preview)
  createdAt: string;
  usedByContestants: string[]; // Array of contestant IDs
}
```

**New IndexedDB Store:**
```typescript
// src/storage/indexedDB.ts
const CATEGORY_STORE = 'categories';

// In onupgradeneeded:
if (!db.objectStoreNames.contains(CATEGORY_STORE)) {
  const store = db.createObjectStore(CATEGORY_STORE, { keyPath: 'id' });
  store.createIndex('name', 'name', { unique: false });
}
```

### Step 2: Storage Functions

Create `src/storage/categories.ts`:
```typescript
export async function getAllCategories(): Promise<Category[]>;
export async function getCategoryById(id: string): Promise<Category | null>;
export async function addCategory(category: Category): Promise<string>; // Returns ID
export async function updateCategory(category: Category): Promise<void>;
export async function deleteCategory(id: string): Promise<void>;
export async function getCategoryUsage(id: string): Promise<string[]>; // Contestant IDs
```

### Step 3: Migration Utility

Create `src/utils/migrateCategories.ts`:
```typescript
export async function migrateEmbeddedCategoriesToReferences(): Promise<void> {
  // 1. Get all contestants
  // 2. Extract unique categories (by name)
  // 3. Store categories in new object store
  // 4. Update contestants to reference category IDs
  // 5. Save updated contestants
}
```

### Step 4: Category Manager Component

Create `src/components/CategoryManager.tsx`:
- Grid of category cards (4 columns responsive)
- Each card shows: thumbnail, name, slide count, "In use by X contestants"
- Click card to view slides
- Delete button (disabled if in use, or show warning)
- Search bar to filter by name

### Step 5: Integration

**Dashboard Changes:**
- Add "Manage Categories" button in header
- Add "Edit Category" option in contestant card menu
- Import flow checks for duplicate categories

**CategoryImporter Changes:**
- Check if category name exists
- Show options: reuse/create-new/overwrite
- Store category separately, then create contestant with reference

## Dependencies

**Required (must be complete):**
- Task 5: Storage layer ✅
- Task 6: PPTX import ✅

**Related:**
- Task 10: Dashboard layout ✅
- Task 27: Polish & UX

## Out of Scope

- **Category editing:** Don't allow editing slides/censor boxes (too complex)
- **Category templates:** No pre-made category library
- **Category sharing:** No export/import of individual categories
- **Slide reordering:** Keep slides in import order
- **Multi-contestant categories:** Each contestant still owns one category (referencing is for reuse on import only)

## Testing

**Unit Tests:**
- Category storage functions (CRUD operations)
- Migration utility (embedded → references)
- Category usage tracking

**Component Tests:**
- CategoryManager UI (render, search, delete)
- Category assignment in edit contestant
- PPTX import with duplicate detection

**Integration Tests:**
- Full flow: Import → Manage → Reassign
- Migration from old schema to new schema
- Category deletion with in-use validation

## Success Criteria

- [ ] Categories stored separately in IndexedDB
- [ ] Can browse all categories in a grid view
- [ ] Can reassign contestant's category without re-importing
- [ ] PPTX import detects duplicates and offers choices
- [ ] Existing data migrates seamlessly to new schema
- [ ] No performance degradation (category lookup by ID is fast)
- [ ] All tests pass

## Notes

**Why this is BACKLOG:**
1. **Not needed for MVP** - Re-importing from PPTX works fine for testing
2. **Architectural change** - Requires schema migration and careful testing
3. **Time estimate:** 3-4 hours implementation + testing
4. **Low priority** - Nice-to-have for content management, not core gameplay

**When to prioritize:**
- If managing 20+ categories becomes cumbersome
- If multiple contestants share categories frequently
- If content editing workflow becomes important
- If building a "category library" for reuse

**Alternative (simpler):**
- Just add "Export Contestant" button that saves JSON to file
- Add "Import from JSON" in addition to PPTX import
- Manually edit JSON to swap categories, then re-import
- This avoids schema changes but is less user-friendly

## Design Mockup

```
┌─────────────────────────────────────────────────────┐
│  Category Manager                            [X]    │
├─────────────────────────────────────────────────────┤
│  [Search categories...]                     [+ New] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │[Thumb]   │ │[Thumb]   │ │[Thumb]   │ │[Thumb] ││
│  │Movies    │ │Geography │ │Science   │ │Sports  ││
│  │15 slides │ │20 slides │ │12 slides │ │18 sl...││
│  │Used by 2 │ │Used by 1 │ │Not in use│ │Used ..││
│  │[View] [✓]│ │[View] [✓]│ │[View] [✗]│ │[View]  ││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                      │
│  ┌──────────┐ ┌──────────┐                         │
│  │[Thumb]   │ │[Thumb]   │                         │
│  │History   │ │Food      │                         │
│  │25 slides │ │10 slides │                         │
│  │Used by 3 │ │Not in use│                         │
│  │[View] [✓]│ │[View] [✗]│                         │
│  └──────────┘ └──────────┘                         │
│                                                      │
└─────────────────────────────────────────────────────┘

Legend:
[✓] = Cannot delete (in use)
[✗] = Can delete
```

## References

- SPEC.md Section 4.2: Category ownership and inheritance
- Task 6: PPTX import implementation
- IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
