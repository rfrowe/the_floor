# Task 23: BroadcastChannel Synchronization (OPTIONAL ENHANCEMENT)

## Objective
Upgrade cross-window synchronization from localStorage events to BroadcastChannel API for faster, more reliable master-to-audience communication.

## Status
**OPTIONAL ENHANCEMENT**: localStorage events work but BroadcastChannel provides better performance.

## Current Implementation
- ✅ Audience view uses localStorage polling (works, ~300-500ms latency)
- ✅ Master view saves duel state to localStorage
- ✅ Changes propagate via storage events
- ⚠️ Slight lag is noticeable during skip animations

## Why Upgrade?

**Benefits of BroadcastChannel:**
- Faster synchronization (~50-100ms vs ~300ms)
- Direct messaging (no localStorage writes)
- Better control over what gets synced
- Lower latency for skip animations
- Cleaner separation of concerns

**Drawbacks:**
- Browser support (IE not supported, but who cares?)
- Additional code complexity
- localStorage still needed for persistence

## Implementation Guidance

1. **Create Sync Hook**:
   ```typescript
   // src/hooks/useBroadcastSync.ts
   import { useEffect, useRef } from 'react';

   interface BroadcastMessage {
     type: 'DUEL_UPDATE' | 'DUEL_START' | 'DUEL_END';
     payload: DuelState | null;
     timestamp: number;
   }

   export function useBroadcastSync(
     onMessage: (message: BroadcastMessage) => void
   ) {
     const channelRef = useRef<BroadcastChannel | null>(null);

     useEffect(() => {
       // Check browser support
       if (typeof BroadcastChannel === 'undefined') {
         console.warn('BroadcastChannel not supported, falling back to storage events');
         return;
       }

       // Create channel
       const channel = new BroadcastChannel('the-floor-duel');
       channelRef.current = channel;

       // Listen for messages
       channel.onmessage = (event) => {
         onMessage(event.data);
       };

       // Cleanup
       return () => {
         channel.close();
       };
     }, [onMessage]);

     // Function to send messages
     const broadcast = (message: BroadcastMessage) => {
       if (channelRef.current) {
         channelRef.current.postMessage(message);
       }
     };

     return { broadcast };
   }
   ```

2. **Master View Integration**:
   ```typescript
   function MasterView() {
     const [duelState, setDuelState] = useDuelState();
     const { broadcast } = useBroadcastSync(() => {
       // Master doesn't need to listen, only broadcast
     });

     const updateDuel = (updates: Partial<DuelState>) => {
       const newState = { ...duelState, ...updates };
       setDuelState(newState);

       // Broadcast to audience
       broadcast({
         type: 'DUEL_UPDATE',
         payload: newState,
         timestamp: Date.now(),
       });
     };

     // Use updateDuel instead of setDuelState for all updates
   }
   ```

3. **Audience View Integration**:
   ```typescript
   function AudienceView() {
     const [duelState, setDuelState] = useState<DuelState | null>(null);

     useBroadcastSync((message) => {
       if (message.type === 'DUEL_UPDATE') {
         setDuelState(message.payload);
       }
     });

     // Also keep localStorage fallback
     const [storedDuel] = useDuelState();
     useEffect(() => {
       if (!duelState && storedDuel) {
         setDuelState(storedDuel);
       }
     }, [storedDuel, duelState]);

     // ... rest of component
   }
   ```

4. **Fallback Strategy**:
   - Check for BroadcastChannel support
   - Fall back to storage events if unavailable
   - Both master and audience should handle fallback gracefully

5. **What to Broadcast**:
   - Slide changes (immediate)
   - Player switches (immediate)
   - Skip animation start/end (immediate)
   - Time updates (only occasionally, every 2-3 seconds for drift correction)

6. **Testing**:
   - Test with both windows open
   - Verify messages are received
   - Check fallback works without BroadcastChannel
   - Measure latency improvement

## Success Criteria
- Synchronization latency < 100ms
- Skip animations appear simultaneously
- Fallback to storage events works
- No race conditions or duplicate updates
- Performance remains smooth
- Browser compatibility maintained

## Out of Scope
- Multi-device synchronization (different computers)
- Bi-directional sync (audience → master)
- Message queuing or replay
- Conflict resolution

## When to Implement

**Implement this if:**
- ✅ Core gameplay is complete and tested
- ✅ localStorage sync latency is noticeable/problematic
- ✅ You want to improve the professional feel
- ✅ Time permits for polish

**Skip this if:**
- ❌ Still working on core features
- ❌ localStorage sync is acceptable
- ❌ Limited time before deadline
- ❌ Users aren't complaining about lag

## Recommendation

**For MVP: Consider skipping or doing later.**

LocalStorage events work adequately:
- 300ms lag is barely noticeable in most scenarios
- Skip animations still work (just slightly delayed)
- Adds complexity without critical benefit
- Can be added as post-MVP enhancement

Only implement if:
- You have extra time
- You want to learn BroadcastChannel API
- Professional polish is a priority

## Notes
- BroadcastChannel support: All modern browsers (Chrome 54+, Firefox 38+, Safari 15.4+)
- IE11 doesn't support it (but IE is dead anyway)
- localStorage should remain primary persistence mechanism
- BroadcastChannel is for real-time sync only, not persistence
- Reference SPEC.md section 5.3 for synchronization requirements
