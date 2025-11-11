import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '@pages/Dashboard';
import MasterView from '@pages/MasterView';
import AudienceView from '@pages/AudienceView';
import { ComponentsDemo } from '@pages/ComponentsDemo';
import NotFound from '@pages/NotFound';
import './App.css';

function App() {
  // Use base path from Vite config (set at build time)
  // GitHub Pages: /the_floor/, Cloudflare Pages: /
  const basename = import.meta.env.BASE_URL;

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
