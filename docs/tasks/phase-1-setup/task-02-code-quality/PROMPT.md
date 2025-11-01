# Task 02: Code Quality Tools

## Objective
Set up ESLint and Prettier with automatic formatting to enforce consistent code style and catch common errors throughout the project.

## Acceptance Criteria
- [ ] ESLint installed and configured for React + TypeScript
- [ ] Prettier installed and configured
- [ ] ESLint and Prettier work together without conflicts
- [ ] VSCode settings recommend extensions and auto-format on save
- [ ] Pre-commit hooks (optional but recommended) ensure code quality
- [ ] npm scripts available for linting and formatting
- [ ] All existing code passes linting and formatting checks
- [ ] Configuration files are properly documented

## Dependencies to Install
- **Linting**: eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin
- **React-specific**: eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y
- **Prettier**: prettier, eslint-config-prettier, eslint-plugin-prettier
- **Git hooks (optional)**: husky, lint-staged

## Implementation Guidance
1. Configure ESLint with TypeScript-aware rules:
   - Enable strict TypeScript checking
   - Enable React hooks rules to catch common mistakes
   - Enable accessibility checks (jsx-a11y)
   - Set up import/export rules for consistency
2. Configure Prettier with sensible defaults:
   - Single quotes or double quotes (pick one and be consistent)
   - Trailing commas, semicolons, etc.
   - Tab width and print width
3. Ensure ESLint and Prettier don't conflict by using eslint-config-prettier
4. Add npm scripts:
   - `npm run lint` - check for linting errors
   - `npm run lint:fix` - auto-fix linting errors
   - `npm run format` - format all files with Prettier
5. Create `.vscode/settings.json` and `.vscode/extensions.json` to recommend workspace settings
6. Optionally set up pre-commit hooks to automatically lint and format staged files

## Success Criteria
- Running `npm run lint` shows no errors on existing code
- Running `npm run format` properly formats all files
- Code is automatically formatted on save in VSCode (when recommended settings are applied)
- ESLint catches common React mistakes (missing deps in useEffect, etc.)
- All team members get consistent formatting regardless of their local setup

## Out of Scope
- Custom ESLint rules beyond standard recommended configs
- Complex git hook workflows
- CI/CD integration (can be added later)

## Notes
- Prioritize developer experience - the tools should help, not hinder
- Use widely-accepted defaults unless there's a strong reason to deviate
- Document any non-standard configuration choices in comments
