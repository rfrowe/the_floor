# Task 03: Project Structure & Routing

## Objective
Establish a clean folder structure for the application and set up React Router for navigation between the dashboard, master view, and audience view.

## Acceptance Criteria
- [ ] Organized folder structure under `src/` for components, hooks, types, utils, contexts, etc.
- [ ] React Router configured with routes for dashboard, master view, and audience view
- [ ] Basic placeholder pages created for each route
- [ ] Navigation works correctly between routes
- [ ] 404/Not Found route handled gracefully
- [ ] Folder structure documented in README or a STRUCTURE.md file

## Recommended Folder Structure
```
src/
├── components/         # Reusable UI components
│   ├── common/        # Generic components (buttons, cards, etc.)
│   ├── contestant/    # Contestant-related components
│   ├── duel/          # Duel-related components
│   └── slide/         # Slide display components
├── pages/             # Page-level components (route targets)
│   ├── Dashboard.tsx
│   ├── MasterView.tsx
│   ├── AudienceView.tsx
│   └── NotFound.tsx
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
├── types/             # TypeScript interfaces and types
├── utils/             # Utility functions
├── storage/           # localStorage abstraction
├── App.tsx            # Root component with router
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Implementation Guidance
1. Create the folder structure with placeholder README.md files in each directory explaining its purpose
2. Set up React Router in App.tsx with the following routes:
   - `/` - Dashboard (game master control center)
   - `/master` - Master View (duel control interface)
   - `/audience` - Audience View (display for projector/screen)
   - `*` - 404 Not Found page
3. Create simple placeholder pages for each route:
   - Each page should have a clear heading and description
   - Add basic navigation links for testing
4. Ensure the router is working correctly by navigating between routes
5. Document the folder structure and explain the purpose of each directory

## Success Criteria
- All routes are accessible and render their placeholder pages
- Folder structure is logical and follows React best practices
- Navigation between routes works smoothly
- File organization makes it easy to find and add new code
- Documentation clearly explains where different types of code should live

## Out of Scope
- Actual implementation of page functionality (handled in later tasks)
- Complex nested routing
- Route guards or authentication
- Global state management (task-21)

## Notes
- Keep the structure flat enough to be navigable but organized enough to scale
- Use index.ts files for clean imports where appropriate
- Follow the principle: "Make it easy to find things and easy to add things"
- This structure should support the data models defined in SPEC.md section 4
