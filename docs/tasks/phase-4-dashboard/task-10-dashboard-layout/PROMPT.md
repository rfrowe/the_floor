# Task 10: Dashboard Layout

## Objective
Create the main game master dashboard page that displays all contestants and provides controls for managing the game.

## Acceptance Criteria
- [ ] Dashboard page displays all contestants in a grid or list
- [ ] Header with game title and controls
- [ ] Area for game configuration (time settings)
- [ ] Section for duel setup controls
- [ ] Responsive layout works on different screen sizes
- [ ] Clean, scannable interface for game master
- [ ] Navigation link to open audience view in new window
- [ ] TypeScript types for dashboard state
- [ ] Page renders from localStorage data

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
1. Create `src/pages/Dashboard.tsx`
2. Use Container component from task-07
3. Header section:
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
6. Load contestant data from localStorage using hooks from task-05
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
- This is the main control center for the game master
- Prioritize usability - the GM needs to work quickly during live gameplay
- Keep the interface uncluttered
- Consider the flow: import → configure → select → start duel
- Reference SPEC.md section 3.2 for requirements
