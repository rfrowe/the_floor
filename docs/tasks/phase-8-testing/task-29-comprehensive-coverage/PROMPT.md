# Task 29: Comprehensive Unit Test Coverage (95% Target)

## Objective
Achieve 95% test coverage across the entire codebase by writing comprehensive unit and component tests for all untested and under-tested modules.

## Current Coverage Status (as of T+0)
**Overall Coverage: 62.2%** (Baseline from origin/main)

### Coverage by Category:
- **Components**: 62-94% (Good coverage, needs Modal and CategoryImporter improvements)
- **Hooks**: 44% (CRITICAL GAP - useAuthoritativeTimer at 2%, useTimerCommands at 0%)
- **Pages**: 64.6% (Needs improvement in Dashboard, MasterView, and AudienceView edge cases)
- **Services**: 28.6% (CRITICAL GAP - timerSync.ts severely under-tested)
- **Storage**: 71.6% (Moderate gap - needs edge case coverage)
- **Utils**: 97.9% (EXCELLENT - maintain this standard)

### Priority Files (Ordered by Impact):
1. **hooks/useAuthoritativeTimer.ts** - 2.02% coverage (72-396 uncovered)
2. **hooks/useTimerCommands.ts** - 0% coverage (64-179 uncovered)
3. **services/timerSync.ts** - 28.57% coverage (49-250, 268-322 uncovered)
4. **components/CategoryImporter.tsx** - 65.11% coverage (multiple gaps)
5. **components/common/Modal.tsx** - 68.18% coverage (73, 80-96, 111-112 uncovered)
6. **storage/indexedDB.ts** - 69.76% coverage (error handling gaps)
7. **storage/timerState.ts** - 50% coverage (multiple functions untested)
8. **pages/Dashboard.tsx** - 66.33% coverage (edge cases and error paths)
9. **pages/MasterView.tsx** - 81.61% coverage (edge cases)
10. **pages/AudienceView.tsx** - 83.07% coverage (edge cases)

## Acceptance Criteria
- [ ] **Overall coverage ≥ 95%** for statements, branches, functions, and lines
- [ ] All priority files have ≥ 90% coverage
- [ ] All hooks have ≥ 95% coverage (especially timer-related hooks)
- [ ] All services have ≥ 90% coverage
- [ ] All storage modules have ≥ 95% coverage
- [ ] Error paths and edge cases are thoroughly tested
- [ ] All tests pass reliably (`npm test -- --run`)
- [ ] Tests execute quickly (< 10 seconds total)
- [ ] No flaky tests or timing-dependent failures
- [ ] Code builds without errors (`npm run build`)

## Implementation Guidance

### Phase 1: Critical Timer Infrastructure (Highest Priority)

#### 1.1 useAuthoritativeTimer Hook (2% → 95%)
**File**: `src/hooks/useAuthoritativeTimer.ts`

