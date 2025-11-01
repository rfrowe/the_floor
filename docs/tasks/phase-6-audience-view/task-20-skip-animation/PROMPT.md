# Task 20: Skip Animation

## Objective
Implement the 3-second answer display animation that appears in the center of the clock bar when a player skips, as specified in SPEC.md section 3.4.

## Acceptance Criteria
- [ ] Answer displays in center of clock bar for exactly 3 seconds
- [ ] Triggers when master view clicks "Skip" button
- [ ] Answer is clearly visible and readable
- [ ] Animation is synchronized with master view
- [ ] Counts 3 seconds against skipping player's time
- [ ] Automatically dismisses after 3 seconds
- [ ] Next slide appears after animation completes
- [ ] Smooth fade in/out transitions
- [ ] Tests verify timing accuracy

## Animation Behavior
From SPEC.md section 3.4:
1. Master clicks "Skip" button
2. Answer appears on audience view in center of clock bar
3. Displayed for 3 seconds (counted against current player)
4. Answer fades out
5. Next slide appears
6. Control transfers to other player

## Implementation Guidance
1. Update `ClockBar` component to support skip animation:
   ```typescript
   interface ClockBarProps {
     // ... existing props
     isSkipAnimationActive: boolean;
     skipAnswer?: string;
   }
   ```
2. Answer display overlay:
   - Position: center of clock bar
   - Large, bold text for readability
   - High contrast background (e.g., semi-transparent dark overlay)
   - Bright text color (white or yellow)
3. Animation sequence:
   - Fade in (200ms)
   - Display for 3 seconds
   - Fade out (200ms)
   - Total: ~3.4 seconds (but time deduction is exactly 3s)
4. Synchronization:
   - Audience view listens to `isSkipAnimationActive` flag in duel state
   - When true: display answer overlay
   - When false: hide overlay
   - Master view controls this flag (task-15)
5. Styling:
   ```css
   .skip-answer-overlay {
     position: absolute;
     top: 50%;
     left: 50%;
     transform: translate(-50%, -50%);
     background: rgba(0, 0, 0, 0.9);
     padding: 20px 40px;
     border-radius: 8px;
     font-size: 48px;
     font-weight: bold;
     color: #ffff00; /* bright yellow */
     animation: fadeInOut 3.4s;
   }
   ```
6. Handle edge cases:
   - Very long answers: truncate or wrap
   - Multiple rapid skips: queue or ignore
   - Answer missing: show "Skipped" instead
7. Add countdown indicator (optional):
   - Small 3...2...1 countdown
   - Progress bar under answer
8. Write tests:
   - Answer displays for correct duration
   - Syncs with master view skip action
   - Fades in/out smoothly
   - Doesn't interfere with other UI elements

## Visual Example
```
┌──────────────────────────────────────────────────┐
│  Alice (25s) ◀                     ▶ Bob (30s)   │
│                                                   │
│          ┌─────────────────────────┐             │
│          │  The Eiffel Tower       │             │
│          └─────────────────────────┘             │
└──────────────────────────────────────────────────┘
```

## Success Criteria
- Answer is clearly readable on projected display
- Timing is accurate (3.0 seconds ±100ms)
- Animation doesn't obscure important information
- Synchronization with master view is reliable
- Professional, polished appearance
- No performance issues or jank
- Works across different screen sizes

## Out of Scope
- Sound effects
- Fancy animations (keep it simple)
- Answer validation or scoring
- Replay or pause functionality

## Notes
- This is a key gameplay moment - make it clear and impactful
- 3 seconds feels fast when testing, but appropriate during gameplay
- Ensure answer text is large enough to read from distance
- Coordinate with task-15 (skip button logic) for state management
- Coordinate with task-23 (cross-window sync) for real-time updates
- Reference SPEC.md sections 3.3 and 3.4 for requirements
