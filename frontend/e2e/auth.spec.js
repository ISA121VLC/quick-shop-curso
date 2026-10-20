import { expect, test } from '@playwright/test'
import { ADMIN, CUSTOMER, login, uniqueId } from './helpers.js'

test('registro de un cliente nuevo y login posterior', async ({ page }) => {
  const email = `nuevo${uniqueId()}@test.com`
  await page.goto('/registro')
  await page.getByLabel('Nombre completo').fill('Cliente Nuevo')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill('Valida123!')
  await page.getByLabel('Confirmar contraseña').fill('Valida123!')
  await page.getByRole('button', { name: 'Registrarse' }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  await login(page, { email, password: 'Valida123!' })
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cliente Nuevo' })).toBeVisible()
})

test('registro con contraseñas distintas muestra error en línea', async ({ page }) => {
  await page.goto('/registro')
  await page.getByLabel('Nombre completo').fill('Ana')
  await page.getByLabel('Email').fill('ana@test.com')
  await page.getByLabel('Contraseña', { exact: true }).fill('Valida123!')
  await page.getByLabel('Confirmar contraseña').fill('Otra1234!')
  await page.getByRole('button', { name: 'Registrarse' }).click()
  await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible()
})

test('login con credenciales erróneas muestra error', async ({ page }) => {
  await login(page, { email: CUSTOMER.email, password: 'Incorrecta1!' }, { expectSuccess: false })
  await expect(page.getByRole('alert')).toContainText('Credenciales inválidas')
})

test('cliente: login, sesión persistente tras recargar y logout', async ({ page }) => {
  await login(page, CUSTOMER)
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  const storage = await page.evaluate(() => [localStorage.length, sessionStorage.length])
  expect(storage).toEqual([0, 0])
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
})

test('admin: login redirige a /admin/productos', async ({ page }) => {
  await login(page, ADMIN)
  await expect(page).toHaveURL(/\/admin\/productos$/)
  await expect(page.getByRole('heading', { name: 'Gestión de productos' })).toBeVisible()
})

test('ruta protegida sin sesión redirige a /login y cliente en ruta admin ve 403', async ({ page }) => {
  await page.goto('/perfil')
  await expect(page).toHaveURL(/\/login$/)
  await login(page, CUSTOMER)
  await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible()
  await page.goto('/admin/productos')
  await expect(page.getByText('403')).toBeVisible()
})
