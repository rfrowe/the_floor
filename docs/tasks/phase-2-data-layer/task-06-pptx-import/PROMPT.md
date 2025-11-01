# Task 06: PPTX Import & Parsing

## Objective
Create functionality to import PPTX files exported from Google Slides and parse them into the application's data format, extracting images, speaker notes (answers), and censorship box information.

## Acceptance Criteria
- [ ] PPTX files can be uploaded via file input
- [ ] Images are extracted from slides and converted to base64 or blob URLs
- [ ] Speaker notes are extracted as the correct answers
- [ ] Censorship boxes are identified and their positions/colors extracted
- [ ] Data is transformed into Contestant/Category/Slide format
- [ ] User can review parsed data before saving
- [ ] Error handling for corrupted or invalid PPTX files
- [ ] UI component for import workflow
- [ ] Tests verify parsing logic works correctly

## Technical Approach
Consider using libraries like:
- **pizzip** + **docxtemplater** for PPTX parsing
- **pptxgenjs** or **jszip** for reading PPTX structure
- Or **manually parse** PPTX as ZIP containing XML files

PPTX files are ZIP archives containing:
- `ppt/slides/slide*.xml` - Slide content and shapes
- `ppt/media/*` - Embedded images
- `ppt/notesSlides/notesSlide*.xml` - Speaker notes

## Implementation Guidance
1. Create `src/utils/pptxParser.ts` with parsing logic:
   ```typescript
   export async function parsePPTX(file: File): Promise<ParsedCategory>
   export function extractImages(pptxZip: any): Promise<ImageData[]>
   export function extractSpeakerNotes(pptxZip: any): string[]
   export function extractCensorBoxes(slideXml: string): CensorBox[]
   ```
2. Create a `PPTXImporter` component with:
   - File upload input (accept=".pptx")
   - Progress indicator during parsing
   - Preview of parsed data (images, answers, box count)
   - Form to edit contestant name and category name
   - Save/Cancel buttons
3. Handle censorship boxes:
   - Look for shapes with specific properties (filled rectangles)
   - Extract position (cx, cy), size (cx, cy in EMUs)
   - Convert EMUs to percentages relative to slide dimensions
   - Extract fill color (hex or RGB)
4. Image processing:
   - Extract images from `ppt/media/` folder
   - Convert to base64 for storage in localStorage
   - OR use blob URLs if base64 is too large
   - Add white background for transparent PNGs
5. Error handling:
   - Invalid file format
   - Missing required data (images, notes)
   - Parsing errors
6. Write tests for parsing logic with sample PPTX fixtures

## Success Criteria
- Can successfully import a PPTX with 10+ slides
- All images are extracted and displayable
- Speaker notes become slide answers
- Censorship boxes maintain correct position and size
- User can review and edit before saving to localStorage
- Error messages are clear and helpful
- Performance is reasonable (< 5 seconds for 50 slides)

## Out of Scope
- Batch import of multiple PPTX files (can iterate one at a time)
- Automatic detection of censorship boxes vs. other shapes
- Advanced PPTX features (animations, transitions, etc.)
- Export back to PPTX format

## Notes
- PPTX parsing can be complex - focus on the specific Google Slides export format
- Consider providing a sample PPTX file and documentation on how to prepare slides
- Censorship box detection may require manual tagging or specific naming conventions
- If automatic extraction is too complex, provide a manual JSON editor as fallback
- Reference SPEC.md section 3.1 for requirements
