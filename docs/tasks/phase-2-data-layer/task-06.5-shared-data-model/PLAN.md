# JSON Schema-Based Data Model Plan

## Executive Summary

This document proposes refactoring the shared data model (`CensorBox`, `Slide`, `Category`, `Contestant`) to use JSON Schema as the single source of truth. Currently, TypeScript interfaces and Python dataclasses are manually maintained and kept in sync through comments. This approach is error-prone and doesn't scale.

**Benefits:**
- **Single Source of Truth:** One schema definition generates both TypeScript and Python types
- **Automatic Validation:** Built-in JSON validation for runtime data integrity
- **Documentation:** Schema serves as living documentation with descriptions and constraints
- **Type Safety:** Guaranteed synchronization between frontend and backend types
- **IDE Support:** Better autocomplete and inline documentation

## Current State

**TypeScript Types:**
- `/private/tmp/the_floor/src/types/slide.ts` - `CensorBox`, `Slide`
- `/private/tmp/the_floor/src/types/contestant.ts` - `Category`, `Contestant`, helper types

**Python Types:**
- `/private/tmp/the_floor/scripts/parse_pptx.py` - `CensorBox`, `Slide`, `Category` dataclasses

**Problems:**
- Manual synchronization via comments (`SYNC WITH: ...`)
- No runtime validation of data shape
- Duplicate documentation in both languages
- Risk of drift between implementations
- No validation of field constraints (e.g., percentages 0-100)

## Proposed Architecture

### 1. JSON Schema Definition

**Location:** `/private/tmp/the_floor/schemas/game-data.schema.json`

Create a comprehensive JSON Schema (Draft 2020-12) that defines all core data types:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://the-floor.app/schemas/game-data.schema.json",
  "title": "The Floor Game Data Schema",
  "description": "Single source of truth for all game data types",

  "$defs": {
    "CensorBox": {
      "type": "object",
      "title": "Censor Box",
      "description": "Represents a censorship box overlay on a slide image. Position and size are specified as percentages (0-100) relative to the image dimensions.",
      "properties": {
        "x": {
          "type": "number",
          "description": "X position as percentage (0-100) from left edge",
          "minimum": 0,
          "maximum": 100
        },
        "y": {
          "type": "number",
          "description": "Y position as percentage (0-100) from top edge",
          "minimum": 0,
          "maximum": 100
        },
        "width": {
          "type": "number",
          "description": "Width as percentage (0-100) of image width",
          "minimum": 0,
          "maximum": 100
        },
        "height": {
          "type": "number",
          "description": "Height as percentage (0-100) of image height",
          "minimum": 0,
          "maximum": 100
        },
        "color": {
          "type": "string",
          "description": "Color of the censor box (hex or rgba format)",
          "pattern": "^(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\\(.*\\))$"
        }
      },
      "required": ["x", "y", "width", "height", "color"],
      "additionalProperties": false
    },

    "Slide": {
      "type": "object",
      "title": "Slide",
      "description": "Represents a single slide in a category, containing an image, the correct answer, and optional censorship boxes.",
      "properties": {
        "imageUrl": {
          "type": "string",
          "description": "Image data as base64 data URL or blob URL",
          "pattern": "^(data:image/[^;]+;base64,|blob:)"
        },
        "answer": {
          "type": "string",
          "description": "The correct answer for this slide (from speaker notes)"
        },
        "censorBoxes": {
          "type": "array",
          "description": "Censorship boxes to overlay on the image",
          "items": {
            "$ref": "#/$defs/CensorBox"
          },
          "default": []
        }
      },
      "required": ["imageUrl", "answer", "censorBoxes"],
      "additionalProperties": false
    },

    "Category": {
      "type": "object",
      "title": "Category",
      "description": "Represents a category (topic) with a collection of slides for gameplay.",
      "properties": {
        "name": {
          "type": "string",
          "description": "Name of the category",
          "minLength": 1
        },
        "slides": {
          "type": "array",
          "description": "Collection of slides in this category",
          "items": {
            "$ref": "#/$defs/Slide"
          },
          "minItems": 1
        }
      },
      "required": ["name", "slides"],
      "additionalProperties": false
    },

    "Contestant": {
      "type": "object",
      "title": "Contestant",
      "description": "Represents a game show contestant who owns one category. When a contestant wins a duel, they inherit the loser's category (not the one that was played in the duel).",
      "properties": {
        "name": {
          "type": "string",
          "description": "Full name of the contestant (used as unique identifier)",
          "minLength": 1
        },
        "category": {
          "$ref": "#/$defs/Category",
          "description": "The category currently owned by this contestant"
        },
        "wins": {
          "type": "integer",
          "description": "Number of duels won by this contestant",
          "minimum": 0,
          "default": 0
        },
        "eliminated": {
          "type": "boolean",
          "description": "Whether this contestant has been eliminated from the game",
          "default": false
        }
      },
      "required": ["name", "category", "wins", "eliminated"],
      "additionalProperties": false
    }
  }
}
```

### 2. TypeScript Generation

**Tool:** [json-schema-to-typescript](https://www.npmjs.com/package/json-schema-to-typescript) (30k+ weekly downloads, well-maintained)

**Installation:**
```bash
npm install --save-dev json-schema-to-typescript
```

**Generated File Location:** `/private/tmp/the_floor/src/types/generated/game-data.ts`

**Generation Script:** `/private/tmp/the_floor/scripts/generate-types.ts`

```typescript
#!/usr/bin/env tsx
import { compile } from 'json-schema-to-typescript';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

