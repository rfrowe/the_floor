# Task 09: Slide Viewer Component

## Objective
Build a component to display slides with images and censorship boxes, handling aspect ratios correctly and positioning overlays accurately.

## Acceptance Criteria
- [ ] SlideViewer component displays slide images
- [ ] Censorship boxes overlaid at correct positions with proper sizes and colors
- [ ] Aspect ratio preserved (letterboxing, no cropping)
- [ ] White background fallback for transparent images
- [ ] Responsive sizing to fit container
- [ ] Smooth rendering without layout shifts
- [ ] Works in both master and audience views
- [ ] TypeScript props interface defined
- [ ] Component tests verify rendering and positioning

## Component Props
```typescript
interface SlideViewerProps {
  slide: Slide;
  fullscreen?: boolean; // For audience view
  showAnswer?: boolean; // For skip animation in audience view
  className?: string;
}
```

## Visual Requirements
Based on SPEC.md section 3.4:
- Image fills available space while maintaining aspect ratio
- Letterboxing (black bars) if aspect ratio doesn't match container
- Censorship boxes positioned relative to image (not container)
- White background for transparent images
- Crisp rendering (no blur or pixelation)

## Implementation Guidance
1. Create `src/components/slide/SlideViewer.tsx`
2. Image rendering:
   - Use `object-fit: contain` to preserve aspect ratio
   - Calculate container aspect ratio vs image aspect ratio
   - Add letterboxing with CSS or programmatically
3. Censorship boxes:
   - Position absolutely relative to the image (not viewport)
   - Convert percentage positions to actual pixels
   - Use CSS transforms or calc() for positioning
   - Ensure boxes scale with image size
   - Set background color from censorBox.color
4. Handle edge cases:
   - Missing image (show placeholder)
   - Image load errors (fallback UI)
   - Very small or very large images
   - 0 censor boxes (just show image)
5. Performance:
   - Optimize for smooth rendering
   - Avoid unnecessary re-renders
   - Consider using React.memo
6. Add a white background layer behind images:
   - Use CSS background-color or a div layer
   - Ensures transparent PNGs have white backing
7. Write tests:
   - Renders image correctly
   - Renders censor boxes at correct positions
   - Handles missing data gracefully

## Success Criteria
- Images display clearly with correct aspect ratio
- Censorship boxes are positioned accurately (within 1-2% of intended position)
- No important parts of images are cropped
- Component works at different sizes (small preview, full-screen)
- Transparent images show white background
- Performance is smooth (60fps)
- Tests verify positioning logic

## Out of Scope
- Image editing or manipulation
- Zoom or pan functionality
- Slide transitions/animations (handled separately)
- Preloading or lazy loading (can add later)

## Notes
- Positioning is critical - censorship boxes must precisely cover the correct areas
- Test with various aspect ratios (16:9, 4:3, square, portrait)
- Consider creating a utility function for position calculations
- Reference SPEC.md sections 3.1 and 3.4 for requirements
- The same component will be used in both master and audience views
