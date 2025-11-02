# Parallel Workstreams for Remaining Tasks

**Current Status:** 19/27 tasks complete (70.4%)
**Remaining:** 8 tasks (1 critical, 4 polish, 3 optional)

---

## Remaining Tasks Breakdown

### 🔴 Critical for MVP (1 task)
- **Task 16:** Duel Control Logic (Correct/Skip buttons, winner determination)

### ⏳ Polish & Testing (4 tasks)
- **Task 24:** Unit Tests (business logic)
- **Task 25:** Component Tests (RTL integration tests)
- **Task 26:** E2E Tests (Playwright full game flow)
- **Task 27:** Final Polish (docs, UX refinements, keyboard shortcuts modal)

### 🚫 Optional/Nice-to-Have (3 tasks)
- **Task 21:** Game Context (refactor to Context API - not needed)
- **Task 22:** Duel Reducer (add reducer pattern - not needed)
- **Task 23:** BroadcastChannel Sync (improve cross-window sync - nice-to-have)

---

## Option 1: Single Developer (Sequential Execution)

**Total Time:** 3-5 hours
**Approach:** Complete MVP first, then polish

### Recommended Order

```
Hour 0:00 - 0:45   Task 16: Duel Control Logic ⭐ CRITICAL
Hour 0:45 - 1:00   Integration testing (full game flow)
Hour 1:00 - 2:00   Task 27: Polish & Documentation
Hour 2:00 - 3:00   Task 24: Unit Tests
Hour 3:00 - 4:00   Task 25: Component Tests
Hour 4:00 - 5:00   Task 26: E2E Tests (optional)
```

### Timeline Visualization

```
Time:    0h      1h      2h      3h      4h      5h
         ├───────┼───────┼───────┼───────┼───────┤
Task 16: ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Test:    ░░░░█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Task 27: ░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░
Task 24: ░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░
Task 25: ░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░
Task 26: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░

MVP ─────────────────▲
Complete ────────────────────────────────────────▲
```

### Pros
- ✅ Clear focus, no context switching
- ✅ Can stop after MVP (Task 16) if time-constrained
- ✅ Natural flow: build → test → polish

### Cons
- ❌ Longer calendar time (3-5 hours)
- ❌ Testing can reveal issues late

---

## Option 2: Two Developers (Parallel Streams)

**Total Time:** 2-3 hours (calendar time)
**Approach:** One dev on critical path, one on polish/testing

### Developer 1: Critical Path (Backend/Logic)
**Focus:** Get the game working

```
Hour 0:00 - 0:45   Task 16: Duel Control Logic ⭐
Hour 0:45 - 1:00   Integration testing
Hour 1:00 - 1:30   Bug fixes from integration testing
Hour 1:30 - 2:30   Task 24: Unit Tests (duel logic, timer, winner determination)
```

**Skills needed:** Strong TypeScript, game logic, state management

### Developer 2: Polish & Testing (Frontend/QA)
**Focus:** Documentation and test coverage

```
Hour 0:00 - 1:00   Task 27: Polish & Documentation
Hour 1:00 - 2:00   Task 25: Component Tests (RTL)
Hour 2:00 - 3:00   Task 26: E2E Tests (Playwright)
```

**Skills needed:** Testing, documentation, UX/UI polish

### Timeline Visualization

```
Time:    0h      1h      2h      3h
         ├───────┼───────┼───────┤

Dev 1:   [T16──][Test][T24────]
         Critical path, blocks release

Dev 2:   [T27────────][T25──][T26──]
         Can work in parallel, independent

MVP ────────────▲
Complete ──────────────────────▲
```

### Synchronization Points

1. **Hour 1:00** - Dev 1 finishes Task 16 → Dev 2 can E2E test
2. **Hour 2:30** - Both done → Final integration test together

### Pros
- ✅ **40% faster** calendar time (2-3h vs 3-5h)
- ✅ Testing and polish happen in parallel
- ✅ Two sets of eyes catch more bugs

### Cons
- ❌ Requires coordination at sync points
- ❌ Dev 2 blocked on E2E until Dev 1 finishes Task 16

---

## Option 3: Three Developers (Maximum Parallelism)

**Total Time:** 1.5-2 hours (calendar time)
**Approach:** Dedicated specialists for logic, testing, and polish

### Developer 1: Core Gameplay (Senior)
**Focus:** Critical game logic

```
Hour 0:00 - 0:45   Task 16: Duel Control Logic ⭐
Hour 0:45 - 1:00   Integration testing with Dev 2
Hour 1:00 - 1:30   Bug fixes from integration/E2E
Hour 1:30 - 2:00   Code review and final polish
```

**Skills:** Senior developer, game logic, TypeScript expert

### Developer 2: Testing (QA/Mid-level)
**Focus:** Comprehensive test coverage

```
Hour 0:00 - 0:30   Task 24: Unit Tests (existing code)
Hour 0:30 - 1:00   Task 25: Component Tests
Hour 1:00 - 1:30   Wait for Task 16, then E2E prep
Hour 1:30 - 2:00   Task 26: E2E Tests (full game flow)
```