async function generateTypes() {
  const schemaPath = resolve(__dirname, '../schemas/game-data.schema.json');
  const outputPath = resolve(__dirname, '../src/types/generated/game-data.ts');

  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

  // Generate TypeScript types
  const ts = await compile(schema, 'GameData', {
    bannerComment: [
      '/**',
      ' * AUTO-GENERATED FILE - DO NOT EDIT',
      ' * Generated from schemas/game-data.schema.json',
      ' * Run `npm run generate:types` to regenerate',
      ' */',
    ].join('\n'),
    unreachableDefinitions: true, // Include all $defs
    additionalProperties: false,
    strictIndexSignatures: true,
  });

  // Ensure output directory exists
  mkdirSync(resolve(__dirname, '../src/types/generated'), { recursive: true });

  // Write generated types
  writeFileSync(outputPath, ts);
  console.log('✓ TypeScript types generated:', outputPath);
}

generateTypes().catch(console.error);
```

**Output Example:**
```typescript
/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 * Generated from schemas/game-data.schema.json
 * Run `npm run generate:types` to regenerate
 */

/**
 * Represents a censorship box overlay on a slide image...
 */
export interface CensorBox {
  /** X position as percentage (0-100) from left edge */
  x: number;
  /** Y position as percentage (0-100) from top edge */
  y: number;
  // ... etc
}

export interface Slide { /* ... */ }
export interface Category { /* ... */ }
export interface Contestant { /* ... */ }
```

### 3. Python Generation

**Tool:** [datamodel-code-generator](https://github.com/koxudaxi/datamodel-code-generator) (2k+ stars, actively maintained)

**Installation:**
```bash
pip install datamodel-code-generator[http]
# or add to requirements.txt / pyproject.toml
```

**Generated File Location:** `/private/tmp/the_floor/scripts/generated/game_data.py`

**Generation Command:**
```bash
datamodel-codegen \
  --input schemas/game-data.schema.json \
  --input-file-type jsonschema \
  --output scripts/generated/game_data.py \
  --output-model-type pydantic.BaseModel \
  --use-standard-collections \
  --use-schema-description \
  --field-constraints \
  --strict-nullable \
  --target-python-version 3.11
```

**Alternative for Python 3.11+ dataclasses:**
```bash
datamodel-codegen \
  --input schemas/game-data.schema.json \
  --input-file-type jsonschema \
  --output scripts/generated/game_data.py \
  --output-model-type dataclasses.dataclass \
  --use-standard-collections \
  --use-schema-description \
  --field-constraints \
  --target-python-version 3.11
```

**Output Example (Pydantic):**
```python
# AUTO-GENERATED FILE - DO NOT EDIT
# Generated from schemas/game-data.schema.json
# Run `make generate-types` to regenerate

from pydantic import BaseModel, Field, constr, confloat, conint
from typing import List

class CensorBox(BaseModel):
    """
    Represents a censorship box overlay on a slide image...
    """
    x: confloat(ge=0, le=100) = Field(..., description="X position...")
    y: confloat(ge=0, le=100) = Field(..., description="Y position...")
    width: confloat(ge=0, le=100) = Field(..., description="Width...")
    height: confloat(ge=0, le=100) = Field(..., description="Height...")
    color: constr(pattern=r'^(#[0-9a-fA-F]{6}|...)$') = Field(...)

    class Config:
        extra = 'forbid'

