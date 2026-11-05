import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Reset the DOM and browser state after each test to keep cases independent.
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
