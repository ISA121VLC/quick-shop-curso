import { expect, test } from '@playwright/test'
import { ADMIN, CUSTOMER, login, uniqueId } from './helpers.js'

test('cliente edita su nombre y se refleja en el header', async ({ page }) => {
  const name = `Cliente ${uniqueId()}`
  await login(page, CUSTOMER)
  await page.goto('/perfil')
  await expect(page.getByLabel('Email')).toHaveValue(CUSTOMER.email)
  await expect(page.getByLabel('Email')).toHaveAttribute('readonly', '')
  await page.getByLabel('Nombre completo').fill(name)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Perfil actualizado')).toBeVisible()
  await expect(page.getByRole('banner').getByRole('link', { name })).toBeVisible()
})

test('cambio de contraseña con contraseña actual incorrecta muestra error', async ({ page }) => {
  await login(page, CUSTOMER)
  await page.goto('/perfil')
  await page.getByLabel('Contraseña actual').fill('Incorrecta1!')
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('Nueva1234!')
  await page.getByLabel('Confirmar nueva contraseña').fill('Nueva1234!')
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
  await expect(page.getByRole('alert')).toContainText('contraseña actual es incorrecta')
})

test('admin lista usuarios y filtra por rol', async ({ page }) => {
  await login(page, ADMIN)
  await page.goto('/admin/usuarios')
  await expect(page.getByRole('cell', { name: ADMIN.email })).toBeVisible()
  await page.getByLabel('Filtrar por rol').selectOption('admin')
  await expect(page.getByRole('row')).toHaveCount(2)
})
