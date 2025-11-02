# Task 27.9: Test Contestant Data Files

## Objective
Create sample contestant/category JSON files with embedded images for manual testing, development, and demonstration purposes without requiring PPTX file creation.

## Status
✅ Completed

## Acceptance Criteria
- [x] At least 3 complete contestant JSON files
- [x] Each file has 3 slides with unique answers
- [x] Images embedded as SVG data URLs (no external dependencies)
- [x] Censor boxes properly positioned to cover answers
- [x] Answer text visible in images for validation
- [x] Files match application's JSON schema exactly
- [x] Files can be imported via CategoryImporter
- [x] Thematically consistent categories (Apples, Barrels, Candles, etc.)
- [x] Diverse visual designs across categories
- [x] Files committed to repository for team use

## Dependencies
- Task 08: Category Importer (JSON schema)
- Task 27.6: Multi-File Import (can test with multiple files)

## Test Data Created

### 1. alice-apples.json
**Category**: Apples
**Slides**:
1. **Red Delicious** - Red apple SVG
2. **Golden Delicious** - Golden/yellow apple SVG
3. **Pink Lady** - Pink apple SVG

**Visual Design**: Simple filled circles with stem, varying colors

### 2. bobby-barrels.json
**Category**: Barrels
**Slides**:
1. **Whiskey Barrel** - Wooden barrel with metal hoops
2. **Oil Barrel** - Steel/blue industrial barrel
3. **Wine Barrel** - Wooden barrel with circular design

**Visual Design**: Cylindrical barrels with different materials and details

### 3. cadence-candles.json
**Category**: Candles
**Slides**:
1. **Pillar Candle** - Tall cylindrical candle
2. **Tea Light** - Small round candle in holder
3. **Taper Candle** - Long thin taper with flame

**Visual Design**: Various candle shapes with flames and details

## File Structure

Each JSON file follows this schema:
```json
{
  "category": {
    "name": "Category Name",
    "slides": [
      {
        "id": "unique-id",
        "answer": "Answer Text",
        "imageUrl": "data:image/svg+xml;base64,...",
        "censorBoxes": [
          {
            "x": 100,
            "y": 50,
            "width": 200,
            "height": 40
          }
        ]
      }
    ]
  }
}
```

## SVG Image Features

All images are SVG-based with:
- **Answer text embedded** in the image for visual verification
- **Clean, simple designs** that are recognizable
- **Consistent styling** within each category
- **Data URL encoding** (base64) for portability
- **No external dependencies** (fonts, images, etc.)
- **Reasonable file sizes** (~16KB per file)

## Usage Examples

### Single File Import
1. Open Dashboard
2. Click "Import Contestant"
3. Select `alice-apples.json`
4. Review → Import

### Multi-File Import
1. Open Dashboard
2. Click "Import Contestant"
3. Shift+Click to select all three files
4. Navigate through: Alice → Bobby → Cadence
5. Import all 3 contestants

### Quick Testing
```bash
# Copy files to easy-to-access location
cp scripts/*.json ~/Desktop/

# Or use directly from scripts/
open scripts/alice-apples.json
```

## File Locations

```
scripts/
├── alice-apples.json      (49 lines, ~16KB)
├── bobby-barrels.json     (49 lines, ~16KB)
└── cadence-candles.json   (49 lines, ~16KB)
```

## Censor Box Positioning

Each slide has a censor box strategically placed:
- Covers the answer text in the image
- Does not obscure the visual content
- Typically centered horizontally
- Positioned in lower third of image
- Black rectangle with slight transparency

Example:
```json
"censorBoxes": [
  {
    "x": 100,    // Centered horizontally
    "y": 450,    // Lower third
    "width": 400, // Wide enough to cover text
    "height": 60  // Tall enough for font
  }
]
```

## Testing Scenarios

### Import Flow
- ✅ Import single file
- ✅ Import multiple files at once
- ✅ Navigate between contestants before import
- ✅ Edit contestant names
- ✅ Edit category names
- ✅ Cancel import

### Duel Gameplay
- ✅ Start duel with Alice vs Bobby
- ✅ Verify images display correctly
- ✅ Verify censor boxes hide answers
- ✅ Test with Audience View
- ✅ Verify timer functionality
- ✅ Test skip animation

### Edge Cases
- ✅ Import same file twice (should work)
- ✅ Import with existing contestants
- ✅ Delete and re-import
- ✅ Test with 0, 1, 2, 3+ contestants

## Success Criteria
- Files import successfully without errors
- Images display correctly in all views
- Censor boxes properly hide answers
- Answer text visible when showAnswer=true
- Files can be used for demos
- Team members can quickly test features
- No external dependencies required
- Files committed to repo for team access

## Out of Scope
- PPTX file versions
- Real photos or complex graphics
- Automated generation of test data
- More than 3 test files
- Multiple categories per file
- Internationalization of test data
- Test data for other JSON formats
- Validation tool for JSON files

## Notes
- These files are for **development and testing only**
- Not intended for production game shows
- Override .gitignore to ensure they're committed
- SVG allows for simple, scalable graphics
- Thematic naming helps with organization
- Can serve as examples for users creating their own data
- Consider adding more test files if specific scenarios need coverage
- Could be used for documentation screenshots
- Useful for performance testing (import 100 copies?)

## Future Enhancements
- Script to generate test data programmatically
- Variety pack with 10+ categories
- Test data with edge cases (very long names, special characters)
- Test data with different image sizes/ratios
- Test data with missing fields for error handling tests
