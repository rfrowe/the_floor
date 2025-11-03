# The Floor - Technical Specification

## 1. Application Overview

A React + TypeScript web application implementing "The Floor" game show format for local gameplay with a game master and audience. The application runs entirely in the browser with localStorage for state persistence.

## 2. Technical Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: React Context API + useReducer for complex game state
- **Storage**: localStorage API for game state persistence
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier with automatic formatting
- **E2E Testing**: Playwright (available via MCP)

## 3. Core Features

### 3.1 Data Import System
- Import contestant data from PPTX files exported from Google Slides
- Each slide contains:
  - Image (with white background fallback for transparency)
  - Speaker notes containing the correct answer
  - Optional censorship boxes
- Censorship boxes must preserve:
  - Position (relative to image)
  - Size (relative to image)
  - Color (to blend with background)
- Support batch processing of multiple PPTX files for different contestants

### 3.2 Game Master Dashboard
- Display all contestants with:
  - Name
  - Category (current owned category)
  - Win count
  - Visual indication when eliminated (greyed out)
- Controls:
  - **Random select button**: Randomly selects one non-eliminated player
  - Select two contestants for a duel
  - Choose which contestant's category/slides to use
  - Configure time limit per game (default 45 seconds per player)
  - Start duel button

### 3.3 Duel Interface - Master View (Control Window)
- Display current slide's correct answer (from speaker notes)
- Two primary controls:
  - **"Correct" button**: Transfers control to opponent, stops current player's clock
  - **"Skip" button**: Shows answer on audience view for 3 seconds (counted against skipping player), then skipping player continues with next slide
- Visual indicators:
  - Which player's turn is active
  - Real-time countdown of both players' remaining time
- Automatic duel end when a player reaches 0 seconds

### 3.4 Duel Interface - Audience View (Display Window)
- Full-screen slide display:
  - Proper aspect ratio preservation (letterboxing allowed, no cropping)
  - Censorship boxes overlaid at correct positions with proper colors
  - White background fallback for transparent images
- Top bar showing:
  - Both players' names
  - Remaining time for each player
  - Active player indicator
- When answer is skipped:
  - Display correct answer in center of top bar for 3 seconds
  - Smooth transitions between slides

### 3.5 Game State Management
- Contestant roster (name, categories, slides, wins, eliminated status)
- Current duel state (two contestants, active player, time remaining, current slide index)
- Game configuration (time limits)
- Persist to localStorage automatically
- Handle browser refresh gracefully

## 4. Data Models

### 4.1 Contestant
```typescript
interface Contestant {
  id: string;
  name: string;
  category: Category; // Current category owned (replaced when winning duels)
  wins: number;
  eliminated: boolean;
}
```

Note: Contestants own exactly one category at a time. When a contestant wins a duel, they replace their current category with **the unplayed category** (the category that was NOT selected for the duel slides). Specifically: if the duel used contestant1's category, the winner inherits contestant2's category; if the duel used contestant2's category, the winner inherits contestant1's category. This ensures the winner always receives the category that wasn't played, regardless of who won or lost.

### 4.2 Category
```typescript
interface Category {
  id: string;
  name: string; // e.g., "80s Movies", "State Capitals"
  slides: Slide[];
}
```

### 4.3 Slide
```typescript
interface Slide {
  id: string;
  imageUrl: string; // base64 or blob URL
  answer: string;
  censorBoxes: CensorBox[];
}
```

### 4.4 CensorBox
```typescript
interface CensorBox {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  color: string; // hex or rgba
}
```

### 4.5 DuelState
```typescript
interface DuelState {
  contestant1: Contestant;
  contestant2: Contestant;
  activePlayer: 1 | 2;
  timeRemaining1: number; // seconds
  timeRemaining2: number; // seconds
  currentSlideIndex: number;
  selectedCategory: Category; // which category's slides are being used
  isSkipAnimationActive: boolean;
}
```

### 4.6 GameConfig
```typescript
interface GameConfig {
  timePerPlayer: number; // seconds, default 45
}
```

## 5. User Flows

### 5.1 Setup Flow
1. Import contestant data (PPTX → parsed data structure)
2. Review/edit contestant list
3. Configure game settings (time limits)
4. Save to localStorage

### 5.2 Duel Flow
1. **(Optional)** GM uses random select button to randomly choose one non-eliminated contestant
2. GM selects two contestants from dashboard
3. GM chooses which category to use (from the categories owned by either contestant)
4. GM opens audience view in separate window/tab
5. GM starts duel
6. First challenger begins (their clock runs)
7. GM observes player's verbal answer and clicks "Correct" or "Skip"
8. On correct: Control transfers to opponent immediately
9. On skip: Answer shows on audience view for 3 seconds, then skipping player continues with next slide (no control transfer)
10. Continue until one player's time reaches 0
11. Winner gains opponent's territory (wins++)
12. **Winner inherits the losing player's category (the one NOT played in the duel)**
13. Loser marked as eliminated
14. Return to dashboard

### 5.3 Multi-Window Architecture
- **Dashboard/Master view**: Primary control window (e.g., `localhost:5173/`)
- **Audience view**: Separate route for display (e.g., `localhost:5173/audience`)
- State synchronization options:
  - localStorage + storage events for cross-window updates
  - BroadcastChannel API for real-time updates between windows

## 6. Non-Functional Requirements

### 6.1 Performance
- Smooth 60fps animations and transitions
- Responsive UI even with 100 contestants
- Efficient re-renders using React.memo and useMemo where appropriate

### 6.2 Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode support
- Focus management

### 6.3 Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- Minimum viewport: 1280x720 for audience view

### 6.4 Code Quality
- 80%+ test coverage for business logic
- Component tests for all interactive elements
- E2E tests for critical paths (setup, duel flow)
- ESLint strict mode with TypeScript rules
- Prettier for consistent formatting

## 7. Assumptions & Constraints

- Single device/browser for game master controls (no multi-user authentication)
- All game data stored locally (no backend/database)
- PPTX parsing done client-side or via external tool
- Censorship box coordinates must be manually specified or extracted from PPTX shapes
- No undo/redo functionality for game master actions
- No replay or history viewing (focus on live gameplay)
- Game master is trusted to make correct/skip decisions based on verbal player answers
- When a duel is played using a specific category, the winner inherits the unplayed category (whichever of the two contestants' categories was NOT used for the duel)

## 8. Out of Scope (Future Enhancements)

- Backend/database for multi-device access
- Automated answer verification
- Audio/video recording of duels
- Statistical analysis and reporting
- Mobile-responsive design for audience view
- Real-time multiplayer over network
