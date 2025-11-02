# Task 27.6: Multi-File Category Import with Navigation

## Objective
Enhance the CategoryImporter component to support importing multiple contestant/category pairs in a single operation, with a navigation interface to review and edit each contestant before batch import.

## Status
✅ Completed

## Acceptance Criteria
- [x] File input accepts multiple JSON files (`multiple` attribute)
- [x] Parse and validate all selected files
- [x] Navigation UI to review contestants one at a time
- [x] "Next" button to move to next contestant
- [x] "Import N Contestants" button on last contestant
- [x] Current position indicator (e.g., "Reviewing contestant 1 of 3")
- [x] Edits preserved when navigating between contestants
- [x] Visual distinction between navigation buttons and cancel
- [x] Comprehensive unit tests for multi-file navigation
- [x] All validation rules apply to each file
- [x] Batch import succeeds or fails gracefully per contestant

## Dependencies
- Task 08: Category Importer (base implementation)
- Task 10: Dashboard Layout (import integration)

## Implementation Details

### Files Modified
1. **src/components/CategoryImporter.tsx**
   - Added multi-file parsing with FileList iteration
   - Added state for navigation: `allContestants`, `currentIndex`
   - Added "Next" button for navigation
   - Changed "Import" button to show count and appear only on last contestant
   - Preserved contestant name/category edits during navigation
   - Button styling: Cancel (red, left), Next (blue, right), Import (green, right)

2. **src/components/CategoryImporter.test.tsx**
   - Added test: "should show Next button when multiple files are loaded"
   - Added test: "should navigate between contestants using Next button"
   - Added test: "should preserve edits when navigating between contestants"
   - Test count increased from 13 to 16 tests

3. **src/pages/Dashboard.tsx**
   - Updated import handler to process array of contestants
   - Added success/failure counters
   - Enhanced alert messages for batch results
   - Shows summary: "Imported N contestants, but M failed"

4. **src/pages/Dashboard.test.tsx**
   - Tests verify alphabetical sorting still works
   - Tests verify Dashboard integration with multi-import

## User Flow

### Single File (Existing Behavior)
1. User selects one JSON file
2. Modal shows "Import Contestant" UI
3. User edits name/category if needed
4. User clicks "Import" or "Cancel"

### Multiple Files (New Behavior)
1. User selects multiple JSON files (Shift+Click or Ctrl+Click)
2. Modal shows "Reviewing contestant 1 of N"
3. User reviews/edits first contestant
4. User clicks "Next" → advances to contestant 2
5. Repeat for each contestant
6. On last contestant, "Next" changes to "Import N Contestants"
7. All contestants imported in batch
8. Summary message shows success/failure counts

## Button Layout
```
┌─────────────────────────────────────────┐
│  [Cancel]              [Next/Import]    │
└─────────────────────────────────────────┘
   Red, Left           Blue/Green, Right
```

## Implementation Guidance

### 1. Multi-File Selection
```typescript
<input
  type="file"
  accept="application/json"
  onChange={handleFileSelect}
  multiple  // Enable multi-select
/>
```

### 2. Parse All Files
```typescript
const contestants: ContestantData[] = [];
for (const file of selectedFiles) {
  const category = await loadCategoryJSON(file);
  const name = extractNameFromFilename(file.name);
  contestants.push({ name, category });
}
setAllContestants(contestants);
setCurrentIndex(0);
```

### 3. Navigation State
```typescript
const [allContestants, setAllContestants] = useState<ContestantData[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);
const currentContestant = allContestants[currentIndex];
const isLastContestant = currentIndex === allContestants.length - 1;
```

### 4. Edit Preservation
```typescript
const handleNext = () => {
  // Save current edits
  const updated = [...allContestants];
  updated[currentIndex] = {
    contestantName,
    categoryName,
    category: currentContestant.category,
  };
  setAllContestants(updated);

  // Advance to next
  setCurrentIndex(currentIndex + 1);
};
```

### 5. Batch Import
```typescript
const handleImportAll = () => {
  const validContestants = allContestants.filter(
    c => c.contestantName.trim() && c.categoryName.trim()
  );
  onImport(validContestants.map(c => ({
    name: c.contestantName,
    category: c.category,
  })));
};
```

## Success Criteria
- User can select multiple files and review each one
- Navigation works smoothly without losing edits
- Visual feedback shows progress (X of N)
- Buttons are clearly labeled and positioned
- All contestants imported in one operation
- Error handling for partial failures
- Tests verify multi-file behavior
- No regression in single-file import

## Out of Scope
- Drag and drop multiple files
- Bulk editing (e.g., "apply category to all")
- Reordering contestants before import
- Removing individual contestants from batch
- Progress bar during import
- Undo/redo for edits
- Preview of all contestants before import

## Notes
- Filename parsing: "john-doe-history.json" → Name: "John Doe"
- Validation applies per contestant (empty names/categories rejected)
- Button colors: Cancel (red), Next (blue), Import (green)
- Test with 2, 5, and 10 files to verify performance
- Consider UX: should invalid contestants be skippable?
- Dashboard shows summary: "Imported 5 contestants, 2 failed"
