# Phase 11: Philips Hue Integration

## Overview
Integrate Philips Hue smart lighting to create "The Randomizer" effect - a studio-quality lighting animation that plays during random contestant selection, mimicking the TV show experience.

## Background

The user has already implemented a Python proof-of-concept at:
- GitHub: https://github.com/rfrowe/hue_randomizer
- Local: /tmp/hue_randomizer

This phase involves:
1. Porting the Python implementation to TypeScript
2. Creating a configuration interface for Hue bridge setup
3. Implementing secure credential storage
4. Adding Hue bridge discovery
5. Creating the randomizer lighting effect
6. Integrating with the Dashboard random selection feature

## Scope

### In Scope
- Philips Hue API integration (v2 API)
- Bridge discovery on local network
- API key generation flow (button press on bridge)
- Configuration UI for bridge URL and API key
- Secure local storage of credentials
- Room/zone selection for effect
- Randomizer lighting effect (ported from Python)
- Toggle to enable/disable Hue integration
- Error handling and fallback

### Out of Scope
- Other smart home platforms (LIFX, Nanoleaf, etc.)
- Complex lighting scenes beyond randomizer
- Cloud-based Hue integration
- Multi-bridge support
- Lighting effects for other game events (future phase)

## Technical Requirements

### Prerequisites
1. Access to Philips Hue Bridge (v2+) on local network
2. Hue bridge must be accessible via HTTP API
3. User must have physical access to bridge (for API key generation)

### Dependencies
- Task 11: Contestant List (random selection trigger)
- Potential: Credential storage system (may need to build)

## Proposed Task Breakdown

### Task 48: Hue Configuration System
**Objective**: Create UI and storage for Hue bridge configuration

- Settings page/modal for Hue integration
- Bridge URL input (with discovery helper)
- API key management
- Room/zone selector
- Enable/disable toggle
- Test connection button
- Secure storage (localStorage with encryption or clear-text with warning)

### Task 49: Hue Bridge Discovery
**Objective**: Automatically discover Hue bridges on local network

- Use Hue discovery service: https://discovery.meethue.com/
- Fallback: manual IP entry
- Display discovered bridges
- Connection test
- Handle multiple bridges

### Task 50: Hue API Client
**Objective**: TypeScript client for Philips Hue v2 API

- API key generation flow (requires physical button press)
- Get lights, rooms, zones
- Set light state (color, brightness, transition)
- Group operations
- Error handling
- Rate limiting

### Task 51: Randomizer Lighting Effect
**Objective**: Port Python randomizer effect to TypeScript

- Analyze existing Python implementation
- Port algorithm to TypeScript
- Configurable effect parameters (speed, colors, duration)
- Smooth transitions
- Cancellation support

### Task 52: Integration with Random Selection
**Objective**: Trigger lighting effect when random select button clicked

- Hook into random selection flow
- Trigger effect at start of selection
- Synchronize effect duration with selection animation
- Handle errors gracefully (don't block selection)
- Optional: sync with on-screen randomizer animation

## Technical Considerations

### Security
- API keys stored locally (warn users about security)
- Consider encryption or prompt for key each session
- No cloud transmission of credentials
- HTTPS for bridge communication (if supported)

### Network
- Local network access required
- CORS may be issue (bridge doesn't send CORS headers)
- May need to proxy requests through local server
- Handle network failures gracefully

### Performance
- Lighting effects run asynchronously
- Don't block UI during Hue operations
- Rate limit API requests
- Handle bridge unresponsive state

### User Experience
- Clear setup wizard
- Test mode for previewing effects
- Graceful degradation if Hue unavailable
- Settings persistence
- Error messages user-friendly

## Alternative Approaches

### Approach 1: Direct Browser-to-Bridge (Recommended)
- Browser makes HTTP requests directly to bridge
- Requires handling CORS issues
- Fast, no intermediate server

### Approach 2: Proxy Server
- Run local Node.js server as proxy
- Server communicates with bridge
- Browser communicates with server via WebSocket
- More complex setup

### Approach 3: Electron Wrapper
- Package app as Electron
- Node.js backend handles Hue communication
- No CORS issues
- Requires different distribution model

**Recommendation**: Start with Approach 1, document CORS workarounds

## Research/Prototyping Tasks

Before implementing, research:
1. Hue v2 API changes since Python implementation
2. CORS handling strategies
3. API key generation UX flow
4. Best TypeScript HTTP client for Hue (axios, fetch)
5. Encryption options for credentials

## Success Criteria

- [ ] Hue bridge discovered automatically or manually configured
- [ ] API key generated through guided flow
- [ ] Rooms/zones selectable
- [ ] Randomizer effect triggers on random selection
- [ ] Effect visually matches TV show aesthetic
- [ ] Graceful fallback if Hue unavailable
- [ ] Settings persist across sessions
- [ ] All tests passing
- [ ] Documentation for setup process

## Timeline Estimate

- Task 48 (Config): 1-2 days
- Task 49 (Discovery): 1 day
- Task 50 (API Client): 2-3 days
- Task 51 (Effect): 2-3 days
- Task 52 (Integration): 1 day

**Total**: 7-11 days (depends on CORS complexity)

## Resources

- [Philips Hue API v2 Documentation](https://developers.meethue.com/develop/hue-api-v2/)
- [Hue Bridge Discovery](https://discovery.meethue.com/)
- [Existing Python Implementation](https://github.com/rfrowe/hue_randomizer)
- [Hue API Rate Limits](https://developers.meethue.com/develop/application-design-guidance/hue-system-performance/)

## Notes

- This is a "wow factor" feature that significantly enhances the experience
- Python implementation exists, so porting should be straightforward
- CORS is the main technical risk
- Consider making this an optional MCP tool in the future
- Could expand to other lighting effects (winning, losing, timer warnings)

## Future Enhancements (Out of Scope for Phase 11)

- Lighting effects for correct answers
- Lighting effects for time warnings
- Lighting effects for winning
- Custom effect builder
- Multi-bridge support
- Cloud integration
- Mobile app for effect control
