# Task 26: End-to-End Tests with Playwright

## Objective
Write end-to-end tests for critical user flows using Playwright to verify the application works correctly as a whole.

## Acceptance Criteria
- [ ] Playwright configured and working with the application
- [ ] Critical paths have E2E test coverage
- [ ] Tests run in headless browser
- [ ] Can import contestants, configure game, and run duels
- [ ] Multi-window/tab testing works (master + audience views)
- [ ] Tests are reliable and don't flake
- [ ] CI-ready (can run in automated environment)
- [ ] Test reports are clear and actionable

## Critical User Flows to Test

### Flow 1: Setup Game
1. Open application (dashboard)
2. Import PPTX file with contestant data
3. Verify contestant appears in list
4. Open game configuration
5. Set time limit to 30 seconds
6. Save configuration
7. Verify config displayed in dashboard

### Flow 2: Start and Run Duel
1. Select two contestants
2. Select category from dropdown
3. Click "Start Duel"
4. Master view opens with first slide and answer
5. Verify timers start counting down
6. Click "Correct" button
7. Verify slide advances and player switches
8. Click "Skip" button
9. Verify answer shows for 3 seconds
10. Continue until one player's time expires
11. Verify winner/loser updated correctly
12. Verify winner inherited loser's category
13. Verify loser marked as eliminated
14. Return to dashboard

### Flow 3: Multi-Window Synchronization
1. Open dashboard in first window
2. Start a duel
3. Open audience view in second window/tab
4. Verify audience view shows correct slide
5. Click "Correct" in master view
6. Verify audience view updates within 500ms
7. Click "Skip" in master view
8. Verify answer appears in audience view
9. Verify both views stay synchronized

### Flow 4: Random Selection
1. Open dashboard with multiple contestants
2. Click "Random Select" button
3. Verify one contestant is randomly selected
4. Click "Random Select" again
5. Verify selection can change

### Flow 5: Edge Cases
- Start duel with last two contestants
- Winner takes all categories
- Try to start duel with < 2 contestants (should fail)
- Refresh page during duel (state persists)
- Close and reopen audience view (reconnects)

## Implementation Guidance
1. Install and configure Playwright:
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. Create test files in `e2e/` directory:
   ```
   e2e/
   ├── setup.spec.ts
   ├── duel.spec.ts
   ├── multi-window.spec.ts
   └── fixtures/
       └── sample-contestant.pptx
   ```

3. Playwright config (`playwright.config.ts`):
   - Base URL: http://localhost:5173
   - Run dev server before tests
   - Headless mode for CI
   - Screenshots on failure
   - Video on first retry

4. Multi-window testing:
   ```typescript
   test('audience view syncs with master view', async ({ context }) => {
     const masterPage = await context.newPage();
     await masterPage.goto('/');

     // Start duel
     await masterPage.click('text=Start Duel');

     const audiencePage = await context.newPage();
     await audiencePage.goto('/audience');

     // Verify sync
     await masterPage.click('text=Correct');
     await expect(audiencePage.locator('.slide')).toHaveText('Slide 2');
   });
   ```

5. File upload testing:
   ```typescript
   test('import PPTX file', async ({ page }) => {
     await page.goto('/');
     const fileInput = page.locator('input[type="file"]');
     await fileInput.setInputFiles('e2e/fixtures/sample-contestant.pptx');
     await expect(page.locator('text=Alice')).toBeVisible();
   });
   ```

6. Timer testing:
   ```typescript
   test('timer counts down', async ({ page }) => {
     await page.goto('/master');
     const timer = page.locator('[data-testid="player1-timer"]');

     const initialTime = await timer.textContent();
     await page.waitForTimeout(2000);
     const laterTime = await timer.textContent();

     expect(parseTime(laterTime)).toBeLessThan(parseTime(initialTime));
   });
   ```

7. Wait strategies:
   - Use `waitForSelector` for elements
   - Use `waitForTimeout` sparingly (prefer waiting for state)
   - Use `waitForLoadState('networkidle')` for page loads

8. Assertions:
   - Verify text content
   - Verify element visibility
   - Verify URL changes
   - Verify localStorage values
   - Take screenshots for visual verification

## Success Criteria
- All critical flows pass end-to-end
- Tests run reliably without flakes
- Multi-window sync tested and working
- Tests catch real integration bugs
- Test execution time < 2 minutes
- Clear error messages when tests fail
- Can run in CI environment
- Video/screenshots available on failure

## Out of Scope
- Visual regression testing
- Performance testing
- Load testing
- Cross-browser testing (start with Chromium only)
- Mobile testing

## Notes
- E2E tests are slower - focus on critical paths only
- Use Playwright's MCP integration if available
- Mock external services if any (none in this app)
- Run E2E tests in CI on every PR
- Keep tests independent (each can run in isolation)
- Use data-testid attributes sparingly (prefer user-facing selectors)
- Reference: https://playwright.dev/docs/intro
- You mentioned Playwright MCP is available - use it for testing!
