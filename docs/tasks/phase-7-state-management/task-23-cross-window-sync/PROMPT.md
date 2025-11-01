# Task 23: Cross-Window State Synchronization

## Objective
Implement real-time synchronization of duel state between the master view and audience view windows using localStorage events or BroadcastChannel API.

## Acceptance Criteria
- [ ] Changes in master view appear in audience view within < 500ms
- [ ] Changes in duel state sync across windows
- [ ] Both windows stay in sync even with rapid changes
- [ ] Works when audience view opened before or after duel starts
- [ ] Handles window closing/reopening gracefully
- [ ] No duplicate event handling or infinite loops
- [ ] Performance remains smooth during sync
- [ ] Tests verify synchronization works correctly

## Synchronization Options

### Option 1: localStorage Events (Simpler)
- Listen to `storage` event in audience view
- Automatically triggered when localStorage changes in other tabs
- Works cross-browser, no additional setup
- Slight delay (typically 100-300ms)

### Option 2: BroadcastChannel API (Better)
- More direct, lower latency
- Better control over messages
- Modern browsers only (check compatibility)
- Explicitly broadcast state changes

## Implementation Guidance

### Using localStorage Events (Recommended Start)
1. In audience view, add storage event listener:
   ```typescript
   useEffect(() => {
     const handleStorageChange = (e: StorageEvent) => {
       if (e.key === 'the-floor:duel') {
         const newDuelState = JSON.parse(e.newValue || 'null');
         setDuelState(newDuelState);
       }
     };

     window.addEventListener('storage', handleStorageChange);
     return () => window.removeEventListener('storage', handleStorageChange);
   }, []);
   ```

2. In master view, save to localStorage triggers event automatically
   - No additional code needed
   - GameContext already saves to localStorage (task-21)

3. Handle race conditions:
   - Debounce updates if necessary
   - Use timestamps to determine which state is newer
   - Ignore stale updates

### Using BroadcastChannel API (Advanced)
1. Create broadcast channel utility:
   ```typescript
   const channel = new BroadcastChannel('the-floor-duel');

   // Master view: send updates
   channel.postMessage({ type: 'DUEL_UPDATE', duelState });

   // Audience view: receive updates
   channel.onmessage = (event) => {
     if (event.data.type === 'DUEL_UPDATE') {
       setDuelState(event.data.duelState);
     }
   };
   ```

2. Message types:
   - `DUEL_START`: New duel started
   - `DUEL_UPDATE`: Duel state changed
   - `DUEL_END`: Duel ended
   - `SLIDE_ADVANCE`: Slide changed (for immediate feedback)

3. Fallback to localStorage events if BroadcastChannel unavailable

## Synchronization Strategy
1. **Master view is source of truth**
   - All state changes originate in master view
   - Audience view is read-only, just listens
2. **Frequent updates**:
   - Time updates: every 100ms (or derive locally)
   - Slide changes: immediately
   - Player switches: immediately
   - Skip animations: immediately
3. **Optimization**:
   - Don't sync every time tick (derive in audience view)
   - Sync state structure, not every field
   - Use shallow comparison to avoid unnecessary renders

## Time Synchronization Strategy
Since time updates every 100ms, broadcasting every tick is wasteful:
- **Option A**: Broadcast time occasionally (every 2-3 seconds for drift correction)
- **Option B**: Audience view runs its own timer based on initial state
- **Option C**: Broadcast only when time matters (start/stop/switch)

Recommended: Option B with periodic sync to prevent drift

## Implementation Steps
1. Create `src/hooks/useCrossWindowSync.ts`
2. In GameContext:
   - Add broadcast function to send updates
   - Call broadcast when duel state changes
3. In AudienceView:
   - Use hook to listen for updates
   - Update local state when messages received
4. In MasterView:
   - Broadcast on every significant action
   - Don't broadcast on timer ticks (let audience derive)
5. Handle cleanup:
   - Remove listeners on unmount
   - Close broadcast channels properly
6. Write tests:
   - Mock localStorage/BroadcastChannel
   - Verify messages sent and received correctly
   - Check for race conditions and infinite loops

## Success Criteria
- Audience view updates within 500ms of master view changes
- No flickering or jank in audience view
- Works reliably across window opens/closes
- No infinite loops or duplicate handling
- Performance remains smooth
- Graceful degradation if sync fails
- Tests verify sync behavior

## Out of Scope
- Bi-directional sync (audience → master)
- Conflict resolution (not needed, master is authoritative)
- Multi-device sync (different computers)
- Offline support

## Notes
- Start with localStorage events - simpler and works everywhere
- Upgrade to BroadcastChannel if latency is an issue
- Test with actual two windows open side-by-side
- Consider debouncing if sync causes performance issues
- Coordinate with task-21 (game context) for state updates
- Reference SPEC.md section 5.3 for requirements
- BroadcastChannel support: https://caniuse.com/broadcastchannel
