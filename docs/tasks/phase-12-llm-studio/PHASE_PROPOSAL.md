# Phase 12: LLM Studio - AI-Powered Slide Generation

## Overview
Create "The Studio" - an AI-powered content creation interface for generating and editing game categories using LLM prompts, image search/generation, and interactive editing.

## Vision

**The Studio** is a dedicated space within The Floor application where users can:
1. Prompt an LLM to generate category slide ideas
2. Automatically find or generate images for each slide
3. Review, edit, regenerate, and refine slides
4. Save finished categories for use in gameplay

Think: "ChatGPT meets PowerPoint for game show content creation"

## Use Cases

### Use Case 1: Create New Category from Scratch
User: "Create a category about 80s action movies with 10 slides"
- LLM generates 10 movie titles with brief descriptions
- System finds images for each movie
- User reviews, tweaks, and saves

### Use Case 2: Edit Existing Category
- User loads "State Capitals" category
- Adds 5 more slides using LLM suggestions
- Regenerates images for better quality
- Saves updated version

### Use Case 3: Generate Variations
User: "Create 3 variations of 'Famous Landmarks' with different difficulty levels"
- LLM generates easy, medium, hard versions
- User picks best slides from each
- Combines into final category

## Technical Architecture

### Components

1. **Studio Interface** (React UI)
   - Category editor
   - Slide list with preview
   - LLM prompt input
   - Image search/generation controls
   - Regeneration options

2. **LLM Integration** (OpenAI API)
   - GPT-4 for content generation
   - Structured output for slide data
   - Cost tracking and limits

3. **Image Pipeline**
   - Search: Unsplash API, Pexels API
   - Generation: DALL-E 3 (optional)
   - Upload: User-provided images

4. **Credentials Store**
   - OpenAI API key storage
   - Image service API keys
   - Usage tracking
   - Cost calculation

5. **Export System**
   - Save to categories storage
   - Export as JSON
   - Import existing categories for editing

## Scope

### Phase 12 In Scope
- Studio UI for category creation
- OpenAI GPT integration for content
- Image search via free APIs (Unsplash/Pexels)
- Manual slide editing (add, delete, reorder)
- Regeneration of individual slides
- Cost tracking and warnings
- Export to category format
- Import existing categories

### Out of Scope (Future Phases)
- DALL-E image generation (expensive, add later)
- Automatic censor box generation (complex CV)
- Multi-user collaboration
- Cloud storage/sync
- Category marketplace
- Batch generation (multiple categories at once)
- Voice prompts
- Video content

## Proposed Task Breakdown

### Task 53: Studio UI Foundation
**Objective**: Build basic Studio interface

- New "Studio" page/tab
- Category metadata editor (name, difficulty)
- Slide list view
- Slide editor panel
- Add/delete/reorder slides
- Preview panel

### Task 54: Credentials Management
**Objective**: Secure storage and UI for API credentials

- Settings modal for API keys
- OpenAI API key input
- Unsplash/Pexels API key inputs (optional, free tier)
- Local storage (encrypted or with warning)
- Test connection buttons
- Usage tracking system

### Task 55: LLM Integration
**Objective**: OpenAI GPT-4 integration for content generation

- Prompt engineering for slide generation
- Structured output parsing
- Category metadata from LLM
- Individual slide regeneration
- Context-aware suggestions (based on existing slides)
- Token counting and cost estimation
- Error handling and retries

### Task 56: Image Search Integration
**Objective**: Integrate Unsplash/Pexels for image search

- Search by slide content/keywords
- Display search results
- Image preview and selection
- Download and store images
- Attribution handling (required by Unsplash/Pexels)
- Fallback to placeholder images

### Task 57: Slide Editing Interface
**Objective**: Interactive slide editor with regeneration

- Edit slide question/answer
- Replace image (search, upload, or URL)
- Regenerate individual slide
- Regenerate all slides
- Regenerate just images
- Undo/redo system

### Task 58: Export and Import
**Objective**: Save Studio work to game categories

- Export category to game storage
- Import existing category for editing
- Version control (track edits)
- Duplicate category
- Delete category from Studio

### Task 59: Cost Tracking and Limits
**Objective**: Help users manage AI costs

- Track API calls (LLM and images)
- Estimate costs (OpenAI pricing)
- Display running total
- Set spending limits
- Warn before expensive operations
- Usage history

### Task 60: Prompt Templates
**Objective**: Pre-built prompts for common use cases

- Template library (movies, geography, history, etc.)
- Custom template creation
- Difficulty level presets
- Slide count presets
- Category tone/style options

## Technical Considerations

### LLM Prompt Engineering

**Example Prompt Structure**:
```
Generate a quiz category about {topic} with {count} slides.

Each slide should have:
- A question or image prompt (what to show)
- The correct answer (text)
- Keywords for image search

Format as JSON array:
[
  {
    "question": "What 1984 film features this cyborg assassin?",
    "answer": "The Terminator",
    "keywords": "terminator movie 1984 arnold schwarzenegger"
  },
  ...
]

Requirements:
- Difficulty: {easy/medium/hard}
- Style: {family-friendly/adult/educational}
- Variety: Mix of easy and hard within difficulty level
```