class Slide(BaseModel):
    # ...
```

**Output Example (dataclasses with validation):**
```python
# AUTO-GENERATED FILE - DO NOT EDIT
from dataclasses import dataclass
from typing import List

@dataclass
class CensorBox:
    """Represents a censorship box overlay..."""
    x: float  # X position as percentage (0-100) from left edge
    y: float  # Y position as percentage (0-100) from top edge
    width: float  # Width as percentage (0-100) of image width
    height: float  # Height as percentage (0-100) of image height
    color: str  # Color of the censor box (hex or rgba format)
```

### 4. Project Structure Changes

```
the-floor/
├── schemas/                          # NEW: JSON Schema definitions
│   └── game-data.schema.json        # Single source of truth
│
├── scripts/
│   ├── generate-types.ts            # NEW: TypeScript generation script
│   ├── generate-python-types.sh     # NEW: Python generation wrapper
│   ├── generated/                   # NEW: Generated Python types
│   │   ├── __init__.py
│   │   └── game_data.py            # Generated Python classes
│   └── parse_pptx.py               # Updated to import from generated/
│
├── src/
│   └── types/
│       ├── generated/               # NEW: Generated TypeScript types
│       │   └── game-data.ts        # Generated from schema
│       ├── slide.ts                 # DEPRECATED: Re-export from generated
│       └── contestant.ts            # DEPRECATED: Re-export from generated
│
├── package.json                     # Updated with generation scripts
└── Makefile                         # NEW: Convenient generation commands
```

### 5. Build/Development Workflow Integration

#### npm Scripts (package.json)

```json
{
  "scripts": {
    "generate:types": "npm run generate:types:ts && npm run generate:types:py",
    "generate:types:ts": "tsx scripts/generate-types.ts",
    "generate:types:py": "./scripts/generate-python-types.sh",
    "validate:schema": "ajv validate -s schemas/game-data.schema.json -d 'data/**/*.json'",
    "prebuild": "npm run generate:types",
    "predev": "npm run generate:types",
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . && npm run validate:schema"
  },
  "devDependencies": {
    "json-schema-to-typescript": "^13.1.1",
    "ajv-cli": "^5.0.0",
    "tsx": "^4.7.0"
  }
}
```

#### Python Generation Wrapper Script

`/private/tmp/the_floor/scripts/generate-python-types.sh`:

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/../schemas/game-data.schema.json"
OUTPUT_FILE="$SCRIPT_DIR/generated/game_data.py"

echo "Generating Python types from JSON Schema..."

# Check if datamodel-code-generator is installed
if ! command -v datamodel-codegen &> /dev/null; then
    echo "Error: datamodel-code-generator not found"
    echo "Install with: pip install datamodel-code-generator[http]"
    exit 1
fi

# Create output directory
mkdir -p "$SCRIPT_DIR/generated"

# Generate Python types
datamodel-codegen \
  --input "$SCHEMA_FILE" \
  --input-file-type jsonschema \
  --output "$OUTPUT_FILE" \
  --output-model-type pydantic.BaseModel \
  --use-standard-collections \
  --use-schema-description \
  --field-constraints \
  --strict-nullable \
  --target-python-version 3.11

# Add header comment
sed -i '1i# AUTO-GENERATED FILE - DO NOT EDIT\n# Generated from schemas/game-data.schema.json\n# Run `npm run generate:types` to regenerate\n' "$OUTPUT_FILE"

echo "✓ Python types generated: $OUTPUT_FILE"
```

#### Makefile (optional convenience)

`/private/tmp/the_floor/Makefile`:

```makefile
.PHONY: generate-types generate-ts generate-py validate-schema help

help:
	@echo "Available commands:"
	@echo "  make generate-types    - Generate TypeScript and Python types from schema"
	@echo "  make generate-ts       - Generate TypeScript types only"
	@echo "  make generate-py       - Generate Python types only"
	@echo "  make validate-schema   - Validate JSON Schema syntax"

generate-types: generate-ts generate-py

generate-ts:
	npm run generate:types:ts

generate-py:
	npm run generate:types:py

validate-schema:
	npm run validate:schema
```

