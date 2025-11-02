# Task 10: Dashboard Layout Polish

## Objective
Polish the Dashboard page with responsive layout improvements, proper use of common components, and refined contestant selection UX.

## Status
**PARTIALLY COMPLETE**: Dashboard exists with core functionality including:
- ✅ Basic layout with header and contestant grid
- ✅ ContestantCard components with selection
- ✅ DuelSetup component integration
- ✅ Import and delete functionality
- ✅ IndexedDB integration via useContestants hook
- ⚠️ Needs: Responsive layout refinement, keyboard shortcuts, improved UX polish

## Acceptance Criteria
- [ ] Responsive grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- [ ] Common components used throughout (Container, Button, Card)
- [ ] Keyboard shortcuts: Space to start duel, Escape to clear selection
- [ ] Empty state displays prominently when no contestants
- [ ] Smooth visual feedback for all interactions
- [ ] All tests passing with new features

## Dependencies
- Task 08: ContestantCard component (✅ complete)
- Task 07: Common components - Container, Button, Card (✅ complete)
- Task 13: DuelSetup component (✅ complete - see note below)

## Implementation Guidance

1. **Responsive Grid (Primary Focus)**:
   - Update CSS Grid in `Dashboard.module.css`:
     ```css
     .contestants-grid {
       display: grid;
       grid-template-columns: repeat(4, 1fr);
       gap: 1.5rem;
     }

     @media (max-width: 1024px) {
       .contestants-grid {
         grid-template-columns: repeat(2, 1fr);
       }
     }

     @media (max-width: 640px) {
       .contestants-grid {
         grid-template-columns: 1fr;
       }
     }
     ```

2. **Keyboard Shortcuts**:
   - Add `useEffect` with keyboard event listener:
     - Space: Start duel if 2 contestants + category selected
     - Escape: Clear selection
   - Ensure shortcuts don't interfere with text inputs

3. **UX Polish**:
   - Smooth transitions when selecting contestants
   - Clear visual hierarchy in empty state
   - Consistent spacing throughout

4. **Testing**:
   - Test responsive breakpoints in browser
   - Verify keyboard shortcuts work
   - Ensure existing functionality unchanged

## Success Criteria
- Grid layout responds smoothly to screen size changes
- Keyboard shortcuts feel natural and don't cause conflicts
- Empty state is clear and actionable
- No regressions in existing features
- All tests passing

## Out of Scope
- Random contestant selection (save for task 11)
- Game configuration modal (not needed - using defaults)
- Contestant editing
- Statistics/analytics
- Reordering contestants

## Notes
- **This is a polish task** - core functionality already exists
- Focus on responsive design and keyboard UX
- Don't refactor working code unnecessarily
- The Dashboard is in good shape - just needs finishing touches
- DuelSetup component exists and works (Task 13 renamed/merged)
- Reference SPEC.md section 3.2 for game master workflow
