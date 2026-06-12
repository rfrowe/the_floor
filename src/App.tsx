import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '@pages/Dashboard';
import MasterView from '@pages/MasterView';
import AudienceView from '@pages/AudienceView';
import { ComponentsDemo } from '@pages/ComponentsDemo';
import NotFound from '@pages/NotFound';
import { populateCategoriesStore } from '@utils/migrateCategories';
import { createLogger } from '@/utils/logger';
import './App.css';

const log = createLogger('App');

function App() {
  // Use base path from Vite config (set at build time)
  // GitHub Pages: /the_floor/, Cloudflare Pages: /
  const basename = import.meta.env.BASE_URL;

  // One-shot, idempotent backfill so every contestant has a categoryId pointing at a
  // categories-store row. This keeps categoryId authoritative, which the unified
  // ID-based duel-state hydration relies on. Safe to run on every mount/window:
  // populateCategoriesStore() early-returns when nothing needs migrating.
  useEffect(() => {
    void (async () => {
      try {
        const result = await populateCategoriesStore();
        if (result.categoriesCreated > 0 || result.contestantsUpdated > 0) {
          log.debug('Category migration ran', result);
        }
      } catch (error) {
        log.error('Category migration failed:', error);
      }
    })();
  }, []);

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/master" element={<MasterView />} />
        <Route path="/audience" element={<AudienceView />} />
        <Route path="/components" element={<ComponentsDemo />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
