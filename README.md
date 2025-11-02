# The Floor

A modern React + TypeScript application built with Vite.

## Overview

"The Floor" is a web application built with:
- React 19+ with TypeScript for type-safe component development
- Vite for fast development and optimized production builds
- Vitest and React Testing Library for comprehensive testing
- React Router DOM v7+ for client-side routing

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

## Getting Started

### Installation

1. Clone the repository (if applicable)
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Testing

Run the test suite:

```bash
npm test
```

For watch mode during development:

```bash
npm test -- --watch
```

### Building for Production

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Code Quality

Run ESLint to check code quality:

```bash
npm run lint
```

Auto-fix linting errors:

```bash
npm run lint:fix
```

Format code with Prettier:

```bash
npm run format
```

Check formatting without modifying files:

```bash
npm run format:check
```

### PPTX Parsing

Parse PowerPoint files exported from Google Slides to extract game data.

**Prerequisites:**

1. **Install Poetry** (Python package manager):
   ```bash
   # macOS/Linux
   curl -sSL https://install.python-poetry.org | python3 -

   # Windows (PowerShell)
   (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
   ```

   Or visit: https://python-poetry.org/docs/#installation

2. **Install Python dependencies:**
   ```bash
   cd scripts
   poetry install
   cd ..
   ```

**Usage:**

Parse PowerPoint files exported from Google Slides:

```bash
npm run parse:pptx input.pptx output.json -- --category "Category Name"
```

**Note:** The output parameter is optional - if omitted, it defaults to the input filename with a `.json` extension.

**What the parser extracts:**
- **Slide images** - Automatically resized to 4K resolution (3840x2160 max) and converted to JPEG (quality 85) for optimal display on large screens while managing file size
- **Speaker notes** - Used as answers for each slide
- **Censor boxes** - Rectangle shapes on slides that will overlay censored content
- **Cropping** - Respects any image cropping applied in the PPTX

**Storage:** Contestant data is stored in IndexedDB (not localStorage) to support large datasets with multiple contestants and high-resolution images.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix linting errors
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check formatting without changes
- `npm run preview` - Preview production build locally
- `npm run parse:pptx <input.pptx> <output.json> -- --category "Category Name"` - Parse PPTX file to JSON

## Project Structure

```
the-floor/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Generic components (buttons, cards, etc.)
│   │   ├── contestant/  # Contestant-related components
│   │   ├── duel/        # Duel-related components
│   │   └── slide/       # Slide display components
│   ├── pages/           # Route components (Dashboard, MasterView, AudienceView)
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript interfaces and types
│   ├── utils/           # Utility functions
│   ├── storage/         # localStorage abstraction
│   ├── assets/          # Static assets
│   ├── App.tsx          # Root component with router
│   ├── App.test.tsx     # App component tests
│   ├── setupTests.ts    # Test configuration
│   └── main.tsx         # Application entry point
├── docs/tasks/          # Task definitions
├── public/              # Public static files
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies and scripts
```

### Routes
- `/` - Dashboard (game master control center)
- `/master` - Master View (duel control interface)
- `/audience` - Audience View (display for projector/screen)

## Deployment

### Live Demo

The application is deployed and accessible at:
**https://rfrowe.github.io/the_floor/**

### GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

**How it works:**
1. Push to the `main` branch triggers the deployment workflow
2. The workflow runs tests and builds the application
3. If all checks pass, the build artifacts are deployed to GitHub Pages
4. The site is available at `https://<username>.github.io/the_floor/`

**Configuration:**
- **Vite base path**: Configured to `/the_floor/` for GitHub Pages subdirectory
- **React Router basename**: Set to `/the_floor` to handle routing correctly
- **SPA routing support**: Uses 404.html redirect trick for client-side routing
- **Workflow**: `.github/workflows/deploy.yml` automates build, test, and deployment

**Manual Deployment:**
You can also trigger deployment manually from the GitHub Actions tab using the "workflow_dispatch" option.

**Local Preview:**
To test the production build locally with the correct base path:
```bash
npm run build
npm run preview
```

**Note:** LocalStorage and IndexedDB data is domain-specific, so data saved locally won't transfer to the GitHub Pages deployment.

## Tech Stack

- **React 19.1+** - UI library
- **TypeScript 5.9+** - Type safety
- **Vite 7+** - Build tool and dev server
- **Vitest 4+** - Unit testing framework
- **React Testing Library** - Component testing utilities
- **React Router DOM 7+** - Client-side routing
- **ESLint** - Code linting with TypeScript, React, and accessibility rules
- **Prettier** - Code formatting

## Development Notes

### TypeScript Configuration
This project enforces **maximum type safety** with strict TypeScript settings:

- **Strict mode** with all strict flags enabled
- **Strict null checks** - all null/undefined must be handled explicitly
- **noUncheckedIndexedAccess** - array/object access returns `T | undefined`
- **exactOptionalPropertyTypes** - distinguishes `undefined` from missing properties
- **noImplicitReturns** - all code paths must return a value
- **noPropertyAccessFromIndexSignature** - requires bracket notation for dynamic keys

This means:
- Array access requires null checks: `const item = array[0]; if (item) { ... }`
- Optional chaining (`?.`) and nullish coalescing (`??`) should be used liberally
- Avoid type assertions (`as`) - use type guards and type narrowing instead
- Never use `any` - prefer `unknown` and narrow the type appropriately

### Path Aliases
The project uses TypeScript path mapping for clean imports:

```typescript
// Instead of: import { Button } from '../../../components/ui/Button'
import { Button } from '@components/ui/Button'

// Available aliases:
// @/           - src root
// @components/ - src/components
// @hooks/      - src/hooks
// @utils/      - src/utils
// @types/      - src/types
// @models/     - src/models
// @services/   - src/services
// @contexts/   - src/contexts
// @pages/      - src/pages
// @assets/     - src/assets
```

### Testing & Development
- Tests use jsdom environment for DOM simulation
- All test utilities from jest-dom are available globally
- Hot Module Replacement (HMR) is enabled for fast development
- See `CLAUDE.md` for detailed development guidelines
