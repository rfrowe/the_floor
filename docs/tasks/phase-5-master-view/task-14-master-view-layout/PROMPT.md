# Task 14: Master View Layout

## Objective
Build the Master View page where the game master controls the duel, sees answers, and manages game flow.

## Status
**MINIMAL STUB EXISTS**: Basic MasterView.tsx file exists but needs full implementation.

## Acceptance Criteria
- [ ] Master view displays current duel state from localStorage
- [ ] Shows current slide with correct answer visible
- [ ] Player names and time remaining for both players
- [ ] Active player indicator is prominent
- [ ] Large "Correct" and "Skip" control buttons
- [ ] Current slide number / total slides display
- [ ] Exit/end duel button
- [ ] Handles "no active duel" case gracefully
- [ ] Responsive layout for laptop/desktop screens

## Dependencies
- Task 09: SlideViewer component (✅ complete)
- Task 05: useDuelState hook (✅ complete)
- Task 15: useGameTimer hook (⚠️ pending - can mock initially)
- Task 16: Duel control logic (⚠️ pending - buttons can be placeholders)

## Implementation Guidance

1. **Load Duel State**:
   ```typescript
   import { useDuelState } from '@hooks/useDuelState';

   function MasterView() {
     const [duelState] = useDuelState();

     if (!duelState) {
       return <NoActiveDuelMessage />;
     }

     // ... render master view
   }
   ```

2. **Layout Structure**:
   ```
   ┌─────────────────────────────────────────┐
   │ [Exit Duel]              Slide 3 / 15   │
   │ Category: State Capitals                │
   ├─────────────────────────────────────────┤
   │ Alice: 28s [ACTIVE]  |  Bob: 30s        │
   ├─────────────────────────────────────────┤
   │                                         │
   │        Slide Preview (optional)         │
   │                                         │
   ├─────────────────────────────────────────┤
   │ ANSWER: The Eiffel Tower                │
   ├─────────────────────────────────────────┤
   │   [✓ Correct]      [⊗ Skip]            │
   └─────────────────────────────────────────┘
   ```

3. **Header Section**:
   - Exit button (returns to dashboard)
   - Slide progress: "Slide X / Total"
   - Category name display

4. **Player Status Section**:
   - Display both contestants' names
   - Show time remaining (use placeholder initially)
   - Clear indicator of active player (highlight, arrow, etc.)

5. **Answer Display**:
   - Large, high-contrast text
   - Format: "ANSWER: [answer text]"
   - Easily readable from across room

6. **Control Buttons**:
   - Large, prominent buttons
   - "Correct" button (green/success color)
   - "Skip" button (yellow/warning color)
   - Initially can be placeholders (onClick={} empty)
   - Add keyboard shortcuts: Space for Correct, S for Skip

7. **Optional Slide Preview**:
   - Small SlideViewer instance
   - Shows current slide to GM
   - Can be omitted if space is limited

8. **No Active Duel State**:
   - Show message: "No active duel. Return to dashboard to start one."
   - Button to navigate back to dashboard

9. **Testing**:
   - Renders with valid duel state
   - Shows "no duel" message when appropriate
   - Displays contestant names and category correctly
   - Answer display is readable

## Success Criteria
- Master view displays all necessary information clearly
- Active player is immediately obvious
- Answer is highly readable
- Buttons are large and easy to click
- Layout works on typical laptop screens (1280px+)
- No active duel case handled gracefully
- Navigation works correctly

## Out of Scope
- Actual timer countdown (Task 15)
- Button functionality (Task 16)
- Audience view synchronization (Phase 7)
- Slide navigation (prev/next buttons)
- End duel logic and winner determination

## Notes
- **Focus on layout and data display** - control logic comes later
- Buttons can be placeholders initially
- Timer can show static values from duelState for now
- This is the game master's control panel - prioritize clarity
- Large text and buttons reduce errors during live gameplay
- Reference SPEC.md section 3.3 for requirements
