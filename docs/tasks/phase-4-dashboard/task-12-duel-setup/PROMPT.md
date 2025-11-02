# Task 12: Duel Setup Interface

## Objective
Create the interface and logic for setting up a duel between two selected contestants, including category selection and starting the duel.

## Acceptance Criteria
- [ ] Duel setup panel shows selected contestants
- [ ] Dropdown to choose which category to use for the duel (2 options: one from each contestant)
- [ ] Start Duel button (disabled until valid setup)
- [ ] Validation: requires 2 contestants and 1 category selected
- [ ] Starting duel initializes duel state and navigates to master view
- [ ] Category dropdown clearly shows which contestant owns which category
- [ ] Clear visual indication that winner gets the UNPLAYED category
- [ ] Tests verify setup logic

## Important: Single Category Model
- **Each contestant owns exactly ONE category**
- The GM selects which of the TWO categories to use for the duel
- **Winner inherits the UNPLAYED category** (the one NOT used in the duel)
- Example: Alice has "Math", Bob has "History" → GM picks "Math" → Winner gets "History"
- This is already reflected in the `DuelResult.inheritedCategory` type

## Duel Setup Panel UI
```
┌───────────────────────────────────────┐
│  Duel Setup                           │
├───────────────────────────────────────┤
│  Contestant 1: [Name]                 │
│  Contestant 2: [Name]                 │
│                                       │
│  Duel Category: [Dropdown ▼]         │
│    - Category A (from Contestant 1)   │
│    - Category B (from Contestant 2)   │
│                                       │
│  ℹ️ Winner receives the UNPLAYED      │
│     category from the loser           │
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
   - **Each contestant has exactly ONE category** (Contestant.category, not categories[])
   - Display dropdown with TWO options showing owner:
     - "State Capitals (from Alice)"
     - "80s Movies (from Bob)"
   - Store selected category in local state
   - Show info text: "Winner receives the unplayed category"
4. Validation:
   - Disable "Start Duel" button if:
     - Less than 2 contestants selected
     - No category selected
   - Show helpful error messages
   - Note: Every contestant has exactly 1 category, so no need to check for 0 categories
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
   - Only 1 contestant selected: disable start button
   - Both contestants have same category name: distinguish by owner in dropdown
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
- **Critical**: The selected category is for THE DUEL. The winner gets the OTHER category (unplayed)
- This logic is handled later in duel resolution, not in setup
- The DuelResult type already has `inheritedCategory` field for tracking this
- Reference SPEC.md sections 3.2, 5.2, and 4.5 for requirements
- Coordinate with task-21 (game context) for state management
