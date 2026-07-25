/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves this project site from https://<user>.github.io/countries-quiz/
  // so assets must be referenced relative to that sub-path. This also applies in dev,
  // keeping dev and prod paths identical (use import.meta.env.BASE_URL for asset URLs).
  base: '/countries-quiz/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
    },
  },
})
