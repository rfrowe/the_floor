# The Floor

[![Deploy to Production](https://github.com/rfrowe/the_floor/actions/workflows/deploy.yml/badge.svg)](https://github.com/rfrowe/the_floor/actions/workflows/deploy.yml)
[![Cloudflare Pages](https://img.shields.io/badge/demo-live-orange?logo=cloudflare)](https://the-floor.pages.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7+-646CFF?logo=vite)](https://vite.dev/)
[![Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9F18?logo=vitest)](https://vitest.dev/)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

A web-based trivia game show application inspired by the TV show "The Floor". Features dual-screen gameplay, synchronized timers, and a 7x7 grid floor with territory visualization.

**Live Demo:** [https://the-floor.pages.dev/](https://the-floor.pages.dev/)

## Table of Contents

- [What is The Floor?](#what-is-the-floor)
- [Features](#features)
- [Live Demo](#live-demo)
- [Getting Started](#getting-started)
- [How to Play](#how-to-play)
- [Creating Categories](#creating-categories)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [About the Codebase](#about-the-codebase)
- [Contributing](#contributing)
- [License](#license)

## What is The Floor?

The Floor is a trivia game show where contestants stand on a grid floor, each owning one or more territories. Contestants duel in head-to-head trivia battles - the winner claims the loser's territory. The game continues until one contestant controls the entire floor.

This web application recreates the game show experience with:
- **Master control interface** - Game master controls duels, timers, and game flow
- **Full-screen audience display** - Clean, TV-ready display for players and spectators
- **Grid floor visualization** - 7x7 grid showing territory ownership in real-time
- **Synchronized state** - Master and audience views stay perfectly in sync

## Features

### Core Gameplay
- 🎮 **Dual-screen architecture** - Master control + audience display
- ⏱️ **Synchronized timers** - <100ms latency between views using BroadcastChannel
- 🗺️ **Grid floor display** - Territory visualization with real-time updates
- 🎯 **Censor box overlays** - Hide answers until reveal
- 📊 **Territory tracking** - Winners inherit losers' territories
- ⚡ **Quick Duel** - One-off exhibition match between any two players (including eliminated ones) in any library category; only the winner's win count changes — no territory, elimination, or category-ownership effects

### User Experience
- 🎨 **Dark mode** - System preference detection + manual toggle
- ⌨️ **Keyboard shortcuts** - Fast game master controls
- 📱 **Responsive design** - Works on desktop and tablet
- 🎪 **Live-tested** - Zero crashes during live gameplay

### Content Management
- 📦 **PPTX import** - Convert Google Slides to game categories
- 🖼️ **Image optimization** - Automatic 4K resize and JPEG optimization
- 💾 **IndexedDB storage** - Handle large image datasets
- 📦 **Sample categories** - 20+ demo categories included

## Live Demo

**Try it yourself:** [https://the-floor.pages.dev/](https://the-floor.pages.dev/)

**Quick start:**
1. Open the Dashboard
2. Browse Sample Categories and load a few
3. Add contestants (or use sample categories in contestant creation)
4. Select two contestants and start a duel
5. Open Audience View in a separate window/screen (press **V** from Dashboard)
6. Play the game using Master View controls

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Python 3.9+ with Poetry (optional, for PPTX parsing)

### Installation

```bash
# Clone the repository
git clone https://github.com/rfrowe/the_floor.git
cd the_floor

# Install dependencies
npm install

# Start development server
npm run dev
# → Open http://localhost:5173/
```

### Quick Development

```bash
# Run tests
npm test

# Run tests once (before commits)
npm test -- --run

# Build for production
npm run build

# Preview production build
npm run preview
```

## How to Play

### Setup Phase
1. **Import Categories** - Upload PPTX files or use sample categories
2. **Add Contestants** - Create contestants and assign them categories
3. **Configure Grid** - Set grid dimensions (default 7x7)
4. **Open Views** - Launch Audience View on second screen/window

### Game Flow
1. **Select Contestants** - Click two contestants (attacker & defender)
2. **Start Duel** - Launches Master View with duel controls
3. **Play Slides** - Slides appear on Audience View, timer counts down
4. **Mark Correct/Skip** - Game master controls from Master View
5. **Territory Transfer** - Winner claims loser's territory
6. **Continue** - Select next duel participants
7. **Win Condition** - Last contestant standing wins

### Quick Duel (Exhibition)
Click **Quick Duel** on the Dashboard to run a one-off match outside the main game: pick any two existing players (eliminated players allowed) and any category from the library. It plays with the normal duel mechanics, but winning only adds to the winner's win count — there is no territory transfer, elimination, or category-ownership change. Both views show a Quick Duel banner while it's active.

### Views Explained

**Dashboard** - Game master control center
- Contestant management
- Category browsing
- Duel setup
- Grid configuration

**Master View** - Duel control interface
- Correct/Skip buttons
- Timer display
- Current slide preview
- Category info

**Audience View** - Full-screen display
- Large slide images
- Countdown timer
- Player names and categories
- Answer reveals (on skip/timeout)

## Creating Categories

### Using Sample Categories

The app includes 20+ sample categories ready to use:
1. Click **Manage Categories**
2. Click **Import Category**
3. Click **Browse Sample Categories**
4. Select categories and click **Load**

### From Google Slides (PPTX)

Convert your own Google Slides presentations:

```bash
# Install Python dependencies (one-time)
cd scripts
poetry install
cd ..

# Parse a PPTX file
npm run parse:pptx input.pptx output.json -- --category "Your Category Name"

# Import the JSON file via Dashboard → Manage Categories → Import
```

**Slide format:**
- **Image**: Main slide content (will be shown to players)
- **Speaker notes**: The answer (hidden behind censor boxes)
- **Rectangle shapes**: Censor box positions (hide parts of the image)

**Tips:**
- Use high-quality images (parser outputs 4K)
- Put answers in speaker notes
- Add rectangle shapes to censor text in images
- Use descriptive category names

## Tech Stack

- **React 19** - UI library with concurrent features
- **TypeScript 5.9** - Strict mode for maximum type safety
- **Vite 7** - Fast dev server and optimized builds
- **Vitest 4** - Lightning-fast unit testing
- **React Testing Library** - Component testing best practices
- **React Router DOM 7** - Client-side routing
- **BroadcastChannel API** - Cross-window synchronization
- **IndexedDB** - Large file storage (slide images)
- **Python + python-pptx** - PowerPoint parsing
- **Cloudflare Pages** - Production hosting and PR previews

## Project Structure

```
the-floor/
├── src/
│   ├── pages/              # Main application views
│   │   ├── Dashboard.tsx   # Game master control center
│   │   ├── MasterView.tsx  # Duel control interface
│   │   └── AudienceView.tsx # Full-screen display
│   ├── components/         # Reusable UI components
│   │   ├── duel/           # Duel setup and controls
│   │   ├── slide/          # Slide viewer with censor boxes
│   │   ├── contestant/     # Contestant cards and management
│   │   ├── category/       # Category management
│   │   └── common/         # Shared UI components
│   ├── hooks/              # Custom React hooks
│   │   ├── useDuelState.ts           # Game state management
│   │   ├── useAuthoritativeTimer.ts  # Timer synchronization
│   │   └── useContestants.ts         # Contestant data
│   ├── storage/            # Data persistence
│   │   ├── indexedDB.ts    # Large file storage
│   │   └── localStorage.ts # App preferences
│   ├── utils/              # Helper functions
│   └── types/              # TypeScript interfaces
├── scripts/                # Python PPTX parser
├── docs/                   # Development documentation
│   ├── tasks/              # Task definitions and planning
│   └── status-reports/     # Development session logs
├── public/categories/      # Sample category data
└── .github/workflows/      # CI/CD pipelines
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server (hot reload)
npm run build            # Production build
npm run preview          # Preview production build locally
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format with Prettier

# Testing
npm test                 # Run tests (watch mode)
npm test -- --run        # Run tests once (CI mode)
npm run test:coverage    # Generate coverage report
npm run test:ui          # Open Vitest UI

# PPTX Parsing
npm run parse:pptx       # Parse single PPTX file
npm run parse:pptx:batch # Batch convert multiple files
```

## Development

### Code Quality

The project enforces strict quality standards:

**TypeScript Strict Mode:**
```typescript
// All code must handle null/undefined explicitly
const item = array[0];  // Type: Item | undefined
if (item) {
  // Safe to use item here
}

// No implicit any, all types must be explicit
function process(data: Category): Contestant {
  // Implementation
}
```

**Testing Requirements:**
- All business logic has unit tests
- Components have integration tests
- 498 tests currently passing
- Must maintain 100% pass rate

**Commit Requirements:**
1. `npm run lint` - must pass
2. `npm test -- --run` - all tests pass
3. `npm run build` - successful build

See [CLAUDE.md](./CLAUDE.md) for complete development guidelines.

### Local Development Workflow

```bash
# Start dev server
npm run dev

# Make changes (hot reload automatically)

# Run tests
npm test

# Check linting
npm run lint

# Build to verify
npm run build
```

## Testing

```bash
# Watch mode (automatically reruns on changes)
npm test

# Single run (use before commits)
npm test -- --run

# With coverage report
npm run test:coverage
# Open coverage/index.html in browser

# Interactive UI
npm run test:ui
```

**Current Status:** 498/515 tests passing

## Deployment

### Production (Cloudflare Pages)

Automatic deployment on every push to `main`:

1. ✅ Run linter (must pass)
2. ✅ Run test suite (must pass)
3. ✅ Build production bundle
4. ✅ Deploy to Cloudflare Pages
5. ✅ Create release tag

**Production URL:** [https://the-floor.pages.dev/](https://the-floor.pages.dev/)

### PR Preview Deployments

Every pull request automatically gets a preview deployment:

- **Preview URL:** `https://{branch-name}.the-floor.pages.dev`
- **GitHub Integration:** "View deployment" button on PR
- **Auto-update:** Rebuilds on every commit
- **Auto-cleanup:** Expires 30 days after PR closes

### Setup Instructions

For repository maintainers:

1. Create Cloudflare Pages project named "the-floor"
2. Add GitHub repository secrets:
   - `CLOUDFLARE_API_TOKEN` - API token from Cloudflare
   - `CLOUDFLARE_ACCOUNT_ID` - Account ID from Cloudflare dashboard
3. Push to main or create a PR - automatic deployment!

## Roadmap

See [docs/tasks/](./docs/tasks/) for complete task breakdown.

### Completed (Phase 1-8 + enhancements)
- ✅ Full game implementation (27 core tasks)
- ✅ Timer synchronization system
- ✅ Dark mode support
- ✅ Grid floor visualization
- ✅ Category management system
- ✅ Sample categories integration
- ✅ Comprehensive test coverage (498 tests)
- ✅ Production deployment with CI/CD

### In Progress (Phase 9)
- [ ] Sound effects for game actions
- [ ] Audience view theming
- [ ] Enhanced winning animations
- [ ] Single-combat exhibition mode
- [ ] Finale best-of-three format

### Planned (Phase 10+)
- [ ] **Phase 10**: Critical bug fixes from live demo (5 tasks)
- [ ] **Phase 11**: Philips Hue integration for "Randomizer" effect (5 tasks)
- [ ] **Phase 12**: LLM-powered category generation studio (8 tasks)

**Total roadmap:** 61 tasks (29 complete, 32 planned)

See [POST_DEMO_TASK_PLANNING_SUMMARY.md](./docs/tasks/POST_DEMO_TASK_PLANNING_SUMMARY.md) for details.

## About the Codebase

### Built with AI Assistance

This project was built using [Claude Code](https://claude.ai/claude-code) as an experiment in AI-assisted development. The results exceeded expectations:

- **Timeline:** 20 working hours (Nov 1-2, 2025)
- **Result:** Complete playable application with 498 passing tests
- **Live demo:** Zero crashes, rave reception
- **Velocity:** 10-14x faster than traditional estimates

**What made it work:**
- Clear task decomposition (61 documented tasks)
- Strict TypeScript and comprehensive testing
- Architectural discipline from day one
- Test-first development approach

### Documentation

The development process is extensively documented as a case study:

**For learning how this was built:**
- [Development Timeline](./docs/status-reports/README.md) - Chronological session logs
- [MVP Complete Report](./docs/status-reports/2025-11-02-T+13h31m-final-playable.md) - The 20-hour story
- [Task Definitions](./docs/tasks/) - All 61 tasks with acceptance criteria

**For contributors:**
- [CLAUDE.md](./CLAUDE.md) - Development guidelines and standards
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Current state and recent changes

The comprehensive documentation serves as both project history and a case study in AI-assisted development from conception through live validation.

## Contributing

Contributions welcome! Before contributing:

1. Read [CLAUDE.md](./CLAUDE.md) for development standards
2. Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current state
3. Review [docs/tasks/](./docs/tasks/) for planned work
4. Ensure all checks pass:
   ```bash
   npm run lint        # Linting
   npm test -- --run   # Tests
   npm run build       # Build
   ```

## License

[CC BY-NC-SA 4.0](./LICENSE) (Creative Commons Attribution-NonCommercial-ShareAlike 4.0)

You are free to:
- Share and adapt the code
- Use for non-commercial purposes

You must:
- Give appropriate credit
- Share adaptations under the same license
- Not use for commercial purposes

---

**Built with** [Claude Code](https://claude.ai/claude-code) | **Documentation:** [Complete Development Journey](./docs/status-reports/2025-11-02-T+19h46m-post-demo-complete.md)
