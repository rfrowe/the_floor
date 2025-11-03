# Task 35: Demo Hotfixes

## Objective
Document and formalize critical hotfixes applied during the first live demo that significantly improved gameplay experience and audience visibility.

## Status
**COMPLETED** - Hotfixes were applied live during demo and are being formalized with proper test coverage.

## Priority
**CRITICAL** - These changes override all previous specifications and represent the actual production behavior discovered through real gameplay.

## Background

During the first live demo of "The Floor" on November 2, 2025, several critical issues were discovered that required immediate hotfixes:

1. **Skip behavior was strategically unbalanced** - Switching control to opponent after skip was too punishing
2. **30 seconds per player was too restrictive** - New players needed more time to think
3. **Category ownership was unclear to audience** - Couldn't track which category each contestant owned
4. **Text was unreadable on projection screen** - Font sizes too small for distance viewing

These hotfixes were applied live and tested during the demo. They represent the true production requirements and override any conflicting documentation.

## Hotfix Changes

### 1. Skip Behavior Fix
**Problem**: When a player skipped, control would transfer to their opponent. This made skipping extremely punishing - you'd lose your turn AND give control away.

**Solution**: Skipping player now maintains control and continues to the next slide. Only the 3-second time penalty is applied.

**Rationale**: Makes skip a pure time penalty without the additional punishment of losing control. Players can maintain momentum even when uncertain.

**Files Changed**:
- `src/hooks/useAuthoritativeTimer.ts` - Removed player switching logic after skip ends
- `src/pages/MasterView.tsx` - Skip callback keeps current active player
- `docs/SPEC.md` - Updated skip behavior documentation
- `docs/tasks/phase-8-testing/task-28.1-timer-sync-fix/PROMPT.md` - Updated timer sync spec

### 2. Time Increase to 45 Seconds
**Problem**: 30 seconds per player was too restrictive, especially for contestants new to their categories. Players felt rushed and couldn't think through answers.

**Solution**: Increased `DEFAULT_GAME_CONFIG.timePerPlayer` from 30 to 45 seconds.

**Rationale**: Provides better gameplay experience, reduces pressure on new players, maintains time pressure for strategic gameplay while being more forgiving.

**Files Changed**:
- `src/types/game.ts` - Updated default value and JSDoc comment
- `docs/SPEC.md` - Updated default time documentation

### 3. Category Name Display on Grid
**Problem**: Audience members couldn't track which category each contestant owned. The grid only showed names, making it difficult to follow territory ownership and category distribution.

**Solution**: Display category name beneath contestant name on grid square centroids.

**Rationale**: Improves at-a-glance understanding of game state. Makes it easier for audience to follow who owns what category.

**Files Changed**:
- `src/components/floor/GridSquare.tsx` - Added category name display with smaller font (0.8em)
- `docs/SPEC.md` - Removed "Territory visualization" from Out of Scope

### 4. Font Size Increases
**Problem**: When projected on a large screen/projector, all text was too small to read from audience distance. Grid square labels and clock bar times were unreadable.

**Solution**: Significantly increased font sizes:
- Grid square labels: 0.9rem → 2.2rem (2.4x increase)
- Grid responsive sizes increased proportionally
- Clock bar time: clamp(0.9rem, 1.5vw, 1.25rem) → clamp(1.2rem, 2vw, 1.75rem)

**Rationale**: Better visibility on projection screens and large displays. Text now clearly readable from distance.

**Files Changed**:
- `src/components/floor/GridSquare.module.css` - Increased all font sizes
- `src/components/duel/ClockBar.module.css` - Increased time display font size

## Test Coverage

### Original Test Coverage
- Total tests: 515 passing

### Added Test Coverage
1. **Skip Behavior Test** (`src/pages/MasterView.test.tsx`)
   - Added: `should keep control with skipping player and not switch to opponent`
   - Verifies activePlayer remains the same after skip

2. **Category Display Test** (`src/components/floor/GridSquare.test.tsx`)
   - Added: `displays category name alongside contestant name`
   - Verifies both contestant name and category name are rendered

### Final Test Coverage
- Total tests: 517 passing
- All hotfix behaviors validated

## Acceptance Criteria

- [x] Skip behavior: Skipping player maintains control
- [x] Skip behavior: No player switch after skip animation ends
- [x] Default time: 45 seconds per player
- [x] Category display: Category name shown on grid squares
- [x] Category display: Text styled smaller (0.8em) with transparency
- [x] Font sizes: Grid labels increased to 2.2rem
- [x] Font sizes: Clock bar time increased appropriately
- [x] Font sizes: Responsive breakpoints updated proportionally
- [x] Documentation: SPEC.md updated to reflect all changes
- [x] Documentation: Task specs updated where applicable
- [x] Tests: All 517 tests passing
- [x] Tests: New tests added for skip behavior and category display
- [x] Build: TypeScript compilation successful
- [x] Lint: ESLint passes with no errors

## Implementation Details

### Commit Structure
These changes should be committed as 4 separate logical commits:

1. **fix: correct skip behavior to keep control with skipping player**
   - Core behavior change with test coverage
   - Updates timer sync documentation

2. **feat: increase default player time from 30 to 45 seconds**
   - Simple configuration change
   - Updates tests and documentation

3. **feat: display category names on floor grid squares**
   - UI enhancement with test coverage
   - Updates SPEC.md

4. **style: increase font sizes for better audience visibility**
   - Pure CSS changes
   - No test changes needed (visual only)

### Why These Changes Are Not Bugs
These are not bugs but rather **specification changes discovered through real usage**:
- Skip behavior was implemented correctly per original spec, but the spec was wrong
- 30 seconds was the planned default, but real gameplay proved it insufficient
- Category display wasn't in the original requirements, but proved essential
- Font sizes were readable on laptop screens but not on projection

These are **production requirements** that override the original design.

## Dependencies

No dependencies - these are independent hotfixes that can be applied immediately.

## Testing Strategy

1. **Unit Tests**: Added for behavioral changes (skip, category display)
2. **Integration**: Verified during live demo with real contestants
3. **Visual**: Font sizes tested on actual projection screen
4. **Regression**: Full test suite run (517 tests passing)

## Success Criteria

- [x] All hotfixes applied and committed
- [x] Test coverage added where appropriate
- [x] Documentation updated to match production behavior
- [x] SPEC.md is now authoritative source of truth
- [x] No regressions (all existing tests pass)
- [x] Live demo validated all changes as improvements

## Out of Scope

- Reverting these changes (they are now production requirements)
- Making these configurable (they are the new defaults)
- A/B testing (live demo proved effectiveness)

## Notes

**IMPORTANT**: These hotfixes represent the **actual production behavior** of the application. They override any conflicting documentation or specifications. The SPEC.md and related task files have been updated to reflect these changes as the new source of truth.

**Why Document Post-Facto?**
These changes were made live during a critical demo and couldn't wait for formal task planning. This task file serves as retrospective documentation to:
1. Explain the rationale behind each change
2. Document test coverage additions
3. Provide context for future developers
4. Formalize the changes in the task-based development workflow

**Lessons Learned**:
- Real gameplay reveals requirements that paper specs cannot
- Projection/distance viewing requires much larger fonts than laptop screens
- Game balance must be tested with actual players, not just theory
- Audience perspective is as important as player perspective
