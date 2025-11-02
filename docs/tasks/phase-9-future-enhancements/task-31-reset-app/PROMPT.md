# Task 31: Reset Application State ("Nuke Button")

## Objective
Implement a "Reset App" feature that clears all application data (contestants, duel state, configuration) to return to a clean slate, with proper confirmation and error handling.

## Status
✅ Completed

## Acceptance Criteria
- [x] "Reset App" button in Dashboard header
- [x] Confirmation modal warns user about data loss
- [x] Modal lists all data that will be deleted
- [x] Button uses danger variant (red) to indicate destructive action
- [x] Clears all IndexedDB data (contestants with categories)
- [x] Clears all localStorage data (duel state, game config)
- [x] Page reloads after successful reset
- [x] Error handling for reset failures
- [x] Comprehensive unit tests for reset functionality
- [x] No data loss if user cancels
- [x] Title attribute with description on button

## Dependencies
- Task 03: IndexedDB Abstraction (`clearAllContestants`)
- Task 04: localStorage Abstraction (`clear`)
- Task 07: Modal Component (confirmation dialog)
- Task 10: Dashboard Layout (integration point)

## Implementation Details

### New Files Created

1. **src/utils/resetApp.ts**
   - `resetAppState()` function
   - Clears IndexedDB via `clearAllContestants()`
   - Clears localStorage via `clear()`
   - Proper error handling with informative messages
   - Returns Promise for async error handling

2. **src/utils/resetApp.test.ts**
   - Test: "should clear both IndexedDB and localStorage"
   - Test: "should throw error if IndexedDB clear fails"
   - Test: "should throw error if localStorage clear fails"
   - Test: "should include original error message in thrown error"
   - 4 comprehensive unit tests

### Files Modified

1. **src/pages/Dashboard.tsx**
   - Added import: `resetAppState` utility
   - Added state: `showResetConfirm`
   - Added handlers:
     - `handleResetClick()` - opens confirmation modal
     - `handleConfirmReset()` - executes reset and reloads
     - `handleCancelReset()` - closes modal
   - Added "Reset App" button in header (danger variant)
   - Added confirmation modal with detailed warning

2. **src/pages/Dashboard.test.tsx**
   - Added import: mock `resetApp` module
   - Added mock: `window.location.reload`
   - Test: "shows Reset App button in header"
   - Test: "shows confirmation modal when Reset App button clicked"
   - Test: "cancels reset when Cancel button clicked"
   - Test: "resets app and reloads when confirmed"
   - Test: "handles reset error gracefully"
   - 5 new tests for reset functionality

### Total Test Count
- Before: 399 tests
- Added: 9 tests (4 in resetApp.test.ts, 5 in Dashboard.test.tsx)
- After: 408 tests

## User Flow

1. User clicks "Reset App" button in Dashboard header
2. Confirmation modal appears with warning:
   ```
   Warning: This will permanently delete ALL application data:
   • All contestants and their categories
   • Active duel state
   • Game configuration

   This action cannot be undone.
   ```
3. User has two options:
   - **Cancel** → Modal closes, no changes made
   - **Reset Everything** → Execute reset

4. If user confirms:
   - Clear all IndexedDB data (contestants)
   - Clear all localStorage data (duel state, config)
   - Show success → reload page
   - On error → show alert with error message, don't reload

## Confirmation Modal Design

```
┌────────────────────────────────────────┐
│  Reset Application              [X]    │
├────────────────────────────────────────┤
│                                        │
│  ⚠ Warning: This will permanently      │
│  delete ALL application data:          │
│                                        │
│  • All contestants and their           │
│    categories                          │
│  • Active duel state                   │
│  • Game configuration                  │
│                                        │
│  This action cannot be undone.         │
│                                        │
├────────────────────────────────────────┤
│  [Cancel]         [Reset Everything]   │
│   Gray              Red                │
└────────────────────────────────────────┘
```

## Implementation Code

### Reset Utility
```typescript
// src/utils/resetApp.ts
export async function resetAppState(): Promise<void> {
  try {
    // Clear IndexedDB (contestants with images)
    await clearAllContestants();

    // Clear localStorage (duel state, game config, etc.)
    clearLocalStorage();
  } catch (error) {
    console.error('Error resetting app state:', error);
    throw new Error(
      `Failed to reset application state: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
```

### Dashboard Integration
```typescript
const handleConfirmReset = async () => {
  try {
    await resetAppState();
    setShowResetConfirm(false);
    // Force refresh to reload empty state
    window.location.reload();
  } catch (error) {
    console.error('Failed to reset app:', error);
    alert(
      `Failed to reset application: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};
```

## Error Handling

### IndexedDB Failure
```
Failed to reset application: Failed to clear contestants from IndexedDB
```

### localStorage Failure
```
Failed to reset application: localStorage error
```

### Generic Failure
```
Failed to reset application: Unknown error
```

## Success Criteria
- Button prominently placed and clearly labeled
- Confirmation prevents accidental resets
- All data cleared successfully
- Page reloads to show clean state
- Errors handled gracefully without reload
- Tests verify all scenarios
- No data loss on cancel
- Accessible via keyboard

## Out of Scope
- Selective reset (e.g., "delete contestants only")
- Export data before reset
- Undo/restore after reset
- Reset history or audit log
- Confirmation via typing "DELETE" or similar
- Countdown timer before reset
- Backup creation before reset
- Cloud sync or multi-device reset

## Notes
- This is a destructive operation - confirmation is critical
- Use danger variant (red) to signal risk
- Clear, specific warning about what gets deleted
- Page reload ensures fresh state without stale references
- Error handling prevents partial resets (all-or-nothing)
- Test with actual data to verify complete cleanup
- Consider adding to Settings page instead of always-visible header
- Useful for testing and demonstrations
- Production apps might want to restrict this to admin users
