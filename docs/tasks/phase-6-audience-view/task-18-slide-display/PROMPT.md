# Task 18: Audience Slide Display

## Objective
Implement the full-screen slide display for the audience view with proper sizing, censorship boxes, and smooth transitions between slides.

## Acceptance Criteria
- [ ] Slide fills available space while preserving aspect ratio
- [ ] Censorship boxes rendered at correct positions
- [ ] White background for transparent images
- [ ] No cropping of important image areas (letterboxing OK)
- [ ] Smooth transitions when slides change
- [ ] High-quality image rendering (no blur or pixelation)
- [ ] Handles various image aspect ratios correctly
- [ ] Works at different screen resolutions
- [ ] Performance: smooth 60fps rendering

## Implementation Guidance
1. Reuse `SlideViewer` component from task-09:
   - Pass `fullscreen={true}` prop
   - Ensure component scales properly for large displays
2. Calculate available space:
   - Total viewport height minus clock bar height
   - Full viewport width
   - Center content in this area
3. Image sizing strategy:
   - Use CSS `object-fit: contain` or custom calculation
   - Calculate aspect ratios: image vs container
   - Add letterboxing (black bars) if needed:
     - Vertical bars for wide images in tall containers
     - Horizontal bars for tall images in wide containers
4. Censorship boxes:
   - Position relative to the image (not the container)
   - Calculate exact pixel positions based on percentages
   - Ensure boxes scale with image size
   - Test with various screen sizes
5. Slide transitions:
   - Fade out old slide (200-300ms)
   - Fade in new slide (200-300ms)
   - Optional: crossfade for smoother effect
   - Use CSS transitions or React animation library
6. Performance optimization:
   - Preload next slide image
   - Use CSS transforms for animations (GPU accelerated)
   - Avoid layout thrashing
   - Use React.memo to prevent unnecessary re-renders
7. Handle edge cases:
   - Missing image: show placeholder
   - Image load error: show error state
   - Very large images: ensure they don't cause lag
   - First slide: no transition, show immediately

## Slide Transition Example
```
Slide A displayed → Correct button clicked →
  → Fade out Slide A (200ms) →
  → Fade in Slide B (200ms) →
Slide B displayed
```

## Success Criteria
- Images are crisp and clear on large displays
- Censorship boxes positioned accurately (within 1-2px)
- No cropping of important image content
- Transitions are smooth and professional
- No jank or performance issues
- Works across different screen sizes and aspect ratios
- Letterboxing is subtle and doesn't distract

## Out of Scope
- Advanced transitions (wipe, zoom, etc.)
- Slide thumbnails or preview
- Image editing or filters
- Slide notes or annotations

## Notes
- This is what the audience sees - it needs to look professional
- Test with actual content at actual projection resolution
- Consider various image sizes and aspect ratios during testing
- Images may be 16:9, 4:3, square, portrait, etc.
- Coordinate with task-09 (SlideViewer component) for consistency
- Reference SPEC.md sections 3.1 and 3.4 for requirements
