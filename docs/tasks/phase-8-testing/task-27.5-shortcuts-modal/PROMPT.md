# Task 27.5: Keyboard Shortcuts Modal

## Objective
Create a comprehensive keyboard shortcuts help modal that can be opened with the "?" key, displaying all available shortcuts organized by context to improve discoverability and user experience.

## Status
Not started

## Acceptance Criteria
- [ ] Modal opens when user presses "?" (Shift + /)
- [ ] Modal displays all keyboard shortcuts organized by context/view
- [ ] Shortcuts are clearly labeled with their keys and descriptions
- [ ] Modal can be closed via Escape key, close button, or clicking backdrop
- [ ] Visual design is consistent with existing Modal component
- [ ] Keyboard focus management works correctly
- [ ] Modal is accessible (ARIA labels, keyboard navigation)
- [ ] Component has comprehensive tests
- [ ] Works in all views (Dashboard, Master View, Audience View)

## Dependencies
- Task 07: Layout Components (Modal component)
- Task 10: Dashboard Layout (keyboard shortcuts implementation)
- Task 17: Audience View Layout (Escape to exit fullscreen)

## Shortcuts to Document

### Dashboard View
- **Space** - Start duel (when two contestants selected)
- **Escape** - Clear contestant selection
- **?** - Show keyboard shortcuts help

### Master View
- **Space** - Mark current answer as correct
- **S** - Skip current question
- **?** - Show keyboard shortcuts help

### Audience View
- **Escape** - Exit fullscreen mode
- **?** - Show keyboard shortcuts help

### Global
- **?** - Show keyboard shortcuts help (available everywhere)

## Implementation Guidance

1. **Create ShortcutsModal Component**
   - Location: `src/components/common/ShortcutsModal.tsx`
   - Use existing Modal component from task-07
   - Accept props: `isOpen`, `onClose`

2. **Shortcuts Data Structure**
   ```typescript
   interface ShortcutItem {
     key: string;          // e.g., "Space", "Escape", "?"
     description: string;  // e.g., "Start duel"
     condition?: string;   // e.g., "When two contestants selected"
   }

   interface ShortcutSection {
     title: string;        // e.g., "Dashboard View"
     shortcuts: ShortcutItem[];
   }
   ```

3. **Global Hook for Shortcuts Modal**
   - Create `src/hooks/useShortcutsModal.ts`
   - Manages modal open/close state
   - Listens for "?" key press globally
   - Returns `{ isOpen, openModal, closeModal }`

4. **Keyboard Handler**
   - Add global event listener for "?" key
   - Check if Shift key is pressed (to avoid conflicts with search inputs)
   - Ignore if user is typing in input/textarea
   - Example:
   ```typescript
   if (e.key === '?' && e.shiftKey) {
     if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
       e.preventDefault();
       openShortcutsModal();
     }
   }
   ```

5. **Visual Design**
   - Use CSS Grid or Flexbox for layout
   - Group shortcuts by context with clear headings
   - Display key in a styled "key cap" component (e.g., `<kbd>Space</kbd>`)
   - Use monospace font for key labels
   - Clean, scannable layout with adequate spacing
   - Optional: use different colors/styles for different key types

6. **Accessibility**
   - Modal already handles focus trap and Escape key
   - Add ARIA label: "Keyboard shortcuts help"
   - Ensure keyboard navigation works
   - Screen reader announces shortcuts clearly
   - Consider adding `role="table"` for shortcuts list

7. **Integration Points**
   - Add to Dashboard page
   - Add to Master View page (future)
   - Add to Audience View page
   - Each page should use the same hook and component

8. **Testing**
   - Test "?" key opens modal
   - Test Escape key closes modal
   - Test clicking backdrop closes modal
   - Test close button closes modal
   - Test modal doesn't open when typing in inputs
   - Test all shortcuts are documented correctly
   - Test accessibility with keyboard only

## Visual Layout Example

```
┌─────────────────────────────────────────┐
│  Keyboard Shortcuts              [X]    │
├─────────────────────────────────────────┤
│                                         │
│  Dashboard View                         │
│  ┌─────────┬───────────────────────┐   │
│  │ Space   │ Start duel            │   │
│  │         │ (when ready)          │   │
│  ├─────────┼───────────────────────┤   │
│  │ Escape  │ Clear selection       │   │
│  ├─────────┼───────────────────────┤   │
│  │ ?       │ Show this help        │   │
│  └─────────┴───────────────────────┘   │
│                                         │
│  Master View                            │
│  ┌─────────┬───────────────────────┐   │
│  │ Space   │ Mark correct          │   │
│  ├─────────┼───────────────────────┤   │
│  │ S       │ Skip question         │   │
│  ├─────────┼───────────────────────┤   │
│  │ ?       │ Show this help        │   │
│  └─────────┴───────────────────────┘   │
│                                         │
│  Audience View                          │
│  ┌─────────┬───────────────────────┐   │
│  │ Escape  │ Exit fullscreen       │   │
│  ├─────────┼───────────────────────┤   │
│  │ ?       │ Show this help        │   │
│  └─────────┴───────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

## Success Criteria
- "?" key reliably opens shortcuts modal from any view
- All existing shortcuts are documented accurately
- Modal is visually clear and easy to read
- Keyboard focus is trapped in modal when open
- Modal can be closed via multiple methods (Escape, close button, backdrop)
- Component doesn't interfere with normal typing
- All tests pass
- Accessible to keyboard and screen reader users

## Out of Scope
- Dynamic shortcut customization (user-defined shortcuts)
- Printable shortcuts reference
- Shortcuts for features not yet implemented
- Animated key press demonstrations
- Context-aware shortcuts (only showing relevant shortcuts)
- Tutorial or onboarding flow
- Gamification (shortcut achievements, etc.)

## Notes
- This feature improves discoverability of keyboard shortcuts
- Enhances accessibility by documenting all keyboard interactions
- Should be one of the last polish tasks before final testing
- Keep the modal lightweight - it's a reference, not a tutorial
- Consider adding a small "Press ? for shortcuts" hint in the UI (footer or header)
- If Master View shortcuts aren't implemented yet, document planned shortcuts
- Update this modal whenever new shortcuts are added to the application
- Reference SPEC.md section 6 for accessibility requirements
