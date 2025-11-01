# Task 01: Project Initialization

## Objective
Bootstrap a modern React + TypeScript project with Vite, including testing infrastructure and basic dependencies needed for "The Floor" application.

## Acceptance Criteria
- [ ] Vite project created with React + TypeScript template
- [ ] Vitest and React Testing Library installed and configured
- [ ] React Router DOM installed for routing
- [ ] Basic project runs on `npm run dev` without errors
- [ ] Tests can be run with `npm test`
- [ ] Package.json includes all necessary scripts (dev, build, test, preview)
- [ ] README.md with setup instructions and project overview
- [ ] Basic smoke test verifies React rendering works

## Dependencies to Install
- **Core**: React 18+, React DOM, TypeScript
- **Build**: Vite
- **Testing**: Vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom
- **Routing**: React Router DOM v6+
- **Utils**: (to be added in later tasks as needed)

## Implementation Guidance
1. Use `npm create vite@latest` with the `react-ts` template as the foundation
2. Configure Vitest to work seamlessly with React components:
   - Set up jsdom as the test environment
   - Configure test globals for describe, it, expect
   - Set up @testing-library/jest-dom for enhanced assertions
3. Create a basic smoke test in `src/App.test.tsx` that verifies the App component renders
4. Ensure TypeScript is configured with strict mode enabled
5. Document all available npm scripts and setup steps in README.md

## Success Criteria
- Running `npm install` completes without errors
- Running `npm run dev` starts the dev server (typically on localhost:5173)
- Running `npm test` executes the test suite and shows passing tests
- No TypeScript compilation errors
- No console errors or warnings when viewing the app in browser
- README clearly explains how to set up and run the project

## Out of Scope
- ESLint/Prettier configuration (task-02)
- Application-specific folder structure (task-03)
- Any business logic or UI components
- Deployment configuration

## Notes
- This task focuses purely on getting a clean, working foundation
- Keep the initial setup minimal - additional dependencies will be added as needed in later tasks
- Use the latest stable versions of all dependencies
