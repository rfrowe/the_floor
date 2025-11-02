# Task 24.5: Python PPTX Parser Unit Tests

## Objective
Add comprehensive unit tests for the Python PPTX parser (`scripts/parse_pptx.py`) to validate image extraction, speaker note parsing, and shape detection.

## Background
During Task 24 code review, it was identified that the Python PPTX parser has zero test coverage. This is a **high-risk area** because:
- Processes external file input (user-uploaded PPTX files)
- Complex parsing logic (images, speaker notes, shape positions)
- Critical to application functionality (all game content comes through this parser)

## Acceptance Criteria
- [ ] Python test framework (pytest) installed and configured
- [ ] Test fixtures created (sample PPTX files)
- [ ] Image extraction tested with valid PPTX files
- [ ] Speaker notes parsing tested
- [ ] Censor box (shape) detection tested with various colors
- [ ] Error handling tested for malformed PPTX files
- [ ] Test coverage > 80% for parse_pptx.py
- [ ] All Python tests pass
- [ ] Documentation updated with test instructions

## Areas to Test

### 1. Image Extraction
- Extract images from PPTX slides correctly
- Handle slides with multiple images
- Handle slides with no images
- Verify base64 data URI format
- Test different image formats (PNG, JPEG, GIF)

### 2. Speaker Notes Parsing
- Extract speaker notes as answers
- Handle slides with no speaker notes (empty string)
- Handle multi-line speaker notes
- Trim whitespace from notes
- Handle Unicode characters in notes