**Testing Strategy**:
```typescript
// useAuthoritativeTimer.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthoritativeTimer } from './useAuthoritativeTimer';

describe('useAuthoritativeTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Timer Initialization', () => {
    it('initializes with correct initial time', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(60));
      expect(result.current.timeRemaining).toBe(60);
      expect(result.current.isRunning).toBe(false);
    });

    it('initializes with zero when no duration provided', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(0));
      expect(result.current.timeRemaining).toBe(0);
    });
  });

  describe('Start/Stop Controls', () => {
    it('starts timer and begins countdown', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(60));

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(59);
    });

    it('stops timer and maintains current time', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(60));

      act(() => {
        result.current.start();
        vi.advanceTimersByTime(5000);
        result.current.stop();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.timeRemaining).toBe(55);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should not advance when stopped
      expect(result.current.timeRemaining).toBe(55);
    });

    it('pauses and resumes without time drift', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(60));

      act(() => {
        result.current.start();
        vi.advanceTimersByTime(10000);
        result.current.pause();
      });

      expect(result.current.timeRemaining).toBe(50);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(50); // No drift

      act(() => {
        result.current.resume();
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.timeRemaining).toBe(40);
    });
  });

  describe('Time Expiration', () => {
    it('stops at zero and does not go negative', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(3));

      act(() => {
        result.current.start();
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isRunning).toBe(false);
    });

    it('calls onExpire callback when time runs out', () => {
      const onExpire = vi.fn();
      const { result } = renderHook(() =>
        useAuthoritativeTimer(2, { onExpire })
      );

      act(() => {
        result.current.start();
        vi.advanceTimersByTime(2000);
      });

      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('does not call onExpire multiple times', () => {
      const onExpire = vi.fn();
      const { result } = renderHook(() =>
        useAuthoritativeTimer(2, { onExpire })
      );

      act(() => {
        result.current.start();
        vi.advanceTimersByTime(5000);
      });

      expect(onExpire).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reset Functionality', () => {
    it('resets to initial duration', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(60));

      act(() => {
        result.current.start();
        vi.advanceTimersByTime(30000);
        result.current.reset();
      });

      expect(result.current.timeRemaining).toBe(60);
      expect(result.current.isRunning).toBe(false);
    });

    it('resets to new duration when provided', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(60));

      act(() => {
        result.current.start();
        vi.advanceTimersByTime(30000);
        result.current.reset(90);
      });

      expect(result.current.timeRemaining).toBe(90);
    });
  });

  describe('Accuracy and Precision', () => {
    it('maintains accuracy over long durations', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(300));

      act(() => {
        result.current.start();

        // Simulate 5 minutes of timer ticks
        for (let i = 0; i < 300; i++) {
          vi.advanceTimersByTime(1000);
        }
      });

      expect(result.current.timeRemaining).toBe(0);
    });

    it('handles sub-second accuracy', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(5));

      act(() => {
        result.current.start();
        vi.advanceTimersByTime(500);
      });

      expect(result.current.timeRemaining).toBeCloseTo(4.5, 1);
    });
  });

  describe('Edge Cases', () => {
    it('handles starting an already running timer', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(60));

      act(() => {
        result.current.start();
        vi.advanceTimersByTime(5000);
        result.current.start(); // Start again
      });

      expect(result.current.timeRemaining).toBe(55);
      expect(result.current.isRunning).toBe(true);
    });

    it('handles stopping an already stopped timer', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(60));

      act(() => {
        result.current.stop();
        result.current.stop();
      });

      expect(result.current.timeRemaining).toBe(60);
    });

    it('handles rapid start/stop cycles', () => {
      const { result } = renderHook(() => useAuthoritativeTimer(60));

      act(() => {
        result.current.start();
        result.current.stop();
        result.current.start();
        result.current.stop();
        result.current.start();
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.timeRemaining).toBe(50);
    });
  });

  describe('Cleanup', () => {
    it('cleans up timer on unmount', () => {
      const { unmount } = renderHook(() => useAuthoritativeTimer(60));

      unmount();

      // Should not throw or cause memory leaks
      expect(true).toBe(true);
    });
  });
});
```

#### 1.2 useTimerCommands Hook (0% → 95%)
**File**: `src/hooks/useTimerCommands.ts`

**Testing Strategy**:
```typescript
// useTimerCommands.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTimerCommands } from './useTimerCommands';

describe('useTimerCommands', () => {
  describe('Command Reception via BroadcastChannel', () => {
    it('listens for START command and starts timer', () => {
      const mockStart = vi.fn();
      const { result } = renderHook(() =>
        useTimerCommands({ start: mockStart, stop: vi.fn(), reset: vi.fn() })
      );

      act(() => {
        // Simulate broadcast message
        const event = new MessageEvent('message', {
          data: { type: 'START', timestamp: Date.now() }
        });
        window.dispatchEvent(event);
      });

      expect(mockStart).toHaveBeenCalled();
    });

    it('listens for STOP command and stops timer', () => {
      const mockStop = vi.fn();
      const { result } = renderHook(() =>
        useTimerCommands({ start: vi.fn(), stop: mockStop, reset: vi.fn() })
      );

      act(() => {
        const event = new MessageEvent('message', {
          data: { type: 'STOP', timestamp: Date.now() }
        });
        window.dispatchEvent(event);
      });

      expect(mockStop).toHaveBeenCalled();
    });

    it('listens for RESET command and resets timer', () => {
      const mockReset = vi.fn();
      const { result } = renderHook(() =>
        useTimerCommands({ start: vi.fn(), stop: vi.fn(), reset: mockReset })
      );

      act(() => {
        const event = new MessageEvent('message', {
          data: { type: 'RESET', duration: 60, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
      });

      expect(mockReset).toHaveBeenCalledWith(60);
    });

    it('ignores invalid commands', () => {
      const mockStart = vi.fn();
      renderHook(() =>
        useTimerCommands({ start: mockStart, stop: vi.fn(), reset: vi.fn() })
      );

      act(() => {
        const event = new MessageEvent('message', {
          data: { type: 'INVALID_COMMAND' }
        });
        window.dispatchEvent(event);
      });

      expect(mockStart).not.toHaveBeenCalled();
    });
  });

  describe('Command Sending', () => {
    it('broadcasts START command', () => {
      const { result } = renderHook(() =>
        useTimerCommands({ start: vi.fn(), stop: vi.fn(), reset: vi.fn() })
      );

      // Mock BroadcastChannel
      const mockPostMessage = vi.fn();
      vi.spyOn(BroadcastChannel.prototype, 'postMessage')
        .mockImplementation(mockPostMessage);

      act(() => {
        result.current.sendStart();
      });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'START' })
      );
    });
  });
});
```

