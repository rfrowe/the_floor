# The Floor - Implementation Tasks

This directory contains a structured breakdown of all implementation tasks for "The Floor" game show web application.

## Task Organization

Tasks are organized into 13 phases:
- **Phases 1-8:** Core implementation and testing (MVP - COMPLETE)
- **Phase 9:** Future enhancements (ongoing, post-MVP)
- **Phase 10:** Post-demo bug fixes (HIGH priority)
- **Phase 11:** Philips Hue integration (PROPOSED)
- **Phase 12:** LLM Studio for content generation (PROPOSED)
- **Phase 13:** Process improvements and documentation

### Phase 1: Project Setup (3 tasks)
Foundation: project initialization, code quality tools, and folder structure.
- `task-01-project-init` - Initialize Vite + React + TypeScript
- `task-02-code-quality` - Configure ESLint and Prettier
- `task-03-project-structure` - Set up folder structure and routing

### Phase 2: Data Layer (3 tasks)
Data models, storage, and PPTX import functionality.
- `task-04-data-models` - Define TypeScript interfaces
- `task-05-storage-layer` - Create localStorage abstraction
- `task-06-pptx-import` - Build PPTX parser and importer

### Phase 3: Core Components (3 tasks)
Reusable UI components used throughout the application.
- `task-07-layout-components` - Build common UI components (Button, Card, Modal, etc.)
- `task-08-contestant-card` - Create contestant display card
- `task-09-slide-viewer` - Build slide viewer with censor boxes

### Phase 4: Game Master Dashboard (4 tasks)
Main control interface for the game master.
- `task-10-dashboard-layout` - Create dashboard page layout
- `task-11-contestant-list` - Implement selection and random select
- `task-12-duel-setup` - Build duel setup interface
- `task-13-game-config` - Create game configuration UI

### Phase 5: Master Control View (3 tasks)
Duel control interface for game master.
- `task-14-master-view-layout` - Create master control page
- `task-15-duel-controls` - Implement Correct/Skip buttons
- `task-16-timer-logic` - Build countdown timer system

### Phase 6: Audience Display View (4 tasks)
Full-screen display for audience/players.
- `task-17-audience-view-layout` - Create audience view page
- `task-18-slide-display` - Implement full-screen slide display
- `task-19-clock-bar` - Build top clock bar with player info
- `task-20-skip-animation` - Create 3-second answer display

### Phase 7: State Management (3 tasks)
Global state and cross-window synchronization.
- `task-21-game-context` - Create React Context for game state
- `task-22-duel-reducer` - Build duel state reducer
- `task-23-cross-window-sync` - Implement master/audience sync

### Phase 8: Testing & Polish (4 tasks)
Comprehensive testing and final refinements.
- `task-24-unit-tests` - Write unit tests for business logic
- `task-25-component-tests` - Add React Testing Library tests
- `task-26-e2e-tests` - Create Playwright E2E tests
- `task-27-polish` - Final polish and documentation
- `task-28.1-timer-sync-fix` - Fix master-audience timer synchronization
- `task-28.2-fix-duel-inheritance` - Fix duel category inheritance bug
- `task-28.3-handle-slides-exhausted` - Handle slides exhausted edge case

### Phase 9: Future Enhancements (ongoing)
Post-MVP features and improvements for enhanced functionality.
- `task-30-category-manager` - Independent category management system
- `task-31-reset-app` - Add functionality to reset/clear application data
- `task-32-dark-mode` - Implement dark mode theme support
- `task-33-sound-effects` - Add sound effects for duel actions
- `task-34-audience-view-theming` - Theme audience view to match TV show aesthetic
- `task-36-grid-view-floor` - Implement grid view floor display with territory consolidation
- `task-42-grid-color-improvements` - Improve territory color selection for adjacent distinction
- `task-43-slide-vertical-fill` - Maximize slide image vertical space usage
- `task-44-winning-animation` - Enhanced winning animation with confetti
- `task-45-single-combat-mode` - Exhibition duels that don't affect game state
- `task-46-finale-best-of-three` - Finale best-of-three format with tie-breaker
- `task-47-taint-button` - Skip tainted questions without penalty

### Phase 10: Post-Demo Bug Fixes (HIGH PRIORITY)
Critical bugs discovered during first live demo that affect gameplay fairness and rules compliance.
- `task-37-duel-timeout-answer-reveal` - Show correct answer for 3s when duel times out
- `task-38-randomizer-smallest-territory` - Random selection only picks contestants with smallest territory
- `task-39-fix-territory-name-display` - Fix multiple names appearing on multi-square territories
- `task-40-instant-fail-late-pass` - Instant fail if passing with <3 seconds remaining
- `task-41-resurrection-category-logic` - Correct category assignment for resurrected contestants

