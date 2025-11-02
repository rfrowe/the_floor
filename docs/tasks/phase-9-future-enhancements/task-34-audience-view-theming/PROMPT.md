# Task 34: Audience View Theming to Match "The Floor" Aesthetic

## Objective
Update the Audience View to match the visual aesthetic of the actual "The Floor" TV game show, creating an authentic and polished viewing experience.

## Status
Not Started

## Priority
**Medium** - Visual enhancement that improves production quality but doesn't affect core functionality

## Acceptance Criteria
- [ ] Waiting view (no active duel) styled to match show aesthetic
- [ ] Active duel view styled to match show aesthetic
- [ ] ClockBar component themed to match show design
- [ ] Color palette matches reference screenshots
- [ ] Typography matches show style (or close approximation)
- [ ] Smooth transitions between waiting and duel states
- [ ] Maintains responsive design on all screen sizes
- [ ] No regressions in functionality (timers, slide display, etc.)
- [ ] All tests passing
- [ ] Screenshots match reference materials

## Dependencies
- Task 17: Audience View Layout - ✅ complete
- Task 19: ClockBar Component - ✅ complete
- Task 18: Slide Display - ✅ complete

## Reference Materials

**User will provide**:
- Screenshots from "The Floor" TV show
- Specific color values (if available)
- Font preferences (or close approximations)

**Until provided**: Use placeholder aesthetic that can be easily replaced.

## Scope Definition

### ✅ In Scope
- **Waiting view** styling (shown when no duel is active)
- **Duel view** background and container styling
- **ClockBar** theming (colors, fonts, layout refinement)
- Color palette updates
- Typography updates (fonts, sizes, weights)
- Background colors/gradients
- Border styles and shadows

### ❌ Out of Scope
- Clickbar redesign (keep existing functionality)
- Slide display redesign (maintain current aspect ratio handling)
- Adding new UI elements not in reference screenshots
- Animations beyond what currently exists
- Grid view implementation (see Task 36)
- Logo or branding additions
- Video backgrounds or complex animations

## Implementation Guidance

### 1. Analyze Reference Screenshots

Before coding, identify:
- **Color palette**: Primary, secondary, accent colors
- **Typography**: Font families, sizes, weights
- **Layout patterns**: Spacing, alignment, hierarchy
- **Visual elements**: Borders, shadows, gradients
- **Transitions**: How views change between states

Document findings in a design tokens file.

### 2. Create Design Tokens

**File**: `src/styles/the-floor-theme.css`
```css
:root {
  /* The Floor Brand Colors (update with actual values) */
  --floor-primary: #0066cc;
  --floor-secondary: #1a1a1a;
  --floor-accent: #ffd700;
  --floor-bg-dark: #000000;
  --floor-bg-light: #f0f0f0;
  --floor-text-light: #ffffff;
  --floor-text-dark: #000000;

  /* ClockBar Colors */
  --floor-clockbar-bg: rgba(0, 0, 0, 0.85);
  --floor-clockbar-text: #ffffff;
  --floor-player-active: #00ff00;
  --floor-player-inactive: #666666;

  /* Timer Colors */
  --floor-timer-normal: #00ff00;
  --floor-timer-warning: #ffaa00;
  --floor-timer-critical: #ff0000;

  /* Typography */
  --floor-font-primary: 'Arial Black', 'Arial Bold', sans-serif;
  --floor-font-secondary: 'Arial', sans-serif;
  --floor-font-timer: 'Courier New', monospace;
}
```

**Note**: Update these values after reviewing reference screenshots.

### 3. Update Waiting View

**File**: `src/pages/AudienceView.tsx` and `AudienceView.module.css`

**Current**: Basic text "No active duel"

**Updated**: Themed waiting screen
```typescript
function WaitingView() {
  return (
    <div className={styles['waiting-view']}>
      <div className={styles['waiting-content']}>
        <h1 className={styles['waiting-title']}>The Floor</h1>
        <p className={styles['waiting-subtitle']}>Waiting for next duel...</p>
      </div>
    </div>
  );
}
```

```css
/* AudienceView.module.css */
.waiting-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--floor-bg-dark);
  background: linear-gradient(135deg, var(--floor-bg-dark) 0%, var(--floor-secondary) 100%);
}

.waiting-content {
  text-align: center;
  color: var(--floor-text-light);
}

.waiting-title {
  font-family: var(--floor-font-primary);
  font-size: 4rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.waiting-subtitle {
  font-family: var(--floor-font-secondary);
  font-size: 1.5rem;
  opacity: 0.8;
}
```

### 4. Update Active Duel View

**Focus**: Background, container styling, overall aesthetic

```css
.duel-view {
  min-height: 100vh;
  background: var(--floor-bg-dark);
  /* Match show aesthetic - possibly gradient, solid color, or pattern */
}

.duel-container {
  /* Add any container styling from reference */
  padding: 0;
  /* Ensure slide viewer takes center stage */
}
```

### 5. Theme ClockBar Component

**File**: `src/components/duel/ClockBar.tsx` and `ClockBar.module.css`

**Key Updates**:
- Background color/transparency
- Font family and size
- Active player indicator styling
- Timer color transitions
- Name display styling

```css
/* ClockBar.module.css updates */
.clock-bar {
  background: var(--floor-clockbar-bg);
  backdrop-filter: blur(10px); /* If background is semi-transparent */
  font-family: var(--floor-font-primary);
  /* ... match screenshot styling */
}

.player-name {
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  /* ... match screenshot typography */
}

.timer {
  font-family: var(--floor-font-timer);
  font-weight: bold;
  /* ... match screenshot timer style */
}

.active-indicator {
  /* Style based on reference - possibly glow, border, or color change */
  box-shadow: 0 0 20px var(--floor-player-active);
}
```

