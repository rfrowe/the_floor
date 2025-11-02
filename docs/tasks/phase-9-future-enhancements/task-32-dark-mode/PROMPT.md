# Task 32: Dark Mode / Night Mode Support

## Objective
Implement native dark mode support using CSS custom properties (CSS variables) and theme switching, allowing users to toggle between light and dark themes for reduced eye strain in low-light environments.

## Status
Not Started

## Acceptance Criteria
- [ ] Toggle control in Dashboard/settings to switch themes
- [ ] Dark theme with appropriate colors for all components
- [ ] Light theme (current default) preserved
- [ ] User preference saved to localStorage
- [ ] Respects system preference (`prefers-color-scheme` media query)
- [ ] Smooth transitions between themes
- [ ] Accessible color contrast in both themes (WCAG 2.1 AA)
- [ ] No visual glitches during theme switch
- [ ] All components support both themes
- [ ] Audience View respects theme setting
- [ ] Master View respects theme setting
- [ ] Theme applies immediately without page reload

## Dependencies
- All existing components (need to support theming)
- Task 10: Dashboard (theme toggle placement)

## Design Tokens

### Light Theme (Current Default)
```css
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e0e0e0;

  /* Text */
  --text-primary: #212121;
  --text-secondary: #757575;
  --text-disabled: #bdbdbd;

  /* Borders */
  --border-default: #e0e0e0;
  --border-focus: #2196F3;

  /* Buttons */
  --btn-primary-bg: #2196F3;
  --btn-primary-text: #ffffff;
  --btn-secondary-bg: #757575;
  --btn-danger-bg: #f44336;

  /* Status */
  --status-success: #4CAF50;
  --status-warning: #FF9800;
  --status-danger: #f44336;
  --status-info: #2196F3;

  /* Timer */
  --timer-normal: #4CAF50;
  --timer-warning: #FF9800;
  --timer-danger: #f44336;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 3px 6px rgba(0, 0, 0, 0.16);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.19);
}
```

### Dark Theme
```css
[data-theme="dark"] {
  /* Backgrounds */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #3a3a3a;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-disabled: #666666;

  /* Borders */
  --border-default: #3a3a3a;
  --border-focus: #64B5F6;

  /* Buttons - slightly adjusted for dark bg */
  --btn-primary-bg: #42A5F5;
  --btn-primary-text: #000000;
  --btn-secondary-bg: #616161;
  --btn-danger-bg: #EF5350;

  /* Status */
  --status-success: #66BB6A;
  --status-warning: #FFA726;
  --status-danger: #EF5350;
  --status-info: #42A5F5;

  /* Timer */
  --timer-normal: #66BB6A;
  --timer-warning: #FFA726;
  --timer-danger: #EF5350;

  /* Shadows - lighter for dark theme */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 3px 6px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.6);
}
```

## Implementation Guidance

### 1. Create Theme System

**File**: `src/styles/theme.css`
```css
/* Define CSS custom properties for light and dark themes */
:root {
  /* Light theme variables (default) */
}

[data-theme="dark"] {
  /* Dark theme variables */
}

/* Smooth transitions for theme changes */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

### 2. Theme Hook

**File**: `src/hooks/useTheme.ts`
```typescript
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // 1. Check localStorage
    const stored = localStorage.getItem('theme');
    if (stored) return stored as 'light' | 'dark';

    // 2. Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // 3. Default to light
    return 'light';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}
```

### 3. Theme Toggle Component

**File**: `src/components/common/ThemeToggle.tsx`
```typescript
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Current: ${theme} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### 4. Update All CSS Modules

Convert hardcoded colors to CSS variables:

**Before**:
```css
.button {
  background-color: #2196F3;
  color: #ffffff;
}
```

**After**:
```css
.button {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
```

### 5. System Preference Listener

Listen for system theme changes:
```typescript
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      // Only auto-switch if user hasn't set preference
      setTheme(e.matches ? 'dark' : 'light');
    }
  };

  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}, []);
```

## Component Updates Required

All components need CSS variable updates:

### High Priority
- [ ] Dashboard.module.css
- [ ] MasterView.module.css
- [ ] AudienceView.module.css
- [ ] Modal.module.css
- [ ] Button.module.css
- [ ] Card.module.css
- [ ] Container.module.css

### Medium Priority
- [ ] ContestantCard.module.css
- [ ] DuelSetup.module.css
- [ ] SlideViewer.module.css
- [ ] ClockBar.module.css
- [ ] CategoryImporter.module.css