### 6. Migration Path

#### Phase 1: Setup (1-2 hours)

1. **Create schema directory and initial schema**
   - Create `/private/tmp/the_floor/schemas/game-data.schema.json`
   - Port existing TypeScript interfaces to JSON Schema format
   - Add validation constraints (min/max, patterns, required fields)

2. **Install generation tools**
   ```bash
   npm install --save-dev json-schema-to-typescript ajv-cli tsx
   pip install datamodel-code-generator[http]
   ```

3. **Create generation scripts**
   - Create `scripts/generate-types.ts`
   - Create `scripts/generate-python-types.sh` (make executable)
   - Add npm scripts to `package.json`

4. **Generate initial types**
   ```bash
   npm run generate:types
   ```

5. **Verify generated output**
   - Check `src/types/generated/game-data.ts`
   - Check `scripts/generated/game_data.py`
   - Compare with existing manual types

#### Phase 2: Update Imports (30 minutes)

1. **Update Python script**

   `scripts/parse_pptx.py`:
   ```python
   # OLD:
   # from dataclasses import dataclass
   # @dataclass
   # class CensorBox:
   #     ...

   # NEW:
   from scripts.generated.game_data import (
       CensorBox,
       Slide,
       Category,
   )
   ```

2. **Update TypeScript files**

   `src/types/slide.ts`:
   ```typescript
   /**
    * DEPRECATED: Import from generated types instead
    * @deprecated Use `import { CensorBox, Slide } from '@/types/generated/game-data'`
    */
   export { CensorBox, Slide } from './generated/game-data';
   ```

   `src/types/contestant.ts`:
   ```typescript
   /**
    * DEPRECATED: Import from generated types instead
    * @deprecated Use `import { Category, Contestant } from '@/types/generated/game-data'`
    */
   export { Category, Contestant } from './generated/game-data';

   // Keep helper types that are TypeScript-specific
   export type ContestantInput = Omit<Contestant, 'wins' | 'eliminated'>;
   export type ContestantUpdate = Partial<Omit<Contestant, 'name'>>;
   ```

3. **Update import paths** (if using generated types directly)
   ```typescript
   // Update existing files to import from generated
   import { Slide, Category } from '@/types/generated/game-data';
   ```

#### Phase 3: Testing & Validation (1 hour)

1. **Run full build**
   ```bash
   npm run build
   npm test -- --run
   npm run lint
   ```

2. **Test Python script**
   ```bash
   python scripts/parse_pptx.py --help
   # Test with sample PPTX if available
   ```

3. **Verify type checking**
   - Create test data that violates constraints
   - Ensure TypeScript catches type errors
   - Test Pydantic validation (if using Pydantic)

#### Phase 4: Documentation & Cleanup (30 minutes)

1. **Update README.md**
   - Document schema-first workflow
   - Explain how to add new fields
   - Add schema validation to development checklist

2. **Add pre-commit hook** (optional)
   ```bash
   # .husky/pre-commit or .git/hooks/pre-commit
   npm run generate:types
   git add src/types/generated/ scripts/generated/
   ```

3. **Remove old type definitions** (optional)
   - Can keep `slide.ts` and `contestant.ts` as re-exports for compatibility
   - Or remove entirely and update all imports

#### Phase 5: Continuous Integration

Update CI/CD pipeline to:
1. Generate types before running tests
2. Validate schema syntax
3. Check that generated files are committed (no drift)

```yaml
# Example GitHub Actions
- name: Generate types
  run: npm run generate:types

- name: Verify no changes
  run: git diff --exit-code src/types/generated/ scripts/generated/
```

## Benefits Analysis

### 1. Single Source of Truth
- **Before:** 2 separate definitions (TypeScript + Python) with manual sync
- **After:** 1 JSON Schema generates both, guaranteed consistency

### 2. Validation
- **Before:** No runtime validation of data shape
- **After:** Built-in JSON Schema validation + Pydantic runtime validation

Example validation in Python:
```python
from scripts.generated.game_data import CensorBox
from pydantic import ValidationError

try:
    box = CensorBox(x=150, y=50, width=10, height=10, color="#000")
    # ValidationError: x must be <= 100
except ValidationError as e:
    print(e)
```

### 3. Documentation
- **Before:** Comments duplicated in both languages
- **After:** Schema descriptions appear in generated code + IDE tooltips

