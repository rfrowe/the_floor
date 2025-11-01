# Task 11: Contestant List & Selection

## Objective
Implement the interactive contestant list with selection functionality for setting up duels.

## Acceptance Criteria
- [ ] Contestants can be clicked to select them
- [ ] Visual feedback shows selected contestants
- [ ] Can select up to 2 contestants at a time
- [ ] Third click deselects first selected contestant (or prevents selection)
- [ ] Random select button chooses one non-eliminated contestant
- [ ] Clear selection button/functionality
- [ ] Selected contestants highlighted in duel setup panel
- [ ] Cannot select eliminated contestants
- [ ] State management for selections
- [ ] Tests verify selection logic

## Selection Behavior
- Click contestant card to select
- Can select 0, 1, or 2 contestants
- When selecting 3rd: either deselect first or show error
- Selected cards have distinct visual style
- Eliminated contestants are not selectable (greyed out, no hover)
- Clear visual indication of selection state

## Random Selection
From SPEC.md section 3.2:
- Button labeled "Random Select" or "Randomize"
- Selects one random contestant from non-eliminated pool
- If 2 contestants already selected, replace one of them (or clear and select new)
- Visual animation/highlight to show the randomly selected contestant
- Should feel exciting (brief delay/animation optional)

## Implementation Guidance
1. Add selection state management:
   - Create custom hook `useContestantSelection()`:
     ```typescript
     interface ContestantSelection {
       selected: [Contestant | null, Contestant | null];
       select: (contestant: Contestant) => void;
       deselect: (contestant: Contestant) => void;
       clear: () => void;
       randomSelect: () => void;
     }
     ```
2. Update Dashboard to use selection hook
3. Pass selection props to ContestantCard components:
   - `isSelected` prop based on selection state
   - `onClick` handler to toggle selection
4. Implement random selection:
   - Filter non-eliminated contestants
   - Use `Math.random()` to pick one
   - Add to selection (or replace if full)
5. Add Clear Selection button in duel setup panel
6. Prevent selecting eliminated contestants:
   - Disable click handler
   - Visual indication (cursor: not-allowed)
7. Display selected contestants in duel setup panel:
   - Show names/categories of selected contestants
   - Preview before starting duel
8. Write tests:
   - Can select and deselect contestants
   - Cannot exceed 2 selections
   - Cannot select eliminated contestants
   - Random select works correctly

## Success Criteria
- Selection interaction feels smooth and intuitive
- Visual feedback is clear
- Cannot enter invalid states (3 selected, eliminated selected)
- Random selection works and feels fair
- State is managed cleanly without bugs
- Tests verify all selection behaviors

## Out of Scope
- Drag-and-drop selection
- Multi-select with Shift/Ctrl keys
- Filtering or searching contestants
- Undo selection changes

## Notes
- Selection is the primary interaction on the dashboard
- Make it feel responsive and intuitive
- Consider edge cases: only 1 contestant left, all eliminated, etc.
- Random selection should be truly random (no bias)
- Reference SPEC.md section 3.2 and 5.2 for requirements
