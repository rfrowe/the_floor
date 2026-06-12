import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi, beforeEach } from 'vitest';
import { createCachesStub, createStorageManagerStub } from './test/cacheStorageStub';

// Mock matchMedia for theme support
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// The PWA register virtual module only exists at build time. main.tsx imports it;
// stub it so any transitive import resolves under Vitest.
vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn(() => vi.fn()),
}));

// jsdom provides neither Cache Storage nor StorageManager; install doubles.
vi.stubGlobal('caches', createCachesStub());

Object.defineProperty(navigator, 'storage', {
  configurable: true,
  writable: true,
  value: createStorageManagerStub(),
});

Object.defineProperty(navigator, 'serviceWorker', {
  configurable: true,
  writable: true,
  value: {
    register: vi.fn(() => Promise.resolve({})),
    ready: Promise.resolve({}),
    addEventListener: vi.fn(),
    controller: null,
  },
});

// Give every test a fresh, empty cache for isolation.
beforeEach(() => {
  vi.stubGlobal('caches', createCachesStub());
});