### 3. Censor Box Detection
- Parse shape positions (x, y, width, height)
- Convert PowerPoint units to percentages
- Detect shape fill colors
- Handle shapes with no fill (skip them)
- Handle multiple shapes per slide
- Verify color format (#RRGGBB)

### 4. Error Handling
- Malformed PPTX files (corrupted ZIP)
- Missing slides
- Invalid XML structure
- Permission errors reading files
- Empty PPTX files

### 5. Output Format
- Verify JSON structure matches schema
- Category name included in output
- Slides array structure correct
- All fields present and correct types

## Implementation Guidance

### 1. Install pytest
```bash
pip install pytest pytest-cov
```

### 2. Create Test Directory Structure
```
tests/
├── __init__.py
├── test_parse_pptx.py
└── fixtures/
    ├── valid-simple.pptx       # 1 slide, 1 image, 1 note, 1 box
    ├── valid-complex.pptx      # Multiple slides, images, boxes
    ├── no-notes.pptx           # Slides without speaker notes
    ├── no-shapes.pptx          # Slides without censor boxes
    ├── multiple-images.pptx    # Slide with multiple images
    ├── malformed.pptx          # Corrupted file
    └── expected/
        ├── valid-simple.json
        └── valid-complex.json
```

### 3. Test Structure Example
```python
# tests/test_parse_pptx.py
import pytest
import json
import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'scripts'))

from parse_pptx import (
    extract_images_from_slide,
    extract_speaker_notes,
    detect_censor_boxes,
    parse_pptx_file
)

FIXTURES_DIR = Path(__file__).parent / 'fixtures'


class TestImageExtraction:
    def test_extract_single_image(self):
        """Test extracting a single image from a slide"""
        # Arrange
        pptx_path = FIXTURES_DIR / 'valid-simple.pptx'

        # Act
        result = extract_images_from_slide(pptx_path, slide_index=0)

        # Assert
        assert len(result) == 1
        assert result[0].startswith('data:image/')
        assert 'base64,' in result[0]

    def test_extract_multiple_images(self):
        """Test extracting multiple images from a slide"""
        pptx_path = FIXTURES_DIR / 'multiple-images.pptx'
        result = extract_images_from_slide(pptx_path, slide_index=0)

        assert len(result) >= 2
        for img in result:
            assert img.startswith('data:image/')

    def test_no_images_returns_empty_list(self):
        """Test slide with no images returns empty list"""
        pptx_path = FIXTURES_DIR / 'no-images.pptx'
        result = extract_images_from_slide(pptx_path, slide_index=0)

        assert result == []


class TestSpeakerNotes:
    def test_extract_speaker_notes(self):
        """Test extracting speaker notes from slide"""
        pptx_path = FIXTURES_DIR / 'valid-simple.pptx'
        result = extract_speaker_notes(pptx_path, slide_index=0)

        assert isinstance(result, str)
        assert len(result) > 0

    def test_no_speaker_notes_returns_empty_string(self):
        """Test slide without notes returns empty string"""
        pptx_path = FIXTURES_DIR / 'no-notes.pptx'
        result = extract_speaker_notes(pptx_path, slide_index=0)

        assert result == ''

    def test_speaker_notes_trimmed(self):
        """Test speaker notes are trimmed of whitespace"""
        pptx_path = FIXTURES_DIR / 'whitespace-notes.pptx'
        result = extract_speaker_notes(pptx_path, slide_index=0)

        assert result == result.strip()
        assert not result.startswith(' ')
        assert not result.endswith(' ')


class TestCensorBoxes:
    def test_detect_censor_boxes(self):
        """Test detecting censor boxes from shapes"""
        pptx_path = FIXTURES_DIR / 'valid-simple.pptx'
        result = detect_censor_boxes(pptx_path, slide_index=0)

        assert len(result) >= 1
        box = result[0]
        assert 'x' in box
        assert 'y' in box
        assert 'width' in box
        assert 'height' in box
        assert 'color' in box

    def test_censor_box_values_valid(self):
        """Test censor box values are in valid ranges"""
        pptx_path = FIXTURES_DIR / 'valid-simple.pptx'
        result = detect_censor_boxes(pptx_path, slide_index=0)

        for box in result:
            assert 0 <= box['x'] <= 100
            assert 0 <= box['y'] <= 100
            assert 0 <= box['width'] <= 100
            assert 0 <= box['height'] <= 100
            assert box['color'].startswith('#')
            assert len(box['color']) == 7  # #RRGGBB

    def test_no_shapes_returns_empty_list(self):
        """Test slide with no shapes returns empty list"""
        pptx_path = FIXTURES_DIR / 'no-shapes.pptx'
        result = detect_censor_boxes(pptx_path, slide_index=0)

        assert result == []


class TestFullParser:
    def test_parse_valid_pptx(self):
        """Test parsing a valid PPTX file end-to-end"""
        pptx_path = FIXTURES_DIR / 'valid-simple.pptx'
        output_path = FIXTURES_DIR / 'output.json'
        category_name = 'Test Category'

        # Act
        parse_pptx_file(pptx_path, output_path, category_name)

        # Assert
        assert output_path.exists()

        with open(output_path) as f:
            data = json.load(f)

        assert data['name'] == category_name
        assert 'slides' in data
        assert len(data['slides']) > 0

        slide = data['slides'][0]
        assert 'imageUrl' in slide
        assert 'answer' in slide
        assert 'censorBoxes' in slide

        # Cleanup
        output_path.unlink()

    def test_output_matches_expected(self):
        """Test parser output matches expected JSON"""
        pptx_path = FIXTURES_DIR / 'valid-simple.pptx'
        expected_path = FIXTURES_DIR / 'expected' / 'valid-simple.json'
        output_path = FIXTURES_DIR / 'output-test.json'

        parse_pptx_file(pptx_path, output_path, 'Movies')

        with open(output_path) as f:
            actual = json.load(f)
        with open(expected_path) as f:
            expected = json.load(f)

        # Compare structure (not exact base64 data)
        assert actual['name'] == expected['name']
        assert len(actual['slides']) == len(expected['slides'])

        output_path.unlink()

    def test_malformed_pptx_raises_error(self):
        """Test malformed PPTX file raises appropriate error"""
        pptx_path = FIXTURES_DIR / 'malformed.pptx'
        output_path = FIXTURES_DIR / 'output.json'

        with pytest.raises(Exception):
            parse_pptx_file(pptx_path, output_path, 'Movies')

    def test_missing_file_raises_error(self):
        """Test missing file raises appropriate error"""
        pptx_path = FIXTURES_DIR / 'nonexistent.pptx'
        output_path = FIXTURES_DIR / 'output.json'

        with pytest.raises(FileNotFoundError):
            parse_pptx_file(pptx_path, output_path, 'Movies')


class TestEdgeCases:
    def test_empty_pptx(self):
        """Test PPTX with no slides"""
        pptx_path = FIXTURES_DIR / 'empty.pptx'
        output_path = FIXTURES_DIR / 'output.json'

        parse_pptx_file(pptx_path, output_path, 'Empty')

        with open(output_path) as f:
            data = json.load(f)

        assert data['slides'] == []
        output_path.unlink()

    def test_unicode_in_notes(self):
        """Test speaker notes with Unicode characters"""
        pptx_path = FIXTURES_DIR / 'unicode-notes.pptx'
        result = extract_speaker_notes(pptx_path, slide_index=0)

        assert '©' in result or '™' in result or '→' in result

    def test_very_large_pptx(self):
        """Test PPTX with many slides (performance test)"""
        pptx_path = FIXTURES_DIR / 'large-100-slides.pptx'
        output_path = FIXTURES_DIR / 'output.json'

        import time
        start = time.time()
        parse_pptx_file(pptx_path, output_path, 'Large')
        elapsed = time.time() - start

        assert elapsed < 30  # Should complete in under 30 seconds

        with open(output_path) as f:
            data = json.load(f)

        assert len(data['slides']) == 100
        output_path.unlink()
```

### 4. Run Tests
```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=scripts --cov-report=html tests/

# Run specific test class
pytest tests/test_parse_pptx.py::TestImageExtraction

# Run with verbose output
pytest -v tests/
```

### 5. Creating Test Fixtures

Use PowerPoint to create test PPTX files:

**valid-simple.pptx:**
1. Create 1 slide
2. Add 1 image
3. Add speaker note: "The Matrix"
4. Add 1 rectangle shape with red fill (#FF0000)

**valid-complex.pptx:**
1. Create 3 slides
2. Each slide: 1 image, speaker note, 2-3 colored shapes

**malformed.pptx:**
1. Create a text file with random content
2. Rename to .pptx (will be invalid ZIP)

### 6. Update Documentation

Add to `README.md`:
```markdown
## Running Python Tests

The PPTX parser has Python unit tests using pytest.

### Install test dependencies:
```bash
pip install pytest pytest-cov
```

### Run tests:
```bash
# All tests
pytest tests/

# With coverage
pytest --cov=scripts tests/

# Coverage report
pytest --cov=scripts --cov-report=html tests/
open htmlcov/index.html
```

### Test fixtures:
Test PPTX files are located in `tests/fixtures/`. To add new fixtures:
1. Create PPTX file in PowerPoint
2. Save to `tests/fixtures/`
3. Add corresponding test case in `tests/test_parse_pptx.py`
```

## Success Criteria
- [ ] All Python tests pass consistently
- [ ] Coverage > 80% for parse_pptx.py
- [ ] Test fixtures cover common and edge cases
- [ ] Malformed PPTX files handled gracefully
- [ ] Documentation updated with test instructions
- [ ] Tests run in < 10 seconds
- [ ] CI/CD integration possible (future)

## Out of Scope
- Integration tests with TypeScript code (covered in Task 26)
- Performance optimization
- Support for additional PowerPoint features
- Refactoring parser implementation

## Notes
- Python tests are independent of TypeScript tests
- Use `pytest` conventions (test_*.py files, test_* functions)
- Keep test fixtures small (< 1MB each)
- Mock external dependencies if needed
- Focus on parser logic, not python-pptx library internals

## Dependencies
- Task 24: Unit Tests (parent task)
- Python 3.8+
- pytest
- pytest-cov (optional, for coverage reports)
- Existing parse_pptx.py implementation

## Estimated Time
2-3 hours:
- 30 min: Setup pytest and create test structure
- 60 min: Create test fixtures (PPTX files)
- 45 min: Write test cases
- 15 min: Run tests and achieve coverage goals
- 15 min: Update documentation

## Priority
**MEDIUM** - Important for production readiness but doesn't block other tasks.

The parser works in production but lacks test coverage. This task adds safety net for future changes.