**Skills:** Testing frameworks (Vitest, RTL, Playwright)

### Developer 3: Polish & Documentation (Junior)
**Focus:** UX refinements and documentation

```
Hour 0:00 - 1:00   Task 27: Documentation updates
Hour 1:00 - 1:30   Keyboard shortcuts modal (Task 27.5)
Hour 1:30 - 2:00   Final UX review, README polish
```

**Skills:** Documentation, UX/UI, accessibility

### Timeline Visualization

```
Time:    0h       0.5h      1h       1.5h      2h
         ├─────────┼─────────┼─────────┼─────────┤

Dev 1:   [T16────][Test]░░░░[Fixes──][Review]
         ⭐ Critical path

Dev 2:   [T24─][T25─]░░░░░░░░[T26─────]
         Testing in parallel

Dev 3:   [T27────────────────][Modal][UX──]
         Documentation & polish

MVP ──────────────────▲
Complete ─────────────────────────────────────▲
```

### Synchronization Points

1. **Hour 0:45** - Dev 1 & Dev 2 integration test together
2. **Hour 1:30** - All three devs: final E2E test and review
3. **Hour 2:00** - Ship it! 🚀

### Pros
- ✅ **Fastest option** (1.5-2h total)
- ✅ Specialists focus on their strengths
- ✅ Comprehensive testing from multiple angles
- ✅ Documentation complete in parallel

### Cons
- ❌ Coordination overhead (3 people to sync)
- ❌ Dev 2 has some idle time waiting for Task 16
- ❌ Overkill for only 8 remaining tasks

---

## Dependency Graph

```
REMAINING TASKS DEPENDENCIES
═════════════════════════════════════════════

Task 16 (Duel Control Logic) ⭐ CRITICAL
├── Blocks: Task 26 (E2E tests need working game)
└── Blocks: Final MVP release

Task 27 (Polish & Docs)
├── Independent, can start immediately
└── Includes: README, keyboard shortcuts modal

Task 24 (Unit Tests)
├── Independent, can test existing code
└── Can add Task 16 tests after it's done

Task 25 (Component Tests)
├── Independent, components already exist
└── Can add Master View tests after Task 16

Task 26 (E2E Tests)
├── Blocked by: Task 16 (needs working game flow)
└── Requires: Playwright setup

OPTIONAL TASKS (Can skip):
├── Task 21: Game Context (refactor, not needed)
├── Task 22: Duel Reducer (refactor, not needed)
└── Task 23: BroadcastChannel (enhancement, not critical)
```

---

## Recommended Approach by Team Size

### Solo Developer
👉 **Use Option 1: Sequential**
- Most efficient for one person
- Clear focus, no coordination overhead
- MVP in ~1 hour, full completion in 3-5 hours

### Small Team (2 devs)
👉 **Use Option 2: Parallel Streams**
- Best balance of speed and coordination
- Dev 1 focuses on game logic (critical path)
- Dev 2 handles polish and testing
- **40% faster** than solo (2-3h vs 3-5h)

### Larger Team (3+ devs)
👉 **Use Option 3: Maximum Parallelism**
- Overkill but fastest (1.5-2h)
- Good for sprint completion
- Requires tight coordination
- Best if deadline is critical

---

## Task Details & Estimates

### Task 16: Duel Control Logic ⭐ CRITICAL
**Time:** 30-45 minutes
**File:** `src/pages/MasterView.tsx`
**What to implement:**
```typescript
// Correct button handler
const handleCorrect = () => {
  // 1. Advance to next slide
  // 2. If last slide, switch to other player
  // 3. If both players done, end duel
  // 4. Update duel state in localStorage
};

// Skip button handler
const handleSkip = () => {
  // 1. Trigger skip animation (3 seconds)
  // 2. Deduct 3 seconds from active player's time
  // 3. Advance to next slide
  // 4. Update duel state
};

// Duel end logic
const handleDuelEnd = () => {
  // 1. Compare remaining time (more time = winner)
  // 2. Update contestant records (wins, eliminated)
  // 3. Winner gets UNPLAYED category
  // 4. Clear duel state
  // 5. Navigate to dashboard
};
```

**Dependencies:** useGameTimer (✅ complete), useDuelState (✅ complete)
**Tests needed:** Winner determination, time comparison, category inheritance

---

### Task 24: Unit Tests
**Time:** 1 hour
**Files to test:**
- `src/hooks/useGameTimer.test.tsx` (timing accuracy)
- `src/utils/duelLogic.test.ts` (winner determination)
- `src/utils/categoryInheritance.test.ts` (inheritance logic)

**Coverage goals:** Edge cases, time expiration, tie-breakers

---

### Task 25: Component Tests
**Time:** 1 hour
**Components to test:**
- Master View (button interactions, state updates)
- DuelSetup (validation, navigation)
- Audience View (timer sync, animation triggers)

**Framework:** React Testing Library + user-event

---

### Task 26: E2E Tests
**Time:** 1 hour
**Setup:** Install Playwright (`npm install -D @playwright/test`)

