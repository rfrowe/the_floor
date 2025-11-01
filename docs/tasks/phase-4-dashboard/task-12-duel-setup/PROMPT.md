# Task 12: Duel Setup Interface

## Objective
Create the interface and logic for setting up a duel between two selected contestants, including category selection and starting the duel.

## Acceptance Criteria
- [ ] Duel setup panel shows selected contestants
- [ ] Dropdown to choose which category to use for the duel
- [ ] Start Duel button (disabled until valid setup)
- [ ] Validation: requires 2 contestants and 1 category
- [ ] Starting duel initializes duel state and navigates to master view
- [ ] Category dropdown shows all categories from both contestants
- [ ] Clear indication of which contestant owns which category
- [ ] Handles edge cases (contestant with 0 categories)
- [ ] Tests verify setup logic

## Duel Setup Panel UI
```
┌───────────────────────────────────────┐
│  Duel Setup                           │
├───────────────────────────────────────┤
│  Contestant 1: [Name]                 │
│  Contestant 2: [Name]                 │
│                                       │
│  Category: [Dropdown ▼]              │
│    - Category A (from Contestant 1)   │
│    - Category B (from Contestant 2)   │
│    - Category C (from Contestant 1)   │
│                                       │
│  [Clear] [Start Duel]                 │
└───────────────────────────────────────┘
```

## Implementation Guidance
1. Create `src/components/duel/DuelSetup.tsx` component
2. Props:
   ```typescript
   interface DuelSetupProps {
     contestant1: Contestant | null;
     contestant2: Contestant | null;
     onClear: () => void;
     onStartDuel: (duelConfig: DuelConfig) => void;
   }

   interface DuelConfig {
     contestant1: Contestant;
     contestant2: Contestant;
     selectedCategory: Category;
   }
   ```
3. Category selection:
   - Gather all categories from both contestants
   - Display in dropdown with labels showing owner:
     - "State Capitals (from Alice)"
     - "80s Movies (from Bob)"
   - Store selected category in local state
4. Validation:
   - Disable "Start Duel" button if:
     - Less than 2 contestants selected
     - No category selected
     - Any contestant has 0 categories
   - Show helpful error messages
5. Start Duel logic:
   - Create initial DuelState:
     - Set both contestants
     - Set selectedCategory
     - Initialize time remaining (from GameConfig)
     - Set activePlayer to 1 (challenger)
     - Set currentSlideIndex to 0
   - Save duel state to localStorage (via context/hook)
   - Navigate to `/master` route
6. Handle edge cases:
   - Contestant with multiple categories: show all in dropdown
   - Only 1 contestant selected: disable start button
   - No categories available: show error message
7. Write tests:
   - Can select category from dropdown
   - Start button disabled when invalid
   - Starting duel creates correct state
   - Navigation occurs after starting

## Success Criteria
- Cannot start duel with invalid setup
- Category selection is clear and easy to use
- Starting duel properly initializes state
- Navigation to master view works
- Error states are communicated clearly
- All edge cases are handled gracefully
- Tests verify critical paths

## Out of Scope
- Advanced duel settings (custom time per player)
- Preview of slides before starting
- Best-of-three format
- Save duel configurations

## Notes
- This is a critical step before gameplay begins
- Validation prevents invalid game states
- Make sure state is saved before navigation
- Reference SPEC.md sections 3.2, 5.2, and 4.5 for requirements
- Coordinate with task-21 (game context) for state management