#### 1.3 timerSync Service (28.6% → 95%)
**File**: `src/services/timerSync.ts`

**Focus Areas**:
- BroadcastChannel message handling
- Sync state management
- Error recovery
- Cross-tab synchronization logic
- Message validation and sanitization

### Phase 2: Storage and Data Layer (Priority 2)

#### 2.1 storage/indexedDB.ts (69.76% → 95%)
**Focus**: Error handling, quota exceeded, transaction failures, concurrent access

#### 2.2 storage/timerState.ts (50% → 95%)
**Focus**: State persistence, recovery, corruption handling

#### 2.3 storage/localStorage.ts (80% → 95%)
**Focus**: Complete error path coverage, JSON parsing errors

### Phase 3: Components and UI (Priority 3)

#### 3.1 components/common/Modal.tsx (68.18% → 95%)
**Uncovered Lines**: 73, 80-96, 111-112

**Focus Areas**:
```typescript
// Modal.test.tsx additions needed:
describe('Modal - Additional Coverage', () => {
  it('handles Escape key press to close', async () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose}><div>Content</div></Modal>);

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('prevents close when closeOnOutsideClick is false', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} closeOnOutsideClick={false}>
        <div>Content</div>
      </Modal>
    );

    const backdrop = screen.getByRole('button', { name: /modal backdrop/i });
    await userEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('focuses modal on open for accessibility', () => {
    render(<Modal isOpen onClose={vi.fn()}><div>Content</div></Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveFocus();
  });

  it('traps focus within modal when open', async () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <button>First</button>
        <button>Last</button>
      </Modal>
    );

    const first = screen.getByRole('button', { name: /first/i });
    const last = screen.getByRole('button', { name: /last/i });

    first.focus();
    await userEvent.tab();
    expect(last).toHaveFocus();

    await userEvent.tab();
    expect(first).toHaveFocus(); // Wraps back
  });

  it('restores focus to trigger element on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()}><div>Content</div></Modal>
    );

    rerender(<Modal isOpen={false} onClose={vi.fn()}><div>Content</div></Modal>);

    expect(trigger).toHaveFocus();
    document.body.removeChild(trigger);
  });
});
```

#### 3.2 components/CategoryImporter.tsx (65.11% → 95%)
**Focus**: Error handling, file validation, import edge cases, multi-file import

### Phase 4: Pages and Integration (Priority 4)

#### 4.1 pages/Dashboard.tsx (66.33% → 95%)
**Uncovered Lines**: 47-164, 276-288

**Focus**:
- Reset app error handling
- Empty state rendering
- Keyboard shortcut edge cases
- Selection state management edge cases

#### 4.2 pages/MasterView.tsx (81.61% → 95%)
**Uncovered Lines**: 105-110, 118-146

**Focus**:
- Duel end scenarios
- Timer expiration handling
- Error states

#### 4.3 pages/AudienceView.tsx (83.07% → 95%)
**Uncovered Lines**: 65-84, 144-145

**Focus**:
- Connection loss scenarios
- Sync failure handling
- Display state edge cases

### Phase 5: Additional Hook Coverage

#### 5.1 hooks/useAudienceConnection.ts (78.57% → 95%)
#### 5.2 hooks/useDuelState.ts (81.63% → 95%)
#### 5.3 hooks/useIndexedDB.ts (86.95% → 95%)

## Testing Best Practices

### 1. Mock External Dependencies
```typescript
// Mock BroadcastChannel
vi.mock('BroadcastChannel', () => ({
  BroadcastChannel: vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
}));

// Mock IndexedDB
const mockIDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};
vi.stubGlobal('indexedDB', mockIDB);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);
```

