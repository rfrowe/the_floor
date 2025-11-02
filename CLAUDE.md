# The Floor - Development Guide

## Project Overview
"The Floor" is a React + TypeScript game show application built with Vite. Implementation follows a structured task-based approach across 8 phases (27 total tasks).

## Core Commands
- `npm run dev` - Start dev server (localhost:5173)
- `npm run build` - TypeScript check + production build (MUST pass before commits)
- `npm test` - Run Vitest test suite
- `npm test -- --run` - Single test run (use before commits)
- `npm run lint` - Run ESLint

## Task-Driven Development
**IMPORTANT:** All work follows task definitions in `docs/tasks/`.

- Read `docs/tasks/[phase]/[task-name]/PROMPT.md` for requirements
- Each PROMPT.md contains: Objective, Acceptance Criteria, Implementation Guidance, Success Criteria, Out of Scope
- Stay within defined scope - honor "Out of Scope" sections
- Complete phases sequentially: Phase 1 → 2 → 3 → 4-6 (parallel) → 7 → 8
- Use TodoWrite tool for multi-step tasks to track progress

## TypeScript & Testing Standards
**CRITICAL:** Maximum type safety is enforced across the entire codebase.

**TypeScript Configuration:**
- **Strict mode enabled** with all strict flags (must remain enabled)
- **Strict null checks** - explicitly handle null/undefined
- **noUncheckedIndexedAccess** - array/object access returns T | undefined
- **exactOptionalPropertyTypes** - optional properties distinguish undefined vs missing
- **noImplicitReturns** - all code paths must return
- **noPropertyAccessFromIndexSignature** - use bracket notation for dynamic keys
- All code MUST compile without TypeScript errors or warnings

**Type Safety Best Practices:**
- Handle null/undefined explicitly - use optional chaining (?.) and nullish coalescing (??)
- Array access must check for undefined: `const item = array[0]; if (item) { ... }`
- Avoid type assertions (as) - use type guards instead
- Prefer type narrowing with conditionals over type casting
- Use discriminated unions for variant types
- Never use `any` - use `unknown` and narrow the type

**Testing:**
- Tests MUST pass before marking tasks complete
- Write tests alongside implementation, not after
- Use Vitest + React Testing Library for component tests

## Commit Requirements
**YOU MUST verify these before every commit:**
1. `npm run build` - passes without errors
2. `npm test -- --run` - all tests pass
3. `npm run lint` - no errors
4. `git status` and `git diff` - review changes

**Commit format:**
```
type: brief summary

Multi-line description of what and why.
Include specific details about implementation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`

## Code Standards
- Use React 19+ functional components with hooks
- Prefer ES modules syntax
- Keep components focused and single-purpose
- Reference code with file paths and line numbers (e.g., `App.tsx:42`)
- Use `@ts-expect-error` only when necessary with explanation comment

**Import Path Aliases:**
Use path aliases for clean imports (configured in tsconfig.app.json and vite.config.ts):
- `@/` - src root (e.g., `import { foo } from '@/utils/foo'`)
- `@components/` - src/components
- `@hooks/` - src/hooks
- `@utils/` - src/utils
- `@types/` - src/types
- `@models/` - src/models
- `@services/` - src/services
- `@contexts/` - src/contexts
- `@pages/` - src/pages
- `@assets/` - src/assets

## Project Structure
```
the-floor/
├── docs/tasks/          # Task definitions (source of truth)
├── src/                 # All application code
│   ├── *.test.tsx      # Tests alongside components
│   └── setupTests.ts   # Test configuration
├── vite.config.ts      # Build + test config
└── package.json        # Scripts and dependencies
```

## Task Completion Checklist
A task is complete when:
- [ ] All acceptance criteria met
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes successfully
- [ ] `npm test` all tests passing
- [ ] `npm run lint` no errors
- [ ] No console errors in browser
- [ ] Changes committed with descriptive message
- [ ] Code pushed to remote

## Development Workflow

### Standard Workflow
1. Reference task PROMPT.md for requirements
2. Use TodoWrite to plan and track progress
3. Implement with tests
4. Verify all checks pass (build, test, lint)
5. Commit and push
6. Move to next task

### Worktree Workflow (Recommended for Tasks)

Use git worktrees to isolate task work and enable parallel development:

**1. Create Worktree:**
```bash
git worktree add /path/to/project-task-XX-name -b task-XX-name
```
Pattern: `/path/to/project-task-[number]-[kebab-case-name]`

**2. Work in Worktree:**
```bash
cd /path/to/project-task-XX-name
npm install  # Install dependencies if needed
npm run dev  # Start dev server (will use different port if 5173 is taken)
# Implement task...
```

**3. Verify Before Commit:**
```bash
npm run build  # Must pass
npm test -- --run  # Must pass
npm run lint  # Must pass
```

**4. Commit and Push:**
```bash
git add .
git commit -m "feat: implement task description"
git push -u origin task-XX-name
```

**5. Create Pull Request:**
```bash
gh pr create --title "feat: task description" --base main --body "..."
```

**6. Clean Up After Merge:**
```bash
cd /path/to/main-project
git worktree remove /path/to/project-task-XX-name
git branch -d task-XX-name  # Delete local branch after merge
```

**Benefits:**
- Isolates task work from main branch
- Allows switching between tasks without stashing
- Each worktree has its own node_modules and build artifacts
- Clean separation for code review

## CSS Modules with TypeScript Strict Mode

When using CSS Modules with `noUncheckedIndexedAccess`, class names return `string | undefined`. Best practices:

**Pattern:**
```typescript
// Extract variables to satisfy template literal restrictions
const buttonClass = styles['button'] ?? '';
const variantClass = styles[variant] ?? '';
return <button className={`${buttonClass} ${variantClass}`.trim()} />;
```

**Why:** Direct inline access (`${styles['button']}`) in template literals fails with "Invalid type string | undefined" errors.

**Alternative (for simple cases):**
```typescript
// When only accessing literal keys
className={styles['container']}  // TypeScript allows this
```

## Accessibility for Interactive Overlays

Modal overlays and clickable non-button elements need keyboard support to satisfy ESLint's `jsx-a11y` rules:

**Pattern:**
```typescript
<div
  onClick={handleOverlayClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClose();
    }
  }}
  role="button"
  tabIndex={-1}
  aria-label="Modal backdrop"
>
```

**Why:** ESLint requires `click-events-have-key-events` and proper roles for interactive non-button elements.

**Alternative:** Use actual `<button>` elements when possible to avoid these requirements.

## Testing Portal Components

React Testing Library's `cleanup()` in `afterEach` handles React portals automatically:

**Pattern:**
```typescript
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup(); // Handles portals automatically
});
```

**Avoid:** Manual DOM manipulation (`document.body.innerHTML = ''`) can interfere with React's portal cleanup.

## Critical Reminders
- **DO NOT** jump ahead to future phases during infrastructure tasks
- **DO NOT** commit failing tests or TypeScript errors
- **DO** update README.md when adding features or scripts
- **DO** ask clarifying questions if task requirements are unclear