### Phase 11: Philips Hue Integration (PROPOSED)
Smart lighting integration for "The Randomizer" effect.
- See `phase-11-hue-integration/PHASE_PROPOSAL.md` for detailed breakdown
- Tasks 48-52 (Bridge discovery, API client, lighting effects, integration)

### Phase 12: LLM Studio (PROPOSED)
AI-powered content creation for generating and editing game categories.
- See `phase-12-llm-studio/PHASE_PROPOSAL.md` for detailed breakdown
- Tasks 53-60 (Studio UI, LLM integration, image search, editing, export)

### Phase 13: Process Improvements
Meta-analysis and documentation improvements based on development experience.
- `task-61-development-process-analysis` - Analyze development process and propose improvements

## How to Use These Tasks

Each task folder contains a `PROMPT.md` file with:
- **Objective**: Clear goal for the task
- **Acceptance Criteria**: Checklist of requirements
- **Implementation Guidance**: High-level approach and best practices
- **Success Criteria**: How to verify completion
- **Out of Scope**: What NOT to include
- **Notes**: Additional context and coordination points

### Recommended Workflow

1. **Read SPEC.md** first to understand the overall system
2. **Follow phase order** - each phase builds on previous ones
3. **Within phases**, tasks can often be done in parallel
4. **Use prompts as guidance**, not prescriptive instructions
5. **Adapt as needed** - these are guidelines, not rigid rules
6. **Test as you go** - don't wait until phase 8

### Dependencies Between Tasks

```
Phase 1 → Phase 2 → Phase 3 → Phases 4-6 (parallel) → Phase 7 → Phase 8
                                   ↓
                            Can be done in any order,
                            but coordinate on shared components
```

### Task Completion Guidelines

A task is complete when:
- [ ] All acceptance criteria are met
- [ ] Code follows ESLint/Prettier standards
- [ ] Relevant tests are written and passing
- [ ] Code is reviewed (if working in team)
- [ ] Documentation is updated
- [ ] Integration with other components verified

## Tips for Success

1. **Start small**: Get something working end-to-end early (even if minimal)
2. **Iterate**: Don't try to perfect each task before moving on
3. **Test continuously**: Run tests frequently during development
4. **Commit often**: Small, focused commits make debugging easier
5. **Ask questions**: If requirements are unclear, clarify before implementing
6. **Stay focused**: Each prompt defines clear scope - avoid feature creep
7. **Coordinate**: Many tasks reference each other - keep interfaces clean

## Reference Documents

- `../SPEC.md` - Technical specification (source of truth)
- `../PROMPT.md` - Original project requirements
- Each `PROMPT.md` - Detailed task guidance

## Progress Tracking

Current status (as of first live demo):
- [x] Phase 1: Project Setup (COMPLETE)
- [x] Phase 2: Data Layer (COMPLETE)
- [x] Phase 3: Core Components (COMPLETE)
- [x] Phase 4: Game Master Dashboard (COMPLETE)
- [x] Phase 5: Master Control View (COMPLETE)
- [x] Phase 6: Audience Display View (COMPLETE)
- [x] Phase 7: State Management (COMPLETE)
- [x] Phase 8: Testing & Polish (COMPLETE - MVP ACHIEVED)
- [ ] Phase 9: Future Enhancements (ONGOING - 12 tasks defined)
- [ ] Phase 10: Post-Demo Fixes (NEW - 5 HIGH PRIORITY tasks)
- [ ] Phase 11: Hue Integration (PROPOSED - see phase proposal)
- [ ] Phase 12: LLM Studio (PROPOSED - see phase proposal)
- [ ] Phase 13: Process Improvements (NEW - 1 task)

## Phase 9: Future Enhancements

This phase contains post-MVP features and improvements that are not required for core gameplay but enhance the user experience and content management capabilities.

**Characteristics:**
- Not required for MVP release
- Can be implemented in any order based on priority
- Lower priority than bug fixes and polish
- Should not introduce breaking changes to core functionality

**Current Tasks:**
- Task 30: Category Manager - Independent category storage and management UI
- Task 31: Reset App - Add functionality to reset/clear application data
- Task 32: Dark Mode - Implement dark mode theme support
- Task 33: Sound Effects - Add sound effects for correct answers and skips
- Task 34: Audience View Theming - Theme audience view to match "The Floor" TV show aesthetic
- Task 36: Grid View Floor - Implement grid view with territory consolidation (Dream Feature)

Good luck! 🎮
