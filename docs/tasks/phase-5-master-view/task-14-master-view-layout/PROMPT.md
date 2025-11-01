# Task 14: Master View Layout

## Objective
Create the master control view page where the game master controls the duel, sees answers, and manages game flow.

## Acceptance Criteria
- [ ] Master view page displays current duel state
- [ ] Shows current slide with correct answer visible
- [ ] Timer display for both players
- [ ] Active player indicator
- [ ] Control buttons (Correct, Skip) prominently placed
- [ ] Current slide number / total slides
- [ ] Exit/end duel button
- [ ] Loads duel state from localStorage
- [ ] Handles case where no active duel exists
- [ ] Responsive layout for game master's screen

## Layout Structure
```
┌─────────────────────────────────────────┐
│  [Exit Duel]              Slide 3 / 15   │
├─────────────────────────────────────────┤
│                                         │
│  Player 1: Alice          Player 2: Bob  │
│  Time: 28s  ◀ ACTIVE      Time: 30s     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         Current Slide Preview           │
│         (small version)                 │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ANSWER: The Eiffel Tower               │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [✓ Correct]          [⊗ Skip]         │
│                                         │
└─────────────────────────────────────────┘
```

## Implementation Guidance
1. Create `src/pages/MasterView.tsx`
2. Load duel state from localStorage/context:
   - Use `useDuelState()` hook
   - If no duel exists, show message and link back to dashboard
3. Header section:
   - Exit/End Duel button (returns to dashboard)
   - Current slide indicator: "Slide X / Total"
   - Category name
4. Player status section:
   - Both contestants' names
   - Time remaining for each (format: MM:SS or SS)
   - Visual indicator of active player (arrow, highlight, color)
5. Slide preview:
   - Small version of current slide
   - Use SlideViewer component from task-09
   - Optional - GM might not need to see it
6. Answer display:
   - Large, clear text showing correct answer
   - High contrast for quick reading
   - Consider font size for readability across room
7. Control buttons section:
   - Large, easily clickable buttons
   - Distinct colors (green for correct, yellow/orange for skip)
   - Keyboard shortcuts (Space for correct, S for skip)
8. Handle no active duel:
   - Check if duel state exists
   - If not, show message: "No active duel. Return to dashboard."
   - Provide link/button to dashboard
9. Add confirmation modal for ending duel early

## Success Criteria
- Master view displays all necessary information
- Buttons are large and easy to click during live gameplay
- Active player is immediately obvious
- Answer is clearly readable
- No active duel case is handled gracefully
- Layout works on typical laptop/desktop screens
- Page updates in real-time as timer counts down

## Out of Scope
- Actual timer logic (task-16)
- Button click handlers (task-15)
- Audience view synchronization (task-23)
- Slide navigation (prev/next)

## Notes
- This view is for the game master's eyes only
- Prioritize clarity and speed - GM needs to react quickly during gameplay
- Large, obvious buttons reduce errors during fast-paced duels
- Consider accessibility for keyboard-only operation
- Reference SPEC.md section 3.3 for requirements
