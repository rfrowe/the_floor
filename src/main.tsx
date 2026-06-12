import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import './styles/theme.css';
import App from './App.tsx';

// Register the service worker so the app shell is precached and offline
// navigation works. Sample categories are cached on demand by the offline
// download button (see src/services/offlineCache.ts).
registerSW({
  immediate: true,
  onRegisterError(error) {
    console.error('Service worker registration failed', error);
  },
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
