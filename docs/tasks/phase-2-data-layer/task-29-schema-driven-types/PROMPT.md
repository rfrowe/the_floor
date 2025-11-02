# Task 29: Schema-Driven Type Generation

## Objective
Extract a single source of truth for data models using JSON Schema (or TypeBox/Zod), then generate both TypeScript interfaces and Python dataclasses from this schema to eliminate manual synchronization between the two codebases.

## Acceptance Criteria
- [ ] Single schema file(s) define all shared data structures (CensorBox, Slide, Category, Contestant, etc.)
- [ ] TypeScript types automatically generated from schema
- [ ] Python dataclasses automatically generated from schema
- [ ] Schema includes validation rules (constraints, formats, ranges)
- [ ] npm script to regenerate TypeScript types from schema
- [ ] Python script to regenerate Python types from schema
- [ ] Both generated files include warnings not to edit manually
- [ ] Existing TypeScript code still compiles with generated types
- [ ] Python PPTX parser still works with generated dataclasses
- [ ] Schema is well-documented with descriptions and examples
- [ ] Generation process documented in README

## Current State

The project currently maintains duplicate type definitions:
- **TypeScript**: `src/types/slide.ts`, `src/types/contestant.ts`, `src/types/game.ts`, `src/types/duel.ts`
- **Python**: `scripts/parse_pptx.py` (dataclasses for CensorBox, Slide, Category)

These must be manually kept in sync, as noted by comments like:
```typescript
// IMPORTANT: Keep in sync with Python types in scripts/parse_pptx.py
```

## Schema Format Options

### Option 1: JSON Schema (Recommended)
**Pros**: Industry standard, extensive tooling, language-agnostic, good for validation
**Cons**: More verbose, separate from TypeScript code

**Tools**:
- TypeScript generation: `json-schema-to-typescript`
- Python generation: `datamodel-code-generator` or custom generator
- Validation: `ajv` (TypeScript), `jsonschema` (Python)

### Option 2: TypeBox
**Pros**: TypeScript-native, compile-time and runtime validation, generates JSON Schema
**Cons**: TypeScript-centric, requires Node.js for Python generation

**Tools**:
- `@sinclair/typebox` for schema definition
- Export to JSON Schema for Python generation

### Option 3: Zod
**Pros**: Excellent TypeScript DX, runtime validation, popular in React ecosystem
**Cons**: Primarily runtime, requires transformation for JSON Schema/Python

**Tools**:
- `zod` for schema definition
- `zod-to-json-schema` for conversion
- Python generation from JSON Schema

## Implementation Guidance

### Recommended Approach: JSON Schema + Code Generators

1. **Create schema definitions** in `schemas/` directory:
   ```
   schemas/
   ├── censor-box.schema.json
   ├── slide.schema.json
   ├── category.schema.json
   ├── contestant.schema.json
   ├── game-config.schema.json
   └── duel-state.schema.json
   ```

2. **Example schema** (`schemas/censor-box.schema.json`):
   ```json
   {
     "$schema": "http://json-schema.org/draft-07/schema#",
     "$id": "https://the-floor.app/schemas/censor-box.schema.json",
     "title": "CensorBox",
     "description": "Represents a censorship box overlay on a slide image",
     "type": "object",
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
         "description": "Color of the censor box (hex format)",
         "pattern": "^#[0-9A-Fa-f]{6}$"
       }
     },
     "required": ["x", "y", "width", "height", "color"],
     "additionalProperties": false
   }
   ```

3. **Install dependencies**:
   ```bash
   # TypeScript generation
   npm install --save-dev json-schema-to-typescript

   # Python generation
   pip install datamodel-code-generator
   ```

4. **Create generation scripts**:

   **`scripts/generate-types.ts`** (TypeScript):
   ```typescript
   import { compile } from 'json-schema-to-typescript';
   import { readFileSync, writeFileSync } from 'fs';
   import { glob } from 'glob';

   async function generateTypes() {
     const schemas = glob.sync('schemas/*.schema.json');

     for (const schemaPath of schemas) {
       const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
       const ts = await compile(schema, schema.title, {
         bannerComment: '/* eslint-disable */\n/**\n * AUTO-GENERATED - DO NOT EDIT\n * Generated from ' + schemaPath + '\n * Run `npm run generate:types` to regenerate\n */',
       });

       const outputPath = `src/types/generated/${schema.title}.ts`;
       writeFileSync(outputPath, ts);
     }
   }

   generateTypes();
   ```

   **`scripts/generate_python_types.py`**:
   ```python
   #!/usr/bin/env python3
   import subprocess
   from pathlib import Path

   schemas_dir = Path("schemas")
   output_file = Path("scripts/generated_types.py")

   # Generate using datamodel-code-generator
   subprocess.run([
       "datamodel-codegen",
       "--input-file-type", "jsonschema",
       "--input", str(schemas_dir),
       "--output", str(output_file),
       "--field-constraints",
       "--use-standard-collections",
   ])

   # Add header comment
   with open(output_file, 'r+') as f:
       content = f.read()
       f.seek(0, 0)
       f.write('"""\n')
       f.write('AUTO-GENERATED - DO NOT EDIT\n')
       f.write('Generated from JSON schemas in schemas/\n')
       f.write('Run `python scripts/generate_python_types.py` to regenerate\n')
       f.write('"""\n\n' + content)
   ```

