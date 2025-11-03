# Post-Demo Task Planning Summary

**Date**: November 2, 2025
**Context**: First live demo of The Floor
**Total New Tasks Created**: 25 tasks across 4 new phases

## Overview

This document summarizes the comprehensive task planning completed following the first live demo. All 14 issues discovered/conceived during the demo have been organized into structured task prompts across appropriate phases.

## What Was Created

### Phase 10: Post-Demo Bug Fixes (5 Tasks)
**Priority**: HIGH - Critical bugs affecting gameplay fairness

| Task | Title | Priority | Complexity |
|------|-------|----------|------------|
| 37 | Duel Timeout Answer Reveal | HIGH | Medium |
| 38 | Randomizer Smallest Territory | HIGH | Medium |
| 39 | Fix Territory Name Display | HIGH | Low |
| 40 | Instant Fail Late Pass | HIGH | Medium |
| 41 | Resurrection Category Logic | MEDIUM | Medium |

**Location**: `docs/tasks/phase-10-post-demo-fixes/`

**Key Characteristics**:
- Rules compliance issues
- Fairness and balance problems
- Visual bugs affecting usability
- Should be addressed before next game session

### Phase 9: Future Enhancements (6 New Tasks)
**Priority**: MEDIUM - UX improvements and new features

| Task | Title | Category | Priority |
|------|-------|----------|----------|
| 42 | Grid Color Improvements | UX | Medium |
| 43 | Slide Vertical Fill | UX | Medium |
| 44 | Winning Animation | UX | Low |
| 45 | Single-Combat Mode | Feature | Medium |
| 46 | Finale Best-of-Three | Feature | Medium |
| 47 | Taint Button | Feature | Medium |

**Location**: `docs/tasks/phase-9-future-enhancements/`

**Key Characteristics**:
- Enhances user experience
- Adds flexibility and features
- Not required for core gameplay
- Can be implemented in any order

### Phase 11: Philips Hue Integration (PROPOSED)
**Priority**: MEDIUM - Major integration project

**Scope**: 5 tasks (48-52)
- Task 48: Hue Configuration System
- Task 49: Hue Bridge Discovery
- Task 50: Hue API Client
- Task 51: Randomizer Lighting Effect
- Task 52: Integration with Random Selection

**Location**: `docs/tasks/phase-11-hue-integration/PHASE_PROPOSAL.md`

**Timeline**: 7-11 days total

**Key Features**:
- Automatic bridge discovery
- API key generation flow
- "The Randomizer" lighting effect
- Synchronized with on-screen selection

**Technical Challenges**:
- CORS handling
- Network reliability
- Credential security

### Phase 12: LLM Studio (PROPOSED)
**Priority**: LOW-MEDIUM - Major feature, potentially separate product

**Scope**: 8 tasks (53-60)
- Task 53: Studio UI Foundation
- Task 54: Credentials Management
- Task 55: LLM Integration (OpenAI GPT-4)
- Task 56: Image Search Integration (Unsplash/Pexels)
- Task 57: Slide Editing Interface
- Task 58: Export and Import
- Task 59: Cost Tracking and Limits
- Task 60: Prompt Templates

**Location**: `docs/tasks/phase-12-llm-studio/PHASE_PROPOSAL.md`

**Timeline**: 17-23 days (3-4 weeks)

**Key Features**:
- AI-powered category generation
- Automatic image search/selection
- Interactive editing interface
- Cost tracking and management
- Template library

**Technical Challenges**:
- API cost management
- LLM output quality
- Image search reliability
- Complex state management

### Phase 13: Process Improvements (1 Task)
**Priority**: MEDIUM - Meta-analysis for future improvement

| Task | Title | Type | Effort |
|------|-------|------|--------|
| 61 | Development Process Analysis | Analysis | 4-8 hours |

**Location**: `docs/tasks/phase-13-process-improvements/`

**Deliverables**:
- Comprehensive analysis document
- CLAUDE.md improvement proposals
- Task template enhancements
- Workflow recommendations

## Issue Mapping

### Original 14 Issues → Task Assignments

1. **Show correct answer for 3s when duel times out** → Task 37 (Phase 10)
2. **Randomizer should only pick people with one grid square** → Task 38 (Phase 10)
3. **Sometimes multi-square territories have multiple names** → Task 39 (Phase 10)
4. **Add a single-combat mode** → Task 45 (Phase 9)
5. **Instant fail if you pass with <3s** → Task 40 (Phase 10)
6. **Grid colors are bad** → Task 42 (Phase 9)
7. **Fix finale** → Task 46 (Phase 9)
8. **Add a taint option** → Task 47 (Phase 9)
9. **Slide images don't take up full vertical space** → Task 43 (Phase 9)
10. **Add Philips Hue support** → Phase 11 (Tasks 48-52)
11. **Add LLM based slide generation** → Phase 12 (Tasks 53-60)
12. **Process Improvements** → Task 61 (Phase 13)
13. **Winning animation** → Task 44 (Phase 9)
14. **Resurrected contestant's category** → Task 41 (Phase 10)

## Documentation Updates

