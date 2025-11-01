# Task 24: Unit Tests for Business Logic

## Objective
Write comprehensive unit tests for all business logic, utility functions, type guards, and pure functions throughout the application.

## Acceptance Criteria
- [ ] All utility functions have unit tests
- [ ] Type guards tested with valid and invalid data
- [ ] localStorage abstraction fully tested
- [ ] Duel reducer tested with all actions
- [ ] PPTX parser logic tested (with fixtures)
- [ ] Timer calculations tested for accuracy
- [ ] Edge cases and error conditions covered
- [ ] Test coverage > 80% for business logic
- [ ] All tests pass reliably

## Areas to Test

### 1. Type Guards (from task-04)
- `isValidContestant(obj)`
- `isValidSlide(obj)`
- `isValidDuelState(obj)`
- Test with valid data, invalid data, missing fields, wrong types

### 2. Storage Layer (from task-05)
- `getItem()` - handles missing keys, invalid JSON, localStorage errors
- `setItem()` - handles quota exceeded, serialization errors
- `removeItem()` - works correctly
- Custom hooks return correct data and update state

### 3. PPTX Parser (from task-06)
- Extract images from PPTX correctly
- Extract speaker notes as answers
- Parse censorship box positions and colors
- Handle malformed PPTX files
- Use test fixtures (sample PPTX files)

### 4. Duel Reducer (from task-22)
- All action types produce correct state
- State immutability maintained
- Edge cases: last slide, negative time, etc.
- Invalid actions handled gracefully

### 5. Utility Functions
- Time formatting (seconds → "MM:SS")
- Percentage to pixel calculations for censor boxes
- Random contestant selection
- Category inheritance logic
- Any other helper functions

### 6. Timer Logic (from task-16)
- Countdown accuracy over time
- Pause and resume behavior
- Time expiration detection
- No drift or cumulative errors

## Implementation Guidance
1. Organize tests in `__tests__` directories or `.test.ts` files next to source
2. Use Vitest test runner and matchers
3. Structure tests with AAA pattern:
   - **Arrange**: Set up test data
   - **Act**: Execute function
   - **Assert**: Verify result
4. Use descriptive test names:
   ```typescript
   describe('duelReducer', () => {
     describe('ADVANCE_SLIDE action', () => {
       it('increments currentSlideIndex by 1', () => {
         // test
       });

       it('does not advance past the last slide', () => {
         // test
       });
     });
   });
   ```
5. Mock external dependencies:
   - Mock localStorage for storage tests
   - Mock File API for PPTX parser tests
   - Use test fixtures for data
6. Test error paths:
   - Invalid input
   - Missing data
   - Boundary conditions
7. Aim for high coverage:
   - Use `vitest --coverage` to check
   - Focus on critical business logic
   - Don't obsess over 100% (diminishing returns)
8. Keep tests fast:
   - Unit tests should run in milliseconds
   - No network calls, no real file I/O
   - Use mocks and stubs liberally

## Example Test Structure
```typescript
// src/utils/__tests__/timeFormat.test.ts
import { describe, it, expect } from 'vitest';
import { formatTime } from '../timeFormat';

describe('formatTime', () => {
  it('formats seconds as MM:SS', () => {
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(3661)).toBe('61:01');
  });

  it('handles decimal seconds', () => {
    expect(formatTime(45.7)).toBe('0:45');
  });

  it('handles negative values by clamping to 0', () => {
    expect(formatTime(-10)).toBe('0:00');
  });
});
```

## Success Criteria
- All unit tests pass consistently
- Tests run quickly (< 5 seconds for all unit tests)
- Coverage report shows > 80% for business logic
- Tests catch bugs when code is modified
- Tests serve as documentation for how functions work
- No flaky tests (random failures)

## Out of Scope
- Component tests (task-25)
- E2E tests (task-26)
- Performance benchmarks
- Visual regression tests

## Notes
- Unit tests are the foundation of test pyramid
- Fast feedback loop encourages TDD
- Write tests as you implement features (don't wait until the end)
- Good tests are readable and maintainable
- Mock sparingly - prefer real implementations when simple
- Coordinate with all previous tasks for code to test