### Low Priority
- [ ] Spinner.module.css
- [ ] Any other custom components

## Color Accessibility

### Contrast Requirements (WCAG 2.1 AA)
- Normal text (< 18pt): 4.5:1 contrast ratio
- Large text (>= 18pt): 3:1 contrast ratio
- Interactive elements: 3:1 contrast ratio

### Testing Tools
- Chrome DevTools: Lighthouse accessibility audit
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- axe DevTools browser extension

### Dark Theme Considerations
- Avoid pure white (#ffffff) on pure black (#000000) - too harsh
- Use off-white (#f0f0f0) and dark gray (#1a1a1a) instead
- Reduce saturation of bright colors (e.g., #2196F3 → #42A5F5)
- Increase contrast for borders (they disappear on dark backgrounds)
- Test all status colors (success, warning, danger) for visibility

## UI/UX Considerations

### Toggle Placement
- **Option 1**: Dashboard header (next to other controls)
- **Option 2**: Settings menu (if/when implemented)
- **Option 3**: User profile menu (future)

Recommendation: Dashboard header for immediate access

### Toggle Design
- **Simple**: Moon/Sun icon button
- **Descriptive**: "Light Mode" / "Dark Mode" text button
- **Switch**: Toggle switch component
- **Dropdown**: Theme selector (light/dark/auto)

Recommendation: Icon button with tooltip

### Persistence
- Save to localStorage: `theme` key
- Sync across tabs using storage events
- Apply theme before first render to avoid flash

### Default Behavior
1. Check localStorage first
2. Fall back to system preference
3. Default to light mode if neither available

## Testing Strategy

### Manual Testing
- [ ] Toggle between themes in Dashboard
- [ ] Verify all colors change appropriately
- [ ] Check all views (Dashboard, Master, Audience)
- [ ] Test with system dark mode on/off
- [ ] Verify localStorage persistence
- [ ] Test on different browsers

### Automated Testing
- [ ] Test useTheme hook behavior
- [ ] Test theme toggle component
- [ ] Test localStorage integration
- [ ] Test system preference detection
- [ ] Snapshot tests for themed components

### Accessibility Testing
- [ ] Run Lighthouse audit in both themes
- [ ] Check color contrast ratios
- [ ] Test keyboard navigation
- [ ] Verify ARIA labels on toggle
- [ ] Test with screen reader

## Success Criteria
- User can toggle between light and dark themes
- Theme preference persists across sessions
- System preference is respected by default
- All text is readable in both themes
- All UI elements visible in both themes
- No layout shifts or glitches during switch
- Accessible to all users
- Performance not impacted
- All tests pass

## Out of Scope
- Custom theme creation (user-defined colors)
- Additional themes beyond light/dark (e.g., high contrast, colorblind modes)
- Per-view theme settings (different theme for Master vs Audience)
- Animated theme transitions beyond simple color fade
- Theme preview before applying
- Scheduled theme switching (auto-dark at night)
- Dim mode or reading mode

## Migration Path

### Phase 1: Setup Infrastructure
1. Create theme.css with CSS variables
2. Create useTheme hook
3. Create ThemeToggle component
4. Add toggle to Dashboard

### Phase 2: Update Components
1. Convert all CSS modules to use variables
2. Test each component in both themes
3. Fix any visual issues

### Phase 3: Polish
1. Optimize color choices
2. Ensure accessibility
3. Add smooth transitions
4. Test on multiple devices

### Phase 4: Documentation
1. Update README with theme info
2. Document CSS variables
3. Add theme to style guide
4. Document for future developers

## Performance Considerations

### CSS Variables Performance
- Minimal impact on modern browsers
- No runtime recalculation needed
- Better than class-based theming

### Transition Performance
- Use `will-change` sparingly
- Limit transitions to color properties only
- Avoid transitioning layout properties
- Consider reduced-motion preference:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
    }
  }
  ```

## Future Enhancements
- Additional theme options (high contrast, sepia)
- Theme customization UI
- Theme sharing/export
- Per-component theme overrides
- Automatic theme based on time of day
- Gradual theme transitions (sunrise/sunset effect)

## Notes
- Dark mode increasingly expected in modern apps
- Reduces eye strain for night/low-light usage
- Can reduce screen power consumption on OLED displays
- Important for accessibility (light sensitivity)
- Should feel native, not tacked on
- Test on actual projection equipment (Audience View)
- Consider that projectors may not display dark themes well
- May want to force light theme for Audience View
