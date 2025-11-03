# Task 43: Maximize Slide Vertical Space Usage

## Objective
Display slide images to fill as much vertical space as possible without cropping, ensuring maximum readability on projection screens.

## Status
Not Started

## Priority
**MEDIUM** - UX improvement for better audience visibility.

## Background

During the live demo, slide images didn't use the full vertical space available in the audience view, leaving significant unused space above and below images. This reduced readability on projection screens.

**Current Behavior**: Images displayed with fixed aspect ratio, often leaving vertical space unused

**Expected Behavior**: Images scale to use maximum available vertical space while maintaining aspect ratio and preventing any cropping

## Acceptance Criteria
- [ ] Slide images fill available vertical space
- [ ] Aspect ratio preserved (no distortion)
- [ ] No cropping of image content
- [ ] Letterboxing (black bars) allowed horizontally if needed
- [ ] Censor boxes scale and position correctly
- [ ] Works across all screen sizes and aspect ratios
- [ ] Clock bar space accounted for in calculations
- [ ] All tests passing

## Implementation Guidance

### CSS Approach

**File**: `src/pages/AudienceView.module.css`

```css
.slide-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - var(--clock-bar-height));
  width: 100vw;
  background: #000;
}

.slide-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain; /* Maintain aspect ratio, no crop */
}
```

### JavaScript Approach (if more control needed)

```typescript
useEffect(() => {
  const container = containerRef.current;
  const image = imageRef.current;
  if (!container || !image) return;

  const containerHeight = container.clientHeight;
  const containerWidth = container.clientWidth;
  const imageAspect = image.naturalWidth / image.naturalHeight;
  const containerAspect = containerWidth / containerHeight;

  if (imageAspect > containerAspect) {
    // Image is wider - fit to width
    image.style.width = '100%';
    image.style.height = 'auto';
  } else {
    // Image is taller - fit to height (maximize vertical)
    image.style.height = '100%';
    image.style.width = 'auto';
  }
}, [currentSlide]);
```

## Testing Strategy
- Test with various slide aspect ratios (4:3, 16:9, square)
- Verify no cropping occurs
- Test on different screen sizes
- Verify censor boxes remain aligned

## Success Criteria
- Images use maximum available vertical space
- No content cropped
- All tests passing

## Out of Scope
- Zooming or panning
- Manual aspect ratio override

## Related Tasks
- Task 18: Slide Display
- Task 09: Slide Viewer
