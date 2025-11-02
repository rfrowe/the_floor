# PPTX to JSON Parser

Converts PowerPoint files (exported from Google Slides) to JSON format for The Floor game app.

## Setup

**Prerequisites:** Python 3.10+ and [Poetry](https://python-poetry.org/docs/#installation)

Install dependencies:

```bash
cd scripts
poetry install
```

## Usage

### Direct Python

```bash
cd scripts
poetry run python parse_pptx.py input.pptx output.json --category "Movies"
```

### From Project Root (npm)

```bash
npm run parse:pptx input.pptx output.json -- --category "Movies" --contestant "John"
```

## Arguments

- `input` - Input PPTX file path
- `output` - Output JSON file path
- `--category` (required) - Category name
- `--contestant` (optional) - Contestant name

## Workflow

1. Create slides in Google Slides with images
2. Add speaker notes with answers
3. Add filled rectangles as censor boxes
4. Export as PPTX
5. Run parser: `npm run parse:pptx slides.pptx output.json -- --category "Movies"`
6. Import JSON in the app via CategoryImporter component
