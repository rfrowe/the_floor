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
2. **Reuse existing components**: Use Modal component from task-07 (already built)
3. **Reuse existing hooks**: Use `useGameConfig()` hook from task-05 (already built)
4. Form fields:
   - Time per player (number input)
   - Label: "Time per player (seconds)"
   - Min: 10, Max: 300, Default: 30
   - Step: 5 (for easier adjustment)
5. Save logic:
   - Update GameConfig in localStorage
   - Close modal
   - Show success feedback (toast or message)
6. Add "Reset to defaults" button (use DEFAULT_GAME_CONFIG from @types)
7. Write tests:
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
- Make it easy to reset to defaults (use DEFAULT_GAME_CONFIG constant)
- Consider UX: number input works well for this use case
- Skip penalty is currently fixed at 3 seconds (display as readonly, don't make configurable yet)
- **Reuse existing infrastructure**: Modal component and useGameConfig hook are already built
- The GameConfig type and DEFAULT_GAME_CONFIG are defined in @types/game
- Reference SPEC.md sections 3.2 and 4.6 for requirements
