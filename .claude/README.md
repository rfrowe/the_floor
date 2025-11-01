# Claude Commands

This directory contains custom slash commands for Claude Code.

## Available Commands

### `/review-task <task-path>`

Reviews pending git changes against a task's requirements.

**Usage:**
```
/review-task docs/tasks/phase-1/task-05-storage-layer/PROMPT.md
```

**What it does:**
1. Reads the task requirements from the specified PROMPT.md file
2. Analyzes all pending git changes (staged and unstaged)
3. Reviews changes against acceptance criteria and project standards
4. Generates a detailed review report in `.reviews/` directory
5. Provides actionable feedback and recommendations

**Review Criteria:**
- Completeness: All acceptance criteria met
- Code Quality: TypeScript strict mode, React best practices, error handling
- Testing: Adequate test coverage and quality
- Standards: Compliance with CLAUDE.md guidelines
- Build Requirements: Will build, test, and lint pass?

**Output:**
Review reports are saved to `.reviews/task-review-YYYY-MM-DD-HHMMSS.md` (gitignored)

**When to use:**
- Before committing changes for a task
- To verify all task requirements are met
- To get objective feedback on code quality
- To catch issues before running build/test cycles