5. **Add npm scripts** to `package.json`:
   ```json
   {
     "scripts": {
       "generate:types": "tsx scripts/generate-types.ts",
       "generate:types:python": "python scripts/generate_python_types.py",
       "generate:types:all": "npm run generate:types && npm run generate:types:python"
     }
   }
   ```

6. **Update existing code** to use generated types:
   - Replace manual type definitions with imports from generated files
   - Update Python script to import from `generated_types.py`
   - Ensure all tests still pass

7. **Add validation** (optional but recommended):
   - Use `ajv` in TypeScript for runtime validation of imported data
   - Use `pydantic` or `jsonschema` in Python for validation

8. **Document the workflow**:
   - Add section to README explaining schema-driven approach
   - Document how to modify schemas
   - Add pre-commit hook suggestion to regenerate types

## Success Criteria
- Single schema file defines each data structure
- Running `npm run generate:types:all` regenerates both TypeScript and Python types
- Generated TypeScript types match or improve upon manual definitions
- Generated Python dataclasses work with existing PPTX parser
- All existing tests pass with generated types
- Schema includes validation constraints where appropriate
- No manual synchronization required between TypeScript and Python
- Clear documentation for future schema changes

## Out of Scope
- Runtime validation in production (optional enhancement)
- Schema versioning and migration system
- API contract validation (if backend is added later)
- GraphQL schema generation
- Database schema generation
- Schema-driven UI form generation

## Notes
- **Breaking Change**: This will modify the structure of `src/types/` directory
- Consider using a phased approach: start with CensorBox and Slide, then expand
- Ensure generated code is excluded from linting (`eslint-disable` comments)
- Add `src/types/generated/` to `.gitignore` if you want to generate on build, OR commit generated files for easier development
- **Recommended**: Commit generated files and regenerate them in CI to verify schemas are up to date
- If schema validation fails at runtime (imported JSON), provide clear error messages
- Consider adding schema validation to the PPTX import process
- Python dataclass generation may require additional type annotations for complex types
- Test with Python 3.10+ for better dataclass features (slots, kw_only)
- JSON Schema $ref can be used to reference other schemas and avoid duplication

## Migration Strategy

1. **Phase 1**: Create schemas for existing types (CensorBox, Slide, Category)
2. **Phase 2**: Set up generation scripts and verify output
3. **Phase 3**: Update TypeScript code to use generated types
4. **Phase 4**: Update Python code to use generated types
5. **Phase 5**: Remove manual type definitions
6. **Phase 6**: Add validation and documentation

## Alternative: Minimal Approach

If full code generation is too complex, consider a simpler approach:
1. Define types in TypeScript using Zod
2. Export Zod schemas for runtime validation
3. Manually generate JSON Schema using `zod-to-json-schema`
4. Use that JSON Schema for Python generation only
5. Keep TypeScript types as the source of truth

This reduces tooling complexity while still eliminating manual Python/TypeScript sync.

## Dependencies to Install

**TypeScript**:
- `json-schema-to-typescript` (if using JSON Schema)
- `ajv` (for validation)
- `tsx` (for running TypeScript scripts)

**Python**:
- `datamodel-code-generator` (for Python generation)
- `pydantic` (optional, for validation)

## Reference Examples

Similar projects using schema-driven types:
- **OpenAPI/Swagger**: Generates client and server types from OpenAPI spec
- **GraphQL**: Generates types from GraphQL schema
- **Prisma**: Generates types from database schema
- **tRPC**: Shares types between client and server

## Testing Strategy

1. **Unit tests**: Verify generated types have correct properties
2. **Integration tests**: Ensure PPTX parser works with generated types
3. **Type tests**: Use `tsd` or `expect-type` to verify TypeScript types
4. **Schema validation tests**: Test that valid/invalid data is correctly validated
5. **Regeneration test**: CI job that regenerates types and verifies no changes
