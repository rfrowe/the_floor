# Task 13: Game Configuration (DEPRECATED)

## Status
**NOT NEEDED**: This task is deprecated. Game configuration UI is not required for MVP.

## Reason for Deprecation
- `DEFAULT_GAME_CONFIG` provides sensible defaults (30 seconds per player)
- Configuration complexity adds minimal value for initial release
- Dashboard uses `useGameConfig()` hook which already exists (Task 05)
- If configuration is needed later, it can be added as a simple settings page

## What Exists
- ✅ `GameConfig` type defined in `@types/game`
- ✅ `DEFAULT_GAME_CONFIG` constant (30s per player, 3s skip penalty)
- ✅ `useGameConfig()` hook in `src/hooks/useGameConfig.ts`
- ✅ localStorage persistence for config

## If Configuration UI is Needed Later
Consider these options:
1. **Simple approach**: Add a text input in Dashboard header for time setting
2. **Settings page**: Create `/settings` route with full configuration
3. **Modal approach**: Add settings button that opens Modal with config form

For now, skip this task and use defaults.

## Alternative Task: DuelSetup Component
**Note**: The DuelSetup component functionality described in the original Task 12 has been implemented and works well. See `src/components/duel/DuelSetup.tsx`.

## Next Steps
- Skip this task entirely
- Move to Phase 5 tasks (Master View)
- Come back to config UI only if user feedback demands it