### Updated Files
1. **`docs/tasks/README.md`**
   - Added Phase 10, 11, 12, 13 descriptions
   - Updated progress tracking
   - Listed all new tasks
   - Reflected MVP completion status

2. **`docs/tasks/phase-10-post-demo-fixes/README.md`** (NEW)
   - Phase overview
   - Task summaries
   - Implementation order recommendations
   - Testing requirements
   - Timeline estimates

3. **`docs/tasks/phase-9-future-enhancements/README.md`** (NEW)
   - Task categorization
   - Priority recommendations
   - Dependencies
   - Timeline estimates

4. **Phase 11 and 12 Proposals** (NEW)
   - Comprehensive phase breakdowns
   - Technical architecture
   - Task definitions
   - Risk analysis
   - Resource links

## Task Prompt Quality

All task prompts include:
- ✅ Clear objective
- ✅ Priority and status
- ✅ Background and context
- ✅ Comprehensive acceptance criteria
- ✅ Detailed implementation guidance with code examples
- ✅ Testing strategy (unit, integration, manual)
- ✅ Edge case analysis
- ✅ Success criteria
- ✅ Out of scope section
- ✅ UI/UX considerations
- ✅ Related tasks
- ✅ Notes and additional context

## Recommended Implementation Order

### Immediate (Next 1-2 weeks)
1. **Phase 10 Tasks** (all 5) - Fix critical bugs
   - Start with Task 37, 40 (most impactful)
   - Then Task 38 (rules compliance)
   - Finally Task 39, 41 (less critical)

### Short Term (Next month)
2. **Phase 9 Quick Wins** (Tasks 43, 44, 47)
   - Low effort, high impact
   - Can be done in parallel with Phase 10

### Medium Term (Next 2-3 months)
3. **Phase 9 Features** (Tasks 42, 45, 46)
   - More complex but valuable features
   - Prioritize based on user needs

### Long Term (Future planning)
4. **Phase 11: Hue Integration**
   - If user has Hue hardware
   - Significant wow factor

5. **Phase 12: LLM Studio**
   - Major feature, could be separate product
   - High development cost
   - High user value for content creators

6. **Phase 13: Process Analysis**
   - Do after Phase 10 complete
   - Informs future development

## Statistics

- **Total tasks created**: 25
- **Bug fixes**: 5 (Phase 10)
- **Enhancements**: 6 (Phase 9)
- **Major integrations**: 2 phases (11 & 12)
- **Process improvements**: 1 (Phase 13)
- **Total estimated effort**:
  - Phase 10: 7-11 days
  - Phase 9 (new tasks): 10-15 days
  - Phase 11: 7-11 days
  - Phase 12: 17-23 days
  - Phase 13: 0.5-1 day

## Files Created

```
docs/tasks/
├── README.md (updated)
├── phase-10-post-demo-fixes/
│   ├── README.md
│   ├── task-37-duel-timeout-answer-reveal/PROMPT.md
│   ├── task-38-randomizer-smallest-territory/PROMPT.md
│   ├── task-39-fix-territory-name-display/PROMPT.md
│   ├── task-40-instant-fail-late-pass/PROMPT.md
│   └── task-41-resurrection-category-logic/PROMPT.md
├── phase-9-future-enhancements/
│   ├── README.md (new)
│   ├── task-42-grid-color-improvements/PROMPT.md
│   ├── task-43-slide-vertical-fill/PROMPT.md
│   ├── task-44-winning-animation/PROMPT.md
│   ├── task-45-single-combat-mode/PROMPT.md
│   ├── task-46-finale-best-of-three/PROMPT.md
│   └── task-47-taint-button/PROMPT.md
├── phase-11-hue-integration/
│   └── PHASE_PROPOSAL.md
├── phase-12-llm-studio/
│   └── PHASE_PROPOSAL.md
└── phase-13-process-improvements/
    └── task-61-development-process-analysis/PROMPT.md
```

## Next Steps

1. **Review** all created task prompts for accuracy and completeness
2. **Prioritize** Phase 10 tasks for immediate implementation
3. **Plan** implementation schedule based on available time
4. **Consider** whether to implement tasks sequentially or in parallel
5. **Evaluate** interest in Phase 11 (Hue) and Phase 12 (Studio) for future planning
6. **Execute** Task 61 (Process Analysis) after Phase 10 to improve future development

## Notes

- All task prompts follow established template structure
- Priorities reflect both technical urgency and user impact
- Phase 11 and 12 are proposed phases requiring user validation
- Task numbers continue existing sequence (36 → 37, etc.)
- Comprehensive implementation guidance provided for all tasks
- Testing requirements specified for quality assurance

## Questions for Consideration

1. Should Phase 10 tasks be done in worktrees or directly on main?
2. Is Philips Hue integration (Phase 11) worth pursuing?
3. Should LLM Studio (Phase 12) be a separate repo/product?
4. What is the priority order for Phase 9 tasks?
5. When should Task 61 (Process Analysis) be executed?

---

**Summary**: All 14 post-demo issues have been comprehensively documented as structured, actionable task prompts across appropriate phases. The project now has a clear roadmap for bug fixes, enhancements, and major new features.
