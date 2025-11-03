# Phase 10: Post-Demo Bug Fixes

## Overview
Critical bugs discovered during the first live demo of The Floor on November 2, 2025. These issues affect gameplay fairness, rules compliance, and user experience.

## Priority
**HIGH** - These bugs should be addressed before the next game session, as they impact gameplay balance and rules adherence.

## Background

The first live demo was successful and revealed the application is production-ready for basic gameplay. However, several issues were discovered that affect:
- Rules compliance (randomizer selection, timeout behavior)
- Fairness (pass with low time exploit)
- Visual clarity (territory name display)
- Game logic (resurrection mechanics)

These bugs were not caught during testing because they require real-world gameplay scenarios with multiple contestants and actual player strategies.

## Tasks

### Task 37: Duel Timeout Answer Reveal
**Priority**: HIGH | **Status**: Not Started

When a player's time runs out, the correct answer should be revealed for 3 seconds before ending the duel, matching the skip behavior and providing closure for the audience.

**Key Requirements**:
- Pause clocks when timeout occurs
- Show answer for 3 seconds
- Then end duel with correct winner/loser determination

### Task 38: Randomizer Smallest Territory
**Priority**: HIGH | **Status**: Not Started

Per The Floor rules, random selection should only consider contestants tied for the smallest territory size. Currently, all non-eliminated contestants have equal probability.

**Key Requirements**:
- Calculate territory size for all active contestants
- Filter to only those with minimum size
- Random select from filtered pool
- UI indication of eligible contestants

### Task 39: Fix Territory Name Display
**Priority**: HIGH | **Status**: Not Started

Multi-square contiguous territories sometimes display the contestant's name multiple times, especially for even-sized territories (1x2, 1x4, 2x2, etc.) where the centroid falls between squares.

**Key Requirements**:
- Calculate true centroid of territory
- Determine single closest square
- Display name only on that square
- Handle tie-breaking deterministically

### Task 40: Instant Fail Late Pass
**Priority**: HIGH | **Status**: Not Started

Passing with less than 3 seconds remaining creates an exploit (negative time). Players should instantly lose if they attempt to pass without sufficient time for the penalty.

**Key Requirements**:
- Detect pass with <3s remaining
- Instantly set player time to 0
- Still show answer for 3s (audience benefit)
- Declare other player as winner after reveal

### Task 41: Resurrection Category Logic
**Priority**: MEDIUM | **Status**: Not Started

Define and implement correct category assignment when a contestant is resurrected: they should receive the category from their elimination duel, minus already-shown slides.

**Key Requirements**:
- Track duel history (category used, slides shown)
- Calculate remaining slides on resurrection
- Provide fallback if no slides remain
- UI for game master to confirm/override

## Implementation Order

**Recommended sequence**:
1. Task 37 (Timeout Reveal) - Affects every duel, most noticeable
2. Task 40 (Instant Fail Late Pass) - Affects fairness, exploitable
3. Task 38 (Randomizer Territory) - Rules compliance, affects strategy
4. Task 39 (Territory Names) - Visual issue, less critical
5. Task 41 (Resurrection) - Only affects resurrection feature

**Alternative**: All tasks are independent and can be done in parallel if multiple developers available.

## Testing Requirements

All tasks must include:
- Unit tests for new logic
- Integration tests for affected workflows
- Manual testing with realistic scenarios
- Regression testing (ensure no existing functionality broken)

## Success Criteria

Phase 10 is complete when:
- [ ] All 5 tasks completed and tested
- [ ] All tests passing (517+ tests)
- [ ] Build succeeds without errors
- [ ] Lint passes
- [ ] Manual testing validates fixes
- [ ] Documentation updated
- [ ] Committed with descriptive messages

## Dependencies

### Task Dependencies
- Task 37: Depends on Task 20 (Skip Animation logic)
- Task 38: Depends on Task 36 (Grid View territory data)
- Task 39: Depends on Task 36 (Grid View rendering)
- Task 40: Depends on Task 20 (Skip Animation logic)
- Task 41: Depends on Task 22 (Duel Reducer)

### External Dependencies
- Task 35 (Demo Hotfixes) - Context for these issues
- Grid View (Task 36) - Already implemented
- Duel state management - Already implemented

## Notes

- These bugs emerged from **real gameplay** that couldn't be simulated in testing
- They represent gaps between specification and reality
- Some (like randomizer rules) were spec omissions rather than implementation bugs
- Others (like timeout reveal) were UX gaps discovered through actual use
- This is a normal part of the development cycle: build → test → demo → refine

## Related Documentation

- Task 35: Demo Hotfixes (different issues, already fixed)
- SPEC.md: Updated to reflect rule clarifications
- Phase 13, Task 61: Process improvements to prevent similar issues

## Timeline Estimate

- Task 37: 1-2 days (reuse skip logic)
- Task 38: 2-3 days (new territory logic + UI)
- Task 39: 1 day (math bug fix)
- Task 40: 1 day (similar to timeout)
- Task 41: 2-3 days (requires history tracking)

**Total**: 7-11 days for all fixes

## Future Considerations

Some issues identified during demo but deferred to Phase 9:
- Grid color improvements (Task 42)
- Slide vertical fill (Task 43)
- Winning animation (Task 44)

These are enhancements, not bugs, and don't affect gameplay fairness.
