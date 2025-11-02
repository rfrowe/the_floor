# Task 17: Audience View Polish

## Objective
Polish the existing Audience View with improved styling, smooth transitions, and waiting state refinements.

## Status
**MOSTLY COMPLETE**: AudienceView.tsx exists with core functionality including:
- ✅ Full-screen layout
- ✅ ClockBar integration
- ✅ SlideViewer with censorship boxes
- ✅ Duel state loading from localStorage
- ✅ Basic waiting state
- ⚠️ Needs: Styling polish, smooth transitions, improved waiting screen

## Acceptance Criteria
- [ ] Full-screen layout fills viewport (100vw × 100vh)
- [ ] No scrollbars or overflow visible
- [ ] Smooth fade transitions between slides (200-300ms)
- [ ] Waiting screen is visually appealing
- [ ] Clock bar is readable from distance
- [ ] Works at 1280×720 and higher resolutions
- [ ] Clean, professional appearance

## Dependencies
- Task 09: SlideViewer component (✅ complete)
- Task 19: ClockBar component (✅ complete - see phase reorganization)

## Implementation Guidance

1. **Full-Screen Layout** (verify existing):
   ```css
   .audience-view {
     width: 100vw;
     height: 100vh;
     display: flex;
     flex-direction: column;
     overflow: hidden;
     background: #000;
   }

   .clock-bar-container {
     height: 100px;
     flex-shrink: 0;
   }

   .slide-container {
     flex: 1;
     display: flex;
     align-items: center;
     justify-content: center;
   }
   ```

2. **Slide Transitions**:
   - Add CSS transitions for slide changes
   - Fade out old slide, fade in new slide
   - Duration: 200-300ms
   - Use opacity transitions for smoothness

3. **Waiting Screen Enhancement**:
   - Large "The Floor" title
   - Subtitle: "Waiting for next duel..."
   - Optional: animated background or subtle motion
   - High contrast for visibility

4. **Typography & Readability**:
   - Use large, bold fonts
   - High contrast (white text on dark background)
   - Test readability from 10+ feet away

5. **Performance**:
   - Ensure 60fps rendering
   - Use CSS transforms for animations (GPU accelerated)
   - Avoid layout thrashing

6. **Testing**:
   - Test at different resolutions (1280×720, 1920×1080, 4K)
   - Verify no scrollbars appear
   - Check slide transitions are smooth
   - Confirm waiting state looks professional

## Success Criteria
- Layout perfectly fills screen without overflow
- Transitions are smooth and professional
- Waiting screen is polished and branded
- Readable from typical projection distance
- Works across different screen sizes
- No performance issues or jank

## Out of Scope
- Skip animation (Task 20 - needs ClockBar implementation)
- Cross-window synchronization improvements (Phase 7)
- Fullscreen API integration
- Custom fonts or branding assets

## Notes
- **This is a polish task** - core functionality exists
- Focus on visual refinement and transitions
- Test on actual projector if possible
- The audience view should look professional and ready for live use
- Current implementation uses localStorage polling - works but could be improved in Phase 7
- Reference SPEC.md section 3.4 for audience view requirements
