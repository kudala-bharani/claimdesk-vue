import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: { allowedHosts: ['terminal.local'] },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
    clearMocks: true,
    setupFiles: ['tests/setup.ts'],
  },
})
