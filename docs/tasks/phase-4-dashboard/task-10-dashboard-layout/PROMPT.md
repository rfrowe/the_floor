# Task 10: Dashboard Layout (Refactor)

## Objective
Refactor the existing Dashboard page to use common components, add contestant management features, and create an intuitive layout prioritizing game master workflow.

## Acceptance Criteria
- [ ] Dashboard uses common components (Container, Button, Card) instead of inline styles
- [ ] Contestant grid displays all contestants using ContestantCard component
- [ ] Delete button for each contestant (with confirmation)
- [ ] Header with game title and controls
- [ ] Area for game configuration (time settings)
- [ ] Section for duel setup controls
- [ ] Responsive layout works on different screen sizes
- [ ] Clean, scannable interface for game master
- [ ] Navigation link to open audience view in new window
- [ ] Empty state guides user to import data
- [ ] Page uses IndexedDB via useContestants() hook

## Layout Structure
```
┌─────────────────────────────────────────┐
│  Header: "The Floor" + Config Button    │
├─────────────────────────────────────────┤
│  Duel Setup Panel                       │
│  [Selected Players] [Category] [Start]  │
├─────────────────────────────────────────┤
│  Contestants Grid                       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │ C1 │ │ C2 │ │ C3 │ │ C4 │          │
│  └────┘ └────┘ └────┘ └────┘          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │ C5 │ │ C6 │ │ C7 │ │ C8 │          │
│  └────┘ └────┘ └────┘ └────┘          │
└─────────────────────────────────────────┘
```

## Implementation Guidance
1. **Refactor existing** `src/pages/Dashboard.tsx` (already exists with basic import functionality)
2. Replace inline styles with common components (Container, Button, Card)
3. Use IndexedDB integration via `useContestants()` hook (already in place)
4. Header section:
   - Application title
   - Button to open audience view in new window
   - Button to access game configuration
   - Import PPTX button (from task-06)
4. Duel setup panel (implementation details in task-12):
   - Shows selected contestants
   - Category selection dropdown
   - Random select button
   - Start duel button
5. Contestants grid:
   - Use ContestantCard from task-08
   - Grid layout (CSS Grid or Flexbox)
   - Responsive: 4 columns on desktop, 2 on tablet, 1 on mobile
   - Sort contestants (active first, then eliminated)
6. Keep existing IndexedDB integration using `useContestants()` hook
7. Add delete functionality:
   - Delete button on each ContestantCard
   - Confirmation dialog before deleting
   - Use `remove()` method from useContestants hook
7. Handle empty state (no contestants yet):
   - Show message prompting to import PPTX files
   - Display import button prominently
8. Add keyboard shortcuts for common actions (optional but nice):
   - Space bar to start duel
   - Escape to clear selection

## Success Criteria
- Dashboard displays all contestants clearly
- Layout is clean and easy to navigate
- Responsive design works on different screen sizes
- Can open audience view in separate window
- Empty state guides user to import data
- All interactive elements are accessible
- Page loads data from localStorage successfully

## Out of Scope
- Actual duel setup logic (task-12)
- Game configuration modal (task-13)
- PPTX import UI (task-06)
- Detailed contestant editing
- Statistics or analytics

## Notes
- Dashboard.tsx already exists with basic functionality - this is a **refactoring task**
- Current implementation uses IndexedDB (not localStorage) - keep this
- Prioritize usability over matching the exact mockup layout
- Focus on game master workflow: import → manage contestants → configure → select → start duel
- Add contestant management (delete) as this is essential for GM control
- Reference SPEC.md section 3.2 for requirements
