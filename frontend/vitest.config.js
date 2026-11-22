import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Component tests for the client side (Vitest + Testing Library in a simulated browser).
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['src/__tests__/setup.js'],
  },
});
