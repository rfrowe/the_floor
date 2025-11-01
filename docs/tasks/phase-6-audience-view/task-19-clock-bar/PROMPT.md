# Task 19: Clock Bar Component

## Objective
Create the clock bar component that displays at the top of the audience view, showing both players' names, remaining time, and which player is currently active.

## Acceptance Criteria
- [ ] Displays both contestants' names
- [ ] Shows time remaining for each player
- [ ] Clear visual indicator of active player
- [ ] Responsive to screen width
- [ ] Updates in real-time (synced with master view)
- [ ] High contrast and readable from distance
- [ ] Handles long names gracefully
- [ ] Category name displayed (optional)
- [ ] Smooth animations for player switching

## Clock Bar Layout
```
┌──────────────────────────────────────────────────┐
│  Alice    28s    ◀ PLAYING ▶    30s    Bob      │
│  Category: State Capitals                        │
└──────────────────────────────────────────────────┘
```

Or simpler:
```
┌──────────────────────────────────────────────────┐
│  Alice (28s) ◀─────────▶ Bob (30s)              │
└──────────────────────────────────────────────────┘
```

## Implementation Guidance
1. Create `src/components/duel/ClockBar.tsx`:
   ```typescript
   interface ClockBarProps {
     contestant1: Contestant;
     contestant2: Contestant;
     timeRemaining1: number;
     timeRemaining2: number;
     activePlayer: 1 | 2;
     categoryName: string;
   }
   ```
2. Layout structure:
   - Fixed height bar (80-100px)
   - Three columns: Player 1 | Center | Player 2
   - Or Two columns: Player 1 | Player 2 (active indicator between)
3. Player display:
   - Name in large, bold font
   - Time in very large font (easy to read)
   - Format time consistently (e.g., "28s" or "0:28")
4. Active player indicator:
   - Arrows pointing to active player: "◀ ACTIVE" or "ACTIVE ▶"
   - Highlight active player section (brighter, colored background)
   - Pulsing or animated indicator
   - Or: dim inactive player's section
5. Category display:
   - Smaller text below main bar or in center
   - Optional but helpful for context
6. Color coding:
   - Active player: bright/highlighted
   - Inactive player: dimmed
   - Low time warning (< 10s): red color
   - Very low time (< 5s): pulsing red
7. Responsive design:
   - Scale text size based on viewport width
   - Use `vw` units or media queries
   - Test at 1280px, 1920px, and 4K resolutions
8. Handle long names:
   - Truncate with ellipsis if too long
   - Or use smaller font size dynamically
   - Test with names like "Christopher Alexander Maximilian"
9. Animations:
   - Smooth transition when active player switches
   - Fade or slide indicator
   - Use CSS transitions for performance

## Visual Styling
- **Background**: Dark solid color (contrast with slides)
- **Text**: White or high-contrast color
- **Active indicator**: Bright color (yellow, cyan, or brand color)
- **Low time**: Red with possible pulse/blink
- **Font**: Large, bold, sans-serif (Arial, Helvetica, Roboto)

## Success Criteria
- Clock bar is readable from 10+ feet away
- Active player is immediately obvious
- Time updates smoothly without flicker
- Low time warning is attention-grabbing
- Names fit in allotted space (or truncate cleanly)
- Works across different screen sizes
- Professional, clean appearance
- Animations enhance rather than distract

## Out of Scope
- Player avatars or photos
- Detailed statistics or history
- Interactive elements (audience view is read-only)
- Sound effects or audio cues

## Notes
- This component is critical for audience understanding of game state
- Prioritize clarity and readability over aesthetics
- Test with actual content on projected display
- Consider color blindness (don't rely solely on color)
- Coordinate with task-16 (timer) for time display format
- Reference SPEC.md section 3.4 for requirements
