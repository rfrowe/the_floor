# Task 13: Game Configuration UI

## Objective
Create a configuration interface for game settings, primarily the time limit per player for duels.

## Acceptance Criteria
- [ ] Configuration modal/panel accessible from dashboard
- [ ] Input field for time per player (in seconds)
- [ ] Default value of 30 seconds
- [ ] Validation for reasonable time limits (e.g., 10-300 seconds)
- [ ] Save button persists config to localStorage
- [ ] Cancel button discards changes
- [ ] Current config displayed in dashboard header
- [ ] Changes take effect for next duel (not current)
- [ ] Tests verify config save/load

## Configuration Options
From SPEC.md section 3.2 and 4.6:
- **Time per player**: Default 30 seconds, configurable per game

Future options (out of scope for now, but keep extensible):
- Skip penalty time (currently hardcoded to 3 seconds)
- Auto-advance slides
- Sound effects

## Implementation Guidance
1. Create `src/components/game/GameConfig.tsx` component
2. Use Modal component from task-07
3. Form fields:
   - Time per player (number input)
   - Label: "Time per player (seconds)"
   - Min: 10, Max: 300, Default: 30
   - Step: 5 (for easier adjustment)
4. Load current config from localStorage using `useGameConfig()` hook
5. Form handling:
   - Local state for form values
   - Validate on change
   - Show error messages for invalid input
   - Enable Save button only when valid
6. Save logic:
   - Update GameConfig in localStorage
   - Close modal
   - Show success feedback (toast or message)
7. Display current config in dashboard:
   - Small text in header: "Timer: 30s"
   - Or icon with tooltip
8. Add "Reset to defaults" button
9. Write tests:
   - Can open and close config modal
   - Can change and save settings
   - Validation prevents invalid values
   - Saved config persists across page refresh

## UI Mockup
```
┌──────────────────────────────────────┐
│  Game Configuration           [X]    │
├──────────────────────────────────────┤
│                                      │
│  Time per player (seconds):          │
│  [ 30 ] ←→  (slider or number)      │
│                                      │
│  □ Play sound effects (future)       │
│  □ Auto-advance on timeout (future)  │
│                                      │
│  [Reset to Defaults]                 │
│                                      │
│  [Cancel]  [Save]                    │
└──────────────────────────────────────┘
```

## Success Criteria
- Configuration modal is easy to access and use
- Settings persist across sessions
- Validation prevents unreasonable values
- Changes take effect for future duels
- Current settings are visible to game master
- Tests ensure save/load works correctly

## Out of Scope
- Per-duel configuration (set at game level, not duel level)
- Advanced settings (themes, sounds, etc.)
- Configuration import/export
- Multiple game profiles

## Notes
- Keep the UI simple - focus on the essential setting (time)
- Make it easy to reset to defaults
- Consider UX: slider vs number input vs preset buttons (30s, 45s, 60s)
- Reference SPEC.md sections 3.2 and 4.6 for requirements
- Coordinate with task-05 for localStorage integration