### 6. Typography

**Fonts to Consider** (based on typical game show aesthetic):
- **Primary**: Impact, Arial Black, Bebas Neue
- **Secondary**: Arial, Helvetica, Roboto
- **Timer**: Courier New, Consolas, Monaco (monospace)

**Font Loading**:
```css
/* index.css or App.css */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

body {
  font-family: var(--floor-font-secondary);
}
```

**Note**: Use web-safe fonts or Google Fonts for reliability.

### 7. Color Transitions

Ensure timer colors transition smoothly:
```css
.timer {
  transition: color 0.3s ease;
}

.timer-normal { color: var(--floor-timer-normal); }
.timer-warning { color: var(--floor-timer-warning); }
.timer-critical { color: var(--floor-timer-critical); }
```

## Design Process

### Step 1: Reference Analysis
1. Review all provided screenshots
2. Identify color palette (use color picker tool)
3. Note typography styles
4. Document layout patterns
5. Create style guide document

### Step 2: Create Style Guide
**File**: `docs/design/audience-view-style-guide.md`

Document:
- Color swatches with hex values
- Font selections with fallbacks
- Spacing system (margins, padding)
- Component-specific styles
- Responsive breakpoints

### Step 3: Implement Incrementally
1. Add design tokens to CSS
2. Update waiting view first (easier to test)
3. Update ClockBar styling
4. Update duel view container
5. Test on multiple screen sizes
6. Refine based on side-by-side comparison with screenshots

### Step 4: Validate
- Compare rendered view with reference screenshots
- Adjust colors/fonts until close match
- Test on actual display hardware (projector, TV)
- Get feedback from stakeholders

## Testing Strategy

### Visual Testing
- [ ] Side-by-side comparison with reference screenshots
- [ ] Test on 1080p display
- [ ] Test on 4K display
- [ ] Test on projector (if available)
- [ ] Verify in different browsers
- [ ] Check color accuracy

### Functional Testing
- [ ] Waiting view displays correctly
- [ ] Duel view displays correctly
- [ ] ClockBar updates properly
- [ ] Timers change color at correct thresholds
- [ ] Active player indicator works
- [ ] Transitions between views are smooth
- [ ] Responsive on mobile (even if not primary use case)

### Automated Testing
```typescript
describe('AudienceView Theming', () => {
  it('renders waiting view with themed styles', () => {
    render(<AudienceView />);
    const waitingView = screen.getByText(/waiting for next duel/i);
    expect(waitingView).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<AudienceView />);
    // Verify themed classes are applied
  });
});
```

**Note**: Visual regression testing would be ideal but not required.

## Responsive Design Considerations

While Audience View is primarily for large displays:
- Ensure layout doesn't break on smaller screens
- Maintain readability at all sizes
- Test on tablet size (1024x768)
- Mobile support is nice-to-have, not required

## Accessibility Considerations

### Color Contrast
- Ensure text meets WCAG AA standards (4.5:1 for normal text)
- Timer colors must be distinguishable for colorblind users
- High contrast between background and foreground

### Font Legibility
- Minimum 24px font size for large displays
- Clear, readable fonts even from distance
- Avoid overly decorative fonts that reduce readability

## Performance Considerations

### CSS Performance
- Minimize use of expensive properties (backdrop-filter, box-shadow)
- Use GPU-accelerated transforms for animations
- Avoid layout thrashing

### Font Loading
- Preload critical fonts
- Use font-display: swap for web fonts
- Provide web-safe fallbacks

```css
@font-face {
  font-family: 'BebasNeue';
  src: url('/fonts/BebasNeue.woff2') format('woff2');
  font-display: swap;
}
```

## Success Criteria
- Waiting view matches show aesthetic
- Duel view matches show aesthetic
- ClockBar styling matches reference
- Colors accurately replicate show palette
- Typography closely matches show fonts
- Smooth transitions maintain polish
- No functional regressions
- Positive stakeholder feedback
- All tests passing

## Out of Scope (Explicitly)
- **Clickbar redesign**: Keep existing clickable areas and functionality
- **Slide viewer changes**: Maintain current implementation
- **New UI elements**: Only style existing elements
- **Complex animations**: Beyond simple transitions
- **Branding elements**: Unless in reference screenshots
- **Grid view**: Separate task (Task 36)

## Migration Notes

### Before Starting
1. Take screenshots of current Audience View (both states)
2. Document current color values
3. Create backup branch

### During Implementation
1. Work in feature branch
2. Commit incrementally (colors, typography, layout)
3. Test frequently against reference

### After Completion
1. Archive reference screenshots in repo
2. Document final color palette
3. Update README with theming info

## Future Enhancements
- Animated transitions (e.g., slide in/out)
- Particle effects or visual flourishes
- Theme variations (daytime vs evening)
- Customizable branding
- Dynamic backgrounds based on category

## Notes
- This is primarily a visual/CSS task - minimal TypeScript changes
- Focus on matching the "feel" of the show, not pixel-perfect replication
- Game show aesthetic: bold, high-contrast, easy to read from distance
- Test on actual display hardware if possible (projector, large TV)
- Consider that screenshots may not capture exact colors (compression, display differences)
- Prioritize readability and functionality over exact aesthetic match
- Document any deviations from reference screenshots with rationale
