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

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Project Structure

```
the-floor/
├── src/
│   ├── assets/          # Static assets
│   ├── App.tsx          # Main application component
│   ├── App.test.tsx     # App component tests
│   ├── setupTests.ts    # Test configuration
│   └── main.tsx         # Application entry point
├── public/              # Public static files
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies and scripts
```

## Tech Stack

- **React 19.1+** - UI library
- **TypeScript 5.9+** - Type safety
- **Vite 7+** - Build tool and dev server
- **Vitest 4+** - Unit testing framework
- **React Testing Library** - Component testing utilities
- **React Router DOM 7+** - Client-side routing
- **ESLint** - Code linting

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

### Testing & Development
- Tests use jsdom environment for DOM simulation
- All test utilities from jest-dom are available globally
- Hot Module Replacement (HMR) is enabled for fast development
- See `CLAUDE.md` for detailed development guidelines
