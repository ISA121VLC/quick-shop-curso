import { expect, test } from '@playwright/test'
import { ADMIN, login } from './helpers.js'

test('la API es alcanzable por el origen del frontend', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  expect(await response.json()).toEqual({ status: 'ok' })
})

test('el login por el origen del frontend establece la sesion', async ({ page }) => {
  await login(page, ADMIN)
  const me = await page.request.get('/api/auth/me')
  expect(me.status()).toBe(200)
  expect((await me.json()).email).toBe(ADMIN.email)
})

test('las peticiones de la web van al mismo origen', async ({ page, baseURL }) => {
  const origins = new Set()
  page.on('request', (req) => {
    if (new URL(req.url()).pathname.startsWith('/api/')) origins.add(new URL(req.url()).origin)
  })
  await login(page, ADMIN)
  expect([...origins]).toEqual([new URL(baseURL).origin])
})
