import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '@pages/Dashboard';
import MasterView from '@pages/MasterView';
import AudienceView from '@pages/AudienceView';
import { ComponentsDemo } from '@pages/ComponentsDemo';
import NotFound from '@pages/NotFound';

describe('App', () => {
  it('renders the Dashboard page by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/master" element={<MasterView />} />
          <Route path="/audience" element={<AudienceView />} />
          <Route path="/components" element={<ComponentsDemo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'The Floor' })).toBeInTheDocument();
  });

  it('renders open audience view button on Dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/master" element={<MasterView />} />
          <Route path="/audience" element={<AudienceView />} />
          <Route path="/components" element={<ComponentsDemo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: 'Open Audience View' })).toBeInTheDocument();
  });
});
