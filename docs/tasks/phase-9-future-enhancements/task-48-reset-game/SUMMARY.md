# Task 48: Reset Game State - Summary

## Quick Overview
New "Reset Game" button that resets gameplay state (wins, eliminations, territories) while preserving the contestant roster and their original categories. This enables running multiple games with the same players without re-importing.

## Key Differences: Reset Game vs Reset App

| Feature | Reset Game | Reset App |
|---------|-----------|-----------|
| **Contestants** | ✅ Preserved | ❌ Deleted |
| **Original Categories** | ✅ Preserved | ❌ Deleted |
| **Wins** | 🔄 Reset to 0 | ❌ Deleted |
| **Eliminations** | 🔄 All alive | ❌ Deleted |
| **Territories** | 🔄 Reset to initial | ❌ Deleted |
| **Grid Positions** | ✅ Preserved | ❌ Deleted |
| **Duel State** | 🔄 Cleared | 🔄 Cleared |
| **Game Config** | ✅ Preserved | 🔄 Cleared |
| **Theme** | ✅ Preserved | ✅ Preserved |
| **Use Case** | New game, same roster | Fresh start, demos |

## Implementation Approach

### 1. Data Model Change
Add `originalCategory: Category` field to `Contestant` interface to store the imported category for restoration.

### 2. Migration
Automatically populate `originalCategory` from existing `category` for legacy contestants on first load.

### 3. Reset Logic
- Iterate through all contestants
- Set `wins = 0`, `eliminated = false`
- Restore `category` from `originalCategory`
- Reset `controlledSquares` to single initial square
- Clear duel and timer state
- Broadcast to all windows

### 4. UI Integration
Add "Reset Game" button (warning variant) near "Reset App" button (danger variant) with clear visual distinction and explanatory modal.

## User Workflow
1. User clicks "Reset Game" in Dashboard
2. Confirmation modal shows what's preserved vs reset
3. User confirms or cancels
4. On confirm: reset all contestant state, reload page
5. All contestants alive with 0 wins and original categories

## Timeline
**3-4 days** - Medium complexity due to data migration and state management

## Value Proposition
- **Events/Tournaments**: Run multiple games without re-setup
- **Testing**: Quick game resets during development
- **Parties**: Multiple rounds with same friend group
- **Demos**: Show different game scenarios quickly

## Related
- Complements Task 31 (Reset App) rather than replacing it
- Both serve different use cases and should coexist
