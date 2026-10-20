import { expect, test } from '@playwright/test'
import { ADMIN, CUSTOMER, login } from './helpers.js'

test.use({ viewport: { width: 375, height: 700 } })

async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

test('pantallas públicas y de cliente sin scroll horizontal en móvil', async ({ page }) => {
  for (const path of ['/login', '/registro']) {
    await page.goto(path)
    await expectNoHorizontalScroll(page)
  }
  await login(page, CUSTOMER)
  await expect(page.getByRole('article').first()).toBeVisible()
  await expectNoHorizontalScroll(page)
  await page.goto('/perfil')
  await expectNoHorizontalScroll(page)
})

test('pantallas de admin sin scroll horizontal en móvil', async ({ page }) => {
  await login(page, ADMIN)
  for (const path of ['/admin/productos', '/admin/productos/nuevo', '/admin/usuarios']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoHorizontalScroll(page)
  }
})
