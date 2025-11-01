---
description: Review pending changes against a task's requirements
tags: [project, gitignored]
---

You are performing a code review of pending changes in this repository.

## Task Context
The changes were made to implement the requirements from: {{arg1}}

## Review Process

1. **Read the Task Requirements:**
   - Read the PROMPT.md file at: {{arg1}}
   - Understand the Objective, Acceptance Criteria, Implementation Guidance, Success Criteria, and Out of Scope sections

2. **Analyze Pending Changes:**
   - Run `git status` to see what files changed
   - Run `git diff` to see the actual changes
   - Run `git diff --cached` to see staged changes if any

3. **Review Against Task Requirements:**
   Evaluate the changes across these dimensions:

   **Completeness:**
   - Are all acceptance criteria met?
   - Are success criteria achievable with these changes?
   - Is anything in the "Out of Scope" section incorrectly included?

   **Code Quality:**
   - TypeScript strict mode compliance (null checks, type safety)
   - Proper use of path aliases (@/, @components/, etc.)
   - Following React 19+ patterns and hooks best practices
   - Appropriate error handling
   - Clean, readable code structure

   **Testing:**
   - Are tests included for new functionality?
   - Do tests cover edge cases and error scenarios?
   - Test file naming and organization correct?

   **Standards Compliance:**
   - Follows project code standards from CLAUDE.md
   - Proper import organization
   - Consistent naming conventions
   - Appropriate use of TypeScript types (no any, proper narrowing)

   **Build Requirements:**
   - Will `npm run build` pass?
   - Will `npm test` pass?
   - Will `npm run lint` pass?
   - Any potential runtime issues?

4. **Generate Review Report:**
   Create a comprehensive review report in markdown format with:

   - **Summary:** Overall assessment (Ready to Commit / Needs Changes / Major Issues)
   - **Strengths:** What was done well
   - **Issues Found:** Organized by severity (Critical, Major, Minor)
   - **Acceptance Criteria Status:** Checklist of each criterion with pass/fail
   - **Recommendations:** Specific, actionable improvements
   - **Next Steps:** What should be done before committing

5. **Save the Review:**
   - Write the review to `.reviews/task-review-YYYY-MM-DD-HHMMSS.md` (use current timestamp)
   - Print the file path so the user knows where to find it
   - Display a brief summary of findings

## Output Format

Your review should be thorough but constructive. Focus on:
- Specific file paths and line numbers when identifying issues
- Clear explanations of why something is a problem
- Concrete suggestions for improvement
- Positive feedback for good practices

Be objective and helpful - the goal is to ensure high-quality, requirement-compliant code.