### 4. IDE Support
- Generated types include JSDoc comments
- Inline documentation from schema descriptions
- Better autocomplete for nested objects

### 5. Extensibility
- Easy to add new fields (update schema, regenerate)
- Can add custom validation rules in schema
- Can generate types for other languages (Go, Rust, etc.)

### 6. Data Validation in Production
- Can validate JSON files against schema at runtime
- Can validate API responses
- Can validate localStorage data before hydration

Example TypeScript validation:
```typescript
import Ajv from 'ajv';
import schema from '@/../schemas/game-data.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

function validateSlide(data: unknown): data is Slide {
  return validate({ Slide: data });
}
```

## Considerations & Trade-offs

### Pros
- ✅ Eliminates manual synchronization
- ✅ Adds runtime validation capabilities
- ✅ Self-documenting code
- ✅ Industry-standard approach
- ✅ Scales to additional languages/platforms

### Cons
- ❌ Adds build step dependency
- ❌ Generated files must be committed (or generated in CI)
- ❌ Slightly more complex initial setup
- ❌ JSON Schema learning curve for team members

### Mitigation Strategies

1. **Generated files in git:** Commit generated files to avoid requiring all developers to have Python tooling
2. **Documentation:** Include clear examples in README of how to modify schema
3. **Type-only changes:** Can still create TypeScript helper types (like `ContestantInput`) in separate files
4. **Gradual adoption:** Re-export from existing files maintains backward compatibility

## Recommendations

### Immediate Actions (Phase 2)
1. Create JSON Schema in `schemas/game-data.schema.json`
2. Set up TypeScript generation (`json-schema-to-typescript`)
3. Set up Python generation (`datamodel-code-generator`)
4. Add generation to `prebuild` and `predev` scripts
5. Update imports in `parse_pptx.py`

### Future Enhancements
1. **Runtime validation** - Add JSON Schema validation to data loading
2. **Schema versioning** - Use `$id` and versioning for schema evolution
3. **Additional types** - Add `GameState`, `DuelResult`, etc. to schema
4. **OpenAPI integration** - If building an API, reuse schemas in OpenAPI spec
5. **Documentation site** - Generate documentation from schema using tools like `json-schema-for-humans`

## Tools Reference

| Tool | Purpose | Installation | Stars |
|------|---------|--------------|-------|
| [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) | Generate TS types | `npm install -D json-schema-to-typescript` | 2.8k |
| [datamodel-code-generator](https://github.com/koxudaxi/datamodel-code-generator) | Generate Python types | `pip install datamodel-code-generator` | 2.6k |
| [ajv](https://ajv.js.org/) | JSON Schema validator | `npm install ajv` | 13k |
| [ajv-cli](https://github.com/ajv-validator/ajv-cli) | CLI for validation | `npm install -D ajv-cli` | 300+ |

## Example Workflow

### Adding a New Field

Developer wants to add `difficulty: number` to `Slide`:

1. **Update schema** (`schemas/game-data.schema.json`):
   ```json
   {
     "$defs": {
       "Slide": {
         "properties": {
           "difficulty": {
             "type": "integer",
             "description": "Difficulty rating (1-5)",
             "minimum": 1,
             "maximum": 5,
             "default": 3
           }
         }
       }
     }
   }
   ```

2. **Regenerate types**:
   ```bash
   npm run generate:types
   ```

3. **Update code** - TypeScript and Python now have the new field:
   ```typescript
   const slide: Slide = {
     imageUrl: "data:...",
     answer: "Paris",
     censorBoxes: [],
     difficulty: 4  // New field, fully typed
   };
   ```

4. **Validation works automatically**:
   ```python
   Slide(
     imageUrl="data:...",
     answer="Paris",
     censorBoxes=[],
     difficulty=10  # ValidationError: must be <= 5
   )
   ```

That's it! No manual synchronization needed.

## Conclusion

Adopting JSON Schema as the single source of truth for shared data models is a best practice that eliminates manual synchronization, adds validation capabilities, and improves documentation. The initial setup cost is modest (2-3 hours) and the ongoing maintenance burden is actually reduced compared to manual synchronization.

This approach scales well as the project grows and provides a solid foundation for future enhancements like API documentation, runtime validation, and multi-platform support.

**Recommended for Phase 2 implementation.**
