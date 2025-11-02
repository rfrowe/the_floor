# Task 28: GitHub Pages Deployment

## Objective
Set up automated deployment to GitHub Pages using GitHub Actions, enabling the application to be hosted and accessible via a public URL for testing and demonstration purposes.

## Acceptance Criteria
- [ ] GitHub Actions workflow configured to build and deploy on push to main
- [ ] Vite base path configured correctly for GitHub Pages subdirectory
- [ ] Build artifacts deployed to `gh-pages` branch
- [ ] Application accessible at `https://<username>.github.io/<repo-name>/`
- [ ] All routes work correctly with React Router on GitHub Pages
- [ ] Assets (images, CSS, JS) load properly from GitHub Pages
- [ ] Workflow includes build and test validation before deployment
- [ ] README.md updated with deployment information and live URL

## Technical Approach

### 1. Vite Configuration
GitHub Pages serves from a subdirectory (`/<repo-name>/`), so Vite needs the correct base path:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/the_floor/', // or process.env.GITHUB_REPOSITORY?.split('/')[1]
  // ... rest of config
});
```

### 2. React Router Configuration
Update router to handle subdirectory base path:

```typescript
// src/main.tsx
<BrowserRouter basename="/the_floor">
  <App />
</BrowserRouter>
```

### 3. GitHub Actions Workflow
Create `.github/workflows/deploy.yml` with:
- Checkout code
- Setup Node.js
- Install dependencies
- Run tests (`npm test -- --run`)
- Run build (`npm run build`)
- Deploy to GitHub Pages

## Implementation Guidance

1. **Configure Vite base path**:
   - Update `vite.config.ts` to set `base: '/the_floor/'`
   - Test locally with `npm run build && npm run preview` to verify assets load

2. **Update React Router**:
   - Add `basename` prop to `BrowserRouter` in `src/main.tsx`
   - Verify all routes work with the base path

3. **Create GitHub Actions workflow** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: "pages"
     cancel-in-progress: false

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         - run: npm ci
         - run: npm run lint
         - run: npm test -- --run
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with:
             path: ./dist

     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/deploy-pages@v4
           id: deployment
   ```

4. **Configure GitHub Pages settings**:
   - Go to repository Settings → Pages
   - Set Source to "GitHub Actions"
   - Note the published URL

5. **Update documentation**:
   - Add deployment section to README.md
   - Include live demo URL
   - Document base path configuration
   - Add troubleshooting tips for deployment issues

6. **Test deployment**:
   - Push to main branch
   - Monitor GitHub Actions workflow
   - Verify site loads at GitHub Pages URL
   - Test all routes and functionality
   - Check browser console for any asset loading errors

## Success Criteria
- Workflow runs successfully on push to main
- All tests pass before deployment
- Application is accessible at GitHub Pages URL
- All routes work (/, /master, /audience)
- Images and assets load correctly
- No console errors related to asset paths
- README includes live demo link
- Deployment happens automatically on every merge to main

## Out of Scope
- Custom domain configuration
- Multiple environment deployments (staging, production)
- Preview deployments for pull requests
- CDN configuration or optimization
- Analytics or monitoring setup
- Continuous deployment to other platforms (Vercel, Netlify, etc.)

## Notes
- GitHub Pages has a 1GB repository size limit
- The application is client-side only, so no server-side setup needed
- `404.html` trick may be needed for SPA routing (copy `index.html` to `404.html`)
- Consider adding a 404 page for invalid routes
- Deployment may take 1-2 minutes after workflow completes
- First deployment requires enabling GitHub Pages in repo settings
- Free GitHub accounts have public repositories only for GitHub Pages
- Test in incognito mode to avoid caching issues during verification
- Remember to update the base path if repository name changes
- LocalStorage data persists per domain, so test data won't transfer between local and GitHub Pages

## Testing Checklist
After deployment, verify:
- [ ] Home page (Dashboard) loads
- [ ] Can import a contestant (PPTX parser works)
- [ ] Can select contestants and start a duel
- [ ] Master View loads and shows duel state
- [ ] Audience View loads and displays correctly
- [ ] All images and slides display properly
- [ ] Timer functionality works
- [ ] Navigation between routes works
- [ ] Browser back/forward buttons work correctly
- [ ] No 404 errors for assets in Network tab
- [ ] No console errors or warnings