### API Cost Management

**OpenAI Costs** (approximate):
- GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
- Generating 10 slides ≈ 1K tokens = ~$0.03-0.05 per category

**Image Costs**:
- Unsplash: Free (attribution required)
- Pexels: Free (attribution optional)
- DALL-E 3: $0.04-0.08 per image (future addition)

**Mitigation**:
- Use GPT-4 Turbo (cheaper than GPT-4)
- Cache results
- Warn before regenerating all
- Daily/monthly limits

### Data Flow

```
User Prompt
  ↓
LLM (GPT-4) → Structured Slide Data
  ↓
For each slide:
  Image Search (Unsplash/Pexels) → Select Image
  ↓
User Review → Edit/Regenerate
  ↓
Export → Category Storage → Available in Game
```

### Security

- API keys stored locally (not in cloud)
- Warn users about security
- Consider encryption
- Rate limiting to prevent abuse
- CORS handling for API requests

### Error Handling

- LLM failures (rate limits, downtime)
- Image search failures
- Invalid API keys
- Network issues
- Graceful degradation (allow manual entry)

## UI/UX Design

### Studio Layout

```
┌─────────────────────────────────────────────────┐
│ [Studio] [New] [Import] [Export] [Settings]    │
├──────────────┬──────────────────────────────────┤
│ Slide List   │ Slide Editor                     │
│              │                                   │
│ 1. Slide 1   │ ┌─────────────────────────────┐ │
│ 2. Slide 2   │ │ Image Preview               │ │
│ 3. Slide 3   │ │                             │ │
│    ...       │ └─────────────────────────────┘ │
│              │ Question: [____________________] │
│ [+ Add]      │ Answer:   [____________________] │
│ [Generate]   │ Keywords: [____________________] │
│              │ [Search Images] [Regenerate]     │
│              │ [Delete Slide] [Move Up/Down]    │
└──────────────┴──────────────────────────────────┘
```

### Generation Flow

1. User enters prompt: "10 slides about famous painters"
2. Loading indicator (30-60 seconds)
3. Slides appear in list
4. Images load progressively (search happening in background)
5. User reviews, clicks slide to edit
6. Makes changes, hits "Save Category"

## Success Criteria

- [ ] Users can generate categories from text prompts
- [ ] Generated slides include question, answer, and image
- [ ] Users can edit, add, delete slides
- [ ] Images searchable and replaceable
- [ ] Categories exportable to game
- [ ] Existing categories importable for editing
- [ ] Cost tracking functional
- [ ] API key management secure
- [ ] All tests passing
- [ ] Documentation for setup and usage

## Timeline Estimate

- Task 53 (Studio UI): 3-4 days
- Task 54 (Credentials): 2 days
- Task 55 (LLM): 3-4 days
- Task 56 (Images): 2-3 days
- Task 57 (Editing): 2-3 days
- Task 58 (Export/Import): 2 days
- Task 59 (Cost Tracking): 2 days
- Task 60 (Templates): 1-2 days

**Total**: 17-23 days (3-4 weeks)

## Risks and Mitigations

### Risk 1: API Costs Run High
**Mitigation**: Strict cost tracking, warnings, limits, free tier testing

### Risk 2: LLM Output Quality
**Mitigation**: Prompt engineering, user editing, regeneration options

### Risk 3: Image Search Failures
**Mitigation**: Multiple APIs, fallback to placeholder, manual upload

### Risk 4: Complex State Management
**Mitigation**: Use reducer pattern, clear data flow, persistent drafts

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Unsplash API](https://unsplash.com/documentation)
- [Pexels API](https://www.pexels.com/api/)
- [GPT-4 Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

## Future Enhancements (Post-Phase 12)

### Phase 13: Advanced Studio Features
- DALL-E 3 image generation
- Automatic censor box generation (computer vision)
- Category difficulty analysis
- A/B testing for slide quality
- Category remixing (combine best slides from multiple categories)
- Bulk operations

### Phase 14: Studio Pro
- Cloud storage and sync
- Collaboration (multi-user editing)
- Category marketplace (share with community)
- Analytics (which slides work best)
- Slide templates
- Custom branding

### Phase 15: Content Moderation
- Profanity filtering
- Appropriateness checking
- Copyright detection
- Age-appropriateness ratings
- Content warnings

## Notes

- This is a major feature that could be a product itself
- Phase 12 focuses on MVP: generate, edit, export
- User testing crucial - iterate on UX
- Consider open-sourcing as separate library
- Could monetize with premium features (DALL-E, cloud storage)
- Extremely useful for content creators and educators

## Open Questions

1. Should we support video slides (GIFs/MP4)?
2. Should censor boxes be manually placed or auto-generated?
3. Should we support audio clues/answers?
4. What's the best way to handle image attribution requirements?
5. Should Studio be a separate app or integrated page?

## Dependencies from Other Phases

- Task 30: Category Manager (storage system)
- Task 06: PPTX Import (similar export format)
- Potential: Credentials store from Phase 11
