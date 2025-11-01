import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '@pages/Dashboard';
import MasterView from '@pages/MasterView';
import AudienceView from '@pages/AudienceView';
import NotFound from '@pages/NotFound';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/master" element={<MasterView />} />
        <Route path="/audience" element={<AudienceView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
