# The Floor - Implementation Tasks

This directory contains a structured breakdown of all implementation tasks for "The Floor" game show web application.

## Task Organization

Tasks are organized into 8 phases, with 27 total tasks:

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

Consider creating a checklist or project board to track:
- [ ] Phase 1 (3/3 tasks complete)
- [ ] Phase 2 (0/3 tasks complete)
- [ ] Phase 3 (0/3 tasks complete)
- [ ] Phase 4 (0/4 tasks complete)
- [ ] Phase 5 (0/3 tasks complete)
- [ ] Phase 6 (0/4 tasks complete)
- [ ] Phase 7 (0/3 tasks complete)
- [ ] Phase 8 (0/4 tasks complete)

Good luck! 🎮
