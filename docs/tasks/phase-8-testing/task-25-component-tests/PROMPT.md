# Task 25: Component Tests with React Testing Library

## Objective
Write component tests for all React components using React Testing Library, focusing on user interactions and rendering behavior.

## Acceptance Criteria
- [ ] All major components have test coverage
- [ ] Tests verify rendering with different props
- [ ] Interactive behaviors tested (clicks, form input, etc.)
- [ ] Accessibility checked (ARIA roles, labels)
- [ ] User-centric queries used (getByRole, getByLabelText)
- [ ] No implementation details tested (internal state)
- [ ] Tests are maintainable and readable
- [ ] All component tests pass reliably

## Components to Test

### Layout Components (task-07)
- **Button**: Renders variants, handles click, disabled state
- **Card**: Renders children, optional sections
- **Modal**: Opens/closes, click outside, Escape key
- **Container, Spinner**: Basic rendering

### Contestant Components (task-08)
- **ContestantCard**: Shows contestant data, selected state, eliminated state
- Click handler works, hover states

### Slide Components (task-09)
- **SlideViewer**: Displays image, renders censor boxes, handles missing image

### Dashboard Components (tasks 10-13)
- **Dashboard**: Renders contestant list, empty state
- **ContestantList**: Selection behavior, random select
- **DuelSetup**: Category selection, validation, start duel
- **GameConfig**: Form input, save/cancel, validation

### Duel Components (tasks 14-16, 19-20)
- **MasterView**: Displays duel info, answer, controls
- **DuelControls**: Correct/skip buttons, disabled states
- **ClockBar**: Shows player info, time, active indicator
- **SkipAnimation**: Answer display timing (may need timer mocks)

## React Testing Library Best Practices

### 1. User-Centric Queries (Priority Order)
```typescript
// ✅ Good: Use accessible queries
getByRole('button', { name: /start duel/i })
getByLabelText(/time per player/i)
getByText(/alice/i)

// ❌ Avoid: Implementation details
getByTestId('start-button')
querySelector('.button-primary')
```

### 2. User Interactions
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('selects contestant when clicked', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();

  render(<ContestantCard contestant={alice} onSelect={onSelect} />);

  await user.click(screen.getByRole('button', { name: /alice/i }));

  expect(onSelect).toHaveBeenCalledWith(alice);
});
```

### 3. Async Behavior
```typescript
it('shows success message after save', async () => {
  render(<GameConfig />);

  await user.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
  });
});
```

## Implementation Guidance
1. Test file structure:
   ```
   src/
   ├── components/
   │   ├── Button.tsx
   │   └── Button.test.tsx
   ```

2. Render with necessary providers:
   ```typescript
   function renderWithProviders(ui: React.ReactElement) {
     return render(
       <GameProvider>
         <BrowserRouter>{ui}</BrowserRouter>
       </GameProvider>
     );
   }
   ```

3. Mock external dependencies:
   - localStorage (use vi.mock)
   - React Router navigation
   - Context values if needed
   - Window APIs (BroadcastChannel, etc.)

4. Test structure:
   ```typescript
   describe('ContestantCard', () => {
     it('renders contestant name and category', () => {
       render(<ContestantCard contestant={alice} />);
       expect(screen.getByText('Alice')).toBeInTheDocument();
       expect(screen.getByText('State Capitals')).toBeInTheDocument();
     });

     it('shows eliminated state visually', () => {
       const eliminated = { ...alice, eliminated: true };
       render(<ContestantCard contestant={eliminated} />);
       const card = screen.getByRole('article');
       expect(card).toHaveClass('eliminated'); // or check aria-label
     });
   });
   ```

5. Accessibility testing:
   ```typescript
   it('is keyboard accessible', async () => {
     render(<Modal isOpen onClose={vi.fn()} />);
     expect(screen.getByRole('dialog')).toHaveFocus();

     await user.keyboard('{Escape}');
     expect(onClose).toHaveBeenCalled();
   });
   ```

6. Form testing:
   ```typescript
   it('validates time input', async () => {
     render(<GameConfig />);

     const input = screen.getByLabelText(/time per player/i);
     await user.clear(input);
     await user.type(input, '5'); // too low

     expect(screen.getByText(/minimum 10 seconds/i)).toBeInTheDocument();
   });
   ```

## Success Criteria
- All interactive components tested
- Tests verify user-facing behavior
- Accessibility features are validated
- Tests don't break on implementation changes
- Test output is readable and helpful
- No flaky or brittle tests
- Tests run quickly (< 30 seconds total)

## Out of Scope
- Unit tests for logic (task-24)
- E2E tests (task-26)
- Visual regression tests
- Performance testing

## Notes
- Follow "test the interface, not the implementation"
- If testing is hard, the component might be too complex
- Use @testing-library/user-event for interactions
- Mock sparingly - test with real components when possible
- Coordinate with all component tasks for what to test
- Reference: https://testing-library.com/docs/react-testing-library/intro/
