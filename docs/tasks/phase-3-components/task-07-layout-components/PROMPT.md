# Task 07: Layout Components

## Objective
Build reusable layout and common UI components that will be used throughout the application.

## Acceptance Criteria
- [ ] Container component for consistent page layout
- [ ] Button component with variants (primary, secondary, danger)
- [ ] Card component for displaying grouped information
- [ ] Modal/Dialog component for confirmations and forms
- [ ] Loading spinner component
- [ ] All components are responsive and accessible
- [ ] Components support className prop for custom styling
- [ ] Storybook or example page demonstrates all variants
- [ ] Components have TypeScript prop types
- [ ] Basic component tests verify rendering

## Components to Create

### 1. Container
- Consistent max-width and padding
- Centers content on large screens
- Responsive behavior

### 2. Button
- Variants: primary, secondary, danger, ghost
- Sizes: small, medium, large
- States: default, hover, active, disabled, loading
- Support for icons
- Accessible (proper focus states, ARIA labels)

### 3. Card
- Consistent border, shadow, padding
- Optional header, body, footer sections
- Hover states if interactive

### 4. Modal
- Overlay background (with click-outside to close)
- Centered content area
- Header with optional close button
- Body and footer sections
- Focus trap when open
- Escape key to close
- Accessible (ARIA roles, focus management)

### 5. Spinner/Loader
- Visual loading indicator
- Different sizes
- Optional text label

## Implementation Guidance
1. Create components in `src/components/common/`:
   - `Container.tsx`
   - `Button.tsx`
   - `Card.tsx`
   - `Modal.tsx`
   - `Spinner.tsx`
2. Use CSS modules or styled-components for styling (your choice)
3. Follow accessibility best practices:
   - Semantic HTML
   - ARIA labels and roles
   - Keyboard navigation
   - Focus management
4. Make components flexible:
   - Accept `className` prop for custom styles
   - Support `children` prop where appropriate
   - Use TypeScript to enforce prop types
5. Create an example page or Storybook stories to showcase all components
6. Write basic tests to verify components render correctly

## Success Criteria
- All components render correctly with different prop combinations
- Components are accessible (can navigate with keyboard, screen reader friendly)
- Styling is consistent and follows a design system
- Components are reusable throughout the application
- TypeScript catches prop errors at compile time
- Tests provide confidence components work as expected

## Out of Scope
- Complex form components (can be added later as needed)
- Advanced animations (keep it simple)
- Theme switching or dark mode
- Component library integration (build custom components)

## Notes
- These components form the foundation of the UI - invest time in getting them right
- Consistency is more important than complexity
- Prioritize accessibility from the start - it's harder to add later
- Keep components simple and composable