### 2. Test Error Paths
Every function that can throw or fail should have error path tests:
```typescript
it('handles storage quota exceeded error', async () => {
  const error = new DOMException('QuotaExceededError', 'QuotaExceededError');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw error;
  });

  const result = await saveData(largeData);

  expect(result.error).toBe('Storage quota exceeded');
});
```

### 3. Test Edge Cases
- Empty inputs
- Null/undefined values
- Boundary conditions
- Concurrent operations
- Race conditions

### 4. Use Realistic Test Data
```typescript
// fixtures/testData.ts
export const mockContestants = [
  { id: '1', name: 'Alice', category: 'Math', position: 0, eliminated: false },
  { id: '2', name: 'Bob', category: 'Science', position: 1, eliminated: false },
];

export const mockSlides = [
  { id: '1', imageUrl: '/test.jpg', answer: 'Paris', censorBoxes: [] },
];

export const mockDuelState = {
  attacker: mockContestants[0],
  defender: mockContestants[1],
  category: 'Math',
  slides: mockSlides,
  currentSlideIndex: 0,
  timePerPlayer: 60,
  activePlayer: 'attacker',
};
```

### 5. Keep Tests Fast
- Use `vi.useFakeTimers()` for time-based tests
- Mock heavy operations (file I/O, network)
- Avoid unnecessary `waitFor()` calls
- Use synchronous assertions when possible

### 6. Test Accessibility
```typescript
it('has proper ARIA labels', () => {
  render(<Component />);

  expect(screen.getByRole('button')).toHaveAccessibleName('Start Timer');
  expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'polite');
});
```

## Success Criteria

### Coverage Targets (Must Meet All)
- [ ] Overall statements: ≥ 95%
- [ ] Overall branches: ≥ 95%
- [ ] Overall functions: ≥ 95%
- [ ] Overall lines: ≥ 95%

### Per-Module Targets
- [ ] All hooks: ≥ 95% coverage
- [ ] All services: ≥ 90% coverage
- [ ] All storage: ≥ 95% coverage
- [ ] All utils: ≥ 95% coverage (maintain current 97.9%)
- [ ] All components: ≥ 90% coverage
- [ ] All pages: ≥ 85% coverage

### Quality Criteria
- [ ] All tests pass: `npm test -- --run`
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] No flaky tests (run 10 times without failures)
- [ ] Test suite completes in < 10 seconds
- [ ] No console warnings during test runs
- [ ] Code coverage report generated successfully

## Out of Scope
- E2E tests (separate task)
- Performance benchmarking
- Visual regression tests
- Load testing
- Manual testing documentation
- Playwright tests

## Execution Strategy

### Recommended Order
1. **Week 1**: Phase 1 (Timer Infrastructure) - CRITICAL
2. **Week 2**: Phase 2 (Storage Layer)
3. **Week 3**: Phases 3-4 (Components and Pages)
4. **Week 4**: Phase 5 (Hook Coverage) + Polish

### Daily Workflow
1. Run coverage report: `npm test -- --run --coverage`
2. Identify lowest coverage file
3. Write tests to improve coverage by 10-20%
4. Verify tests pass and coverage improves
5. Commit changes
6. Repeat

### Verification Commands
```bash
# Run tests with coverage
npm test -- --run --coverage

# Run tests in watch mode during development
npm test

# Check specific file coverage
npm test -- --coverage src/hooks/useAuthoritativeTimer.ts

# Run only new tests
npm test -- --run useAuthoritativeTimer

# Check build still works
npm run build
```

## Notes
- **Priority order matters**: Timer infrastructure is critical for core functionality
- **Don't sacrifice quality for coverage**: Focus on meaningful tests, not just hitting numbers
- **Test behavior, not implementation**: Tests should verify what code does, not how it does it
- **Coordinate with ongoing development**: Don't break existing functionality
- **Document test fixtures**: Create reusable test data in `src/test/fixtures/`
- **Update this prompt**: As you complete sections, mark them done and update coverage numbers

## References
- Vitest Documentation: https://vitest.dev
- React Testing Library: https://testing-library.com/react
- Testing Library User Event: https://testing-library.com/docs/user-event/intro
- Current test examples: Check `src/**/*.test.{ts,tsx}` for patterns
