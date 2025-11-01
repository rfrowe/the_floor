# Task 17: Audience View Layout

## Objective
Create the full-screen audience display view that shows slides, player information, and timers for projection or display to the audience/players.

## Acceptance Criteria
- [ ] Full-screen layout optimized for display/projection
- [ ] Clock bar at top with player names, times, and active indicator
- [ ] Large slide display area with proper aspect ratio
- [ ] Loads duel state from localStorage
- [ ] Updates in real-time as master view makes changes
- [ ] Clean, distraction-free interface
- [ ] Works at minimum 1280x720 resolution
- [ ] Handles no active duel gracefully
- [ ] Smooth transitions between slides

## Layout Structure
```
┌─────────────────────────────────────────┐
│ Alice  28s  ◀▶  30s  Bob   [Category]  │  ← Clock bar
├─────────────────────────────────────────┤
│                                         │
│                                         │
│           Current Slide                 │
│          (full screen)                  │
│         with censor boxes               │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

## Implementation Guidance
1. Create `src/pages/AudienceView.tsx`
2. Load duel state from localStorage/context:
   - Use `useDuelState()` hook
   - Poll or listen for changes from master view
   - If no duel: show waiting screen or "The Floor" title card
3. Full-screen layout:
   - Use viewport units (100vw, 100vh)
   - No scrolling, no overflow
   - Background color: solid dark (black or dark gray)
4. Clock bar section (details in task-19):
   - Fixed height (e.g., 80-100px)
   - Contains player info and timers
   - Stays visible at all times
5. Slide display area:
   - Fills remaining vertical space
   - Use SlideViewer component from task-09
   - Set `fullscreen={true}` prop
   - Centered horizontally and vertically
6. Handle state updates:
   - Listen to localStorage changes OR
   - Poll duel state every 200ms OR
   - Use BroadcastChannel (task-23)
   - Re-render when duel state changes
7. No active duel state:
   - Show branded waiting screen
   - "Waiting for next duel..." message
   - Optional: Show game logo or sponsor graphics
8. Add keyboard shortcut to exit fullscreen (Escape key)
9. Remove any UI chrome (hide cursor after inactivity - optional)

## Success Criteria
- Layout fills entire screen properly
- Slide is visible and clear at all distances
- Clock bar is readable from across room
- Updates reflect master view changes within < 500ms
- No distracting elements or scrollbars
- Works at 1280x720 and higher resolutions
- Gracefully handles missing duel state
- Smooth, professional appearance

## Out of Scope
- Clock bar implementation (task-19)
- Skip animation (task-20)
- Slide transitions/animations (keep simple)
- Fullscreen API (can add later)
- Multi-screen support

## Notes
- This view is for audience/players to see - must be clear and professional
- Optimize for readability at distance (large text, high contrast)
- Minimize distractions - keep it clean
- Test on actual projector or large screen if possible
- Coordinate with task-23 for cross-window synchronization
- Reference SPEC.md section 3.4 for requirements