**Test scenarios:**
```javascript
test('Complete game flow', async ({ page }) => {
  // 1. Import two contestants
  // 2. Select both contestants
  // 3. Start duel
  // 4. Master view: answer questions
  // 5. Verify audience view updates
  // 6. Complete duel
  // 7. Verify winner/loser on dashboard
});

test('Cross-window synchronization', async ({ context }) => {
  // 1. Open master view
  // 2. Open audience view in new window
  // 3. Verify state syncs between windows
});
```

**Dependencies:** Task 16 complete (needs working game)

---

### Task 27: Polish & Documentation
**Time:** 1 hour
**Checklist:**
- [ ] Update README with current feature status
- [ ] Add keyboard shortcuts modal (? key)
- [ ] Final UX pass (colors, spacing, animations)
- [ ] Add inline help text where needed
- [ ] Verify accessibility (ARIA labels, keyboard nav)
- [ ] Proofread all user-facing text
- [ ] Add demo video or screenshots (optional)

**No blockers** - can start immediately

---

## Coordination Tips

### For Option 2 (2 Developers)

**Communication Protocol:**
1. **Kickoff (Hour 0:00):** Assign tasks, clarify dependencies
2. **Check-in (Hour 0:45):** Dev 1 finishes Task 16, integration test
3. **Sync (Hour 1:30):** Both review test failures, prioritize fixes
4. **Wrap-up (Hour 2:30):** Final smoke test, merge to main

**Tools:**
- Slack/Discord for quick questions
- Shared screen for integration testing
- Git worktrees for parallel work

---

### For Option 3 (3 Developers)

**Communication Protocol:**
1. **Kickoff (Hour 0:00):** Assign roles (Core, Testing, Polish)
2. **Sync 1 (Hour 0:45):** Dev 1 + Dev 2 integration test
3. **Sync 2 (Hour 1:30):** All three: E2E test review
4. **Wrap-up (Hour 2:00):** Final review, celebrate 🎉

**Avoid:**
- Dev 2 starting E2E tests before Task 16 is done
- Merge conflicts (use worktrees or clear file ownership)
- Over-communication (focus on coding, sync at checkpoints)

---

## Success Criteria

### Minimum Viable Product (MVP)
- [x] Task 16 complete (Correct/Skip buttons work)
- [x] Can play full game end-to-end
- [x] Winner/loser determined correctly
- [x] Category inheritance works
- [x] No critical bugs
- [ ] Basic testing (manual smoke test)

### Production Ready
- [x] All MVP criteria
- [x] Task 24: Unit tests (business logic covered)
- [x] Task 25: Component tests (UI interactions covered)
- [x] Task 26: E2E tests (full flow automated)
- [x] Task 27: Polish (docs, UX, accessibility)
- [x] Build passing, no lint errors

---

## Time-Boxed Approach

If you have **limited time**, use this priority order:

### 1 Hour Available
- Task 16 only (gets to MVP)

### 2 Hours Available
- Task 16 (MVP)
- Task 27 (polish)

### 3 Hours Available
- Task 16 (MVP)
- Task 27 (polish)
- Task 24 (unit tests)

### 4+ Hours Available
- Task 16 (MVP)
- Task 27 (polish)
- Task 24 (unit tests)
- Task 25 (component tests)
- Task 26 (E2E tests)

---

## Risk Mitigation

### If Task 16 Takes Longer Than Expected

**Common Issues:**
1. **Winner determination edge cases** (ties, time expiration during slide change)
   - Solution: Reference SPEC.md 4.4, use time remaining as tie-breaker
2. **Category inheritance confusion** (winner gets UNPLAYED, not duel category)
   - Solution: Clear comments, add test for this specific case
3. **State synchronization** (audience view not updating)
   - Solution: Ensure duel state saved to localStorage after each action

**Contingency:**
- Implement basic Correct button first (proves game loop works)
- Add Skip button second (nice-to-have feature)
- Deferr edge cases to Task 24 (unit tests will catch them)

---

## Post-Completion Checklist

After all tasks are done:

- [ ] `npm run build` - passes
- [ ] `npm test -- --run` - all tests pass
- [ ] `npm run lint` - no errors
- [ ] Smoke test: Full game flow works
- [ ] Documentation: README is up-to-date
- [ ] Git: All changes committed and pushed
- [ ] Demo: Record quick video of gameplay (optional)
- [ ] Celebrate! 🎉

---

## Conclusion

**Recommended configurations:**

- **Solo dev:** Option 1 (Sequential, 3-5h)
- **2 devs:** Option 2 (Parallel, 2-3h) ⭐ **BEST BALANCE**
- **3 devs:** Option 3 (Maximum parallelism, 1.5-2h)

**Critical path:** Task 16 (30-45 min) → MVP
**Full completion:** 1.5-5 hours depending on team size

All paths lead to a fully functional, tested, polished game. Choose based on team size and time constraints.

---

**Files:**
- Full analysis: `/private/tmp/the_floor/docs/PROGRESS_REPORT.md`
- Task definitions: `/private/tmp/the_floor/docs/tasks/`
- This document: `/private/tmp/the_floor/docs/PARALLEL_WORKSTREAMS.md`
