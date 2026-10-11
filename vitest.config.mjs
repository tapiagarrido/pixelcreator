import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Las pruebas de componentes declaran `// @vitest-environment jsdom`; la lógica pura corre en node.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{js,jsx}'],
    clearMocks: true
  }
});
