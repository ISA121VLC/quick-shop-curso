import { defineConfig } from '@playwright/test'

// Requiere el stack levantado (docker compose up --build). La URL se puede cambiar con E2E_BASE_URL.
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    headless: true,
  },
})
