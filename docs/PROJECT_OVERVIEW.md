# The Floor - Project Overview

## What We've Built

A complete planning and specification package for building "The Floor" game show web application. This includes a formal technical specification and a detailed breakdown of 27 implementation tasks across 8 phases.

## Project Structure

```
/private/tmp/the_floor/
├── PROMPT.md              # Original requirements
├── SPEC.md                # Formal technical specification
├── PROJECT_OVERVIEW.md    # This file
└── tasks/                 # Organized implementation tasks
    ├── README.md          # Guide to using the tasks
    ├── phase-1-setup/     # 3 tasks: Foundation
    ├── phase-2-data-layer/# 3 tasks: Data & storage
    ├── phase-3-components/# 3 tasks: UI components
    ├── phase-4-dashboard/ # 4 tasks: Game master UI
    ├── phase-5-master-view/# 3 tasks: Duel control
    ├── phase-6-audience-view/# 4 tasks: Display view
    ├── phase-7-state-management/# 3 tasks: State & sync
    └── phase-8-testing/   # 4 tasks: Tests & polish
```

## Key Technical Decisions

Based on your input, we made these architectural choices:
- **Slide Format**: PPTX import from Google Slides
- **Time Configuration**: Configurable per game (default 30 seconds)
- **View Architecture**: Separate windows for master control + audience display
- **Storage**: localStorage only (browser-based, no backend)
- **Stack**: React 18+, TypeScript, Vite, Vitest, React Testing Library, Playwright

## What's in SPEC.md

The technical specification includes:
1. **Application Overview** - High-level description
2. **Technical Stack** - All technologies and tools
3. **Core Features** - Detailed feature descriptions for:
   - Data import system (PPTX parsing)
   - Game master dashboard
   - Master control view (duel interface for GM)
   - Audience display view (projection/display)
   - Game state management
4. **Data Models** - TypeScript interfaces for all entities
5. **User Flows** - Step-by-step workflows
6. **Non-Functional Requirements** - Performance, accessibility, browser compatibility, code quality
7. **Assumptions & Constraints** - What's in and out of scope

## Implementation Tasks (27 Total)

### Phase 1: Project Setup (3 tasks)
Get a working React + TypeScript + Vite project with testing and linting.

### Phase 2: Data Layer (3 tasks)
Define data models, implement localStorage abstraction, and create PPTX import functionality.

### Phase 3: Core Components (3 tasks)
Build reusable UI components: layout components, contestant cards, and slide viewer.

### Phase 4: Game Master Dashboard (4 tasks)
Create the main control interface where GM manages contestants, selects players, and starts duels.

### Phase 5: Master Control View (3 tasks)
Build the duel control interface with Correct/Skip buttons and timer management.

### Phase 6: Audience Display View (4 tasks)
Create the full-screen display showing slides, clock bar, and skip animations.

### Phase 7: State Management (3 tasks)
Implement React Context for global state, duel reducer, and cross-window synchronization.

### Phase 8: Testing & Polish (4 tasks)
Add comprehensive tests (unit, component, E2E) and final polish.

## Key Features Implemented

### Duel Mechanics
- Two players compete on one category's slides
- 30-second timer per player (configurable)
- Correct button: advances slide, switches control
- Skip button: shows answer for 3 seconds, deducts time, switches control
- Duel ends when time expires
- Winner inherits loser's unplayed category

### Multi-Window Support
- Master view: GM control interface (shows answers, has control buttons)
- Audience view: Full-screen display (shows slides, timers, but not answers)
- Real-time synchronization via localStorage events or BroadcastChannel API

### Game Management
- Import contestants from PPTX files
- Random contestant selection
- Configurable game settings
- Persistent state across page refreshes
- Track wins and eliminations

## Next Steps

1. **Review SPEC.md** - Ensure it matches your vision
2. **Start with Phase 1** - Bootstrap the project
3. **Work through phases sequentially** - Each builds on previous
4. **Use PROMPT.md files as guides** - They're detailed but flexible
5. **Test as you go** - Don't wait until Phase 8

## Development Approach

Each task's PROMPT.md follows this structure:
- **Objective**: What to accomplish
- **Acceptance Criteria**: Definition of done
- **Implementation Guidance**: How to approach it
- **Success Criteria**: How to verify it works
- **Out of Scope**: What NOT to do
- **Notes**: Tips and coordination points

The prompts are designed following Claude 4 best practices:
- Explicit instructions and clear context
- Focus on outcomes, not prescriptive code
- Consider edge cases and error handling
- Emphasize testing and quality
- Coordinate between related tasks

## Technology Highlights

- **React 18+** with hooks and functional components
- **TypeScript** for type safety throughout
- **Vite** for fast development and builds
- **Vitest** for unit and component tests (better React 19 support than Jest)
- **React Testing Library** for user-centric component tests
- **Playwright** for E2E tests with multi-window support
- **ESLint + Prettier** for code quality

## Time Estimates

Rough estimates for an experienced developer:
- Phase 1: 2-4 hours
- Phase 2: 8-12 hours (PPTX parsing is complex)
- Phase 3: 6-8 hours
- Phase 4: 8-10 hours
- Phase 5: 6-8 hours
- Phase 6: 8-10 hours
- Phase 7: 6-8 hours
- Phase 8: 10-15 hours

**Total: 54-75 hours** (approximately 1.5-2 weeks full-time)

## Questions or Issues?

Refer to:
- **SPEC.md** for technical details
- **tasks/README.md** for workflow guidance
- **Individual PROMPT.md files** for task-specific details

## What's Not Included

These are explicitly out of scope (future enhancements):
- Backend/database
- Authentication/multi-user
- Real-time multiplayer over network
- Mobile responsive design
- Territory grid visualization
- Audio/video recording
- Statistics and analytics

## Ready to Build!

You now have:
- ✅ Comprehensive technical specification
- ✅ 27 detailed implementation task prompts
- ✅ Clear project structure and workflow
- ✅ Best practices and quality standards
- ✅ Testing strategy at all levels

Time to start coding! Begin with task-01-project-init and work through the phases. Good luck! 🎮
