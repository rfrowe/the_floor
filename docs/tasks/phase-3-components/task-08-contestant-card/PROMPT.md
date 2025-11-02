# Task 08: Contestant Card Component

## Objective
Create a reusable component to display contestant information on the dashboard, including their name, categories, win count, and elimination status.

## Acceptance Criteria
- [ ] ContestantCard component displays all relevant contestant info
- [ ] Visual indication when contestant is eliminated (greyed out/faded)
- [ ] Shows current owned category
- [ ] Win count displayed prominently
- [ ] Selectable state for duel setup (visual feedback when selected)
- [ ] Hover states for better UX
- [ ] Responsive design (works on different screen sizes)
- [ ] TypeScript props interface defined
- [ ] Component tests verify different states render correctly

## Component Props
```typescript
interface ContestantCardProps {
  contestant: Contestant;
  isSelected?: boolean;
  isEliminated?: boolean; // or derive from contestant.eliminated
  onSelect?: (contestant: Contestant) => void;
  onClick?: (contestant: Contestant) => void;
  className?: string;
}
```

## Visual Requirements
Based on SPEC.md section 3.2:
- **Name**: Displayed prominently at top
- **Category**: Display current owned category name
- **Win count**: Show as a number or badge
- **Eliminated state**: Grey out or reduce opacity
- **Selected state**: Highlight border or background color
- **Interactive**: Clear hover/click states

## Implementation Guidance
1. Create `src/components/contestant/ContestantCard.tsx`
2. Use the Card component from task-07 as base
3. Layout considerations:
   - Name at top (larger font)
   - Category below name (smaller text)
   - Win count in corner or as badge
   - Eliminated state affects entire card styling
5. Make the card interactive:
   - Cursor pointer on hover if clickable
   - Visual feedback on click
   - Different styling when selected
6. Add accessibility:
   - Proper ARIA labels
   - Keyboard focus states
   - Screen reader friendly text
7. Write tests for different states:
   - Active contestant
   - Eliminated contestant
   - Selected vs unselected states

## Success Criteria
- Card clearly displays all contestant information
- Eliminated contestants are visually distinct
- Selected state is obvious
- Component handles edge cases (0 wins, etc.)
- Interactive states feel responsive
- Accessible to keyboard and screen reader users
- Tests cover main rendering scenarios

## Out of Scope
- Editing contestant information inline (separate component/modal)
- Detailed statistics or history
- Drag-and-drop functionality
- Animation effects (keep it simple)

## Notes
- This component will be used heavily in the dashboard
- Make it scannable - users should quickly understand contestant status
- Consider how it looks in a grid or list layout
- Refer to SPEC.md section 3.2 for requirements
