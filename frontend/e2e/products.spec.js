import { expect, test } from '@playwright/test'
import { ADMIN, CUSTOMER, login, uniqueId } from './helpers.js'

// La tabla vuelve a la página 1 tras cada acción: se recorre hasta encontrar la fila.
async function findRow(page, name) {
  const row = page.getByRole('row', { name: new RegExp(name) })
  const next = page.getByRole('button', { name: 'Siguiente' })
  for (;;) {
    // el contenido desaparece mientras carga: se espera a que reaparezca la paginación
    await expect(next).toBeVisible()
    if (await row.waitFor({ timeout: 700 }).then(() => true, () => false)) return row
    await next.click()
  }
}

test('catálogo: listado, búsqueda y paginación', async ({ page }) => {
  await login(page, CUSTOMER)
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  await expect(page.getByRole('article').first()).toBeVisible()
  await expect(page.getByText(/Página 1 de/)).toBeVisible()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page.getByText(/Página 2 de/)).toBeVisible()
  await page.getByLabel('Buscar productos').fill('Laptop Pro')
  await page.getByRole('button', { name: 'Buscar' }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Laptop Pro 15' })).toBeVisible()
  await page.getByRole('link', { name: 'Laptop Pro 15' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Laptop Pro 15' })).toBeVisible()
})

test('admin: crear, editar y desactivar un producto; el cliente ve el estado', async ({ page, browser }) => {
  const name = `Producto E2E ${uniqueId()}`
  await login(page, ADMIN)
  await page.getByRole('link', { name: 'Nuevo producto' }).click()

  // validación en cliente
  await page.getByLabel('Nombre').fill(name)
  await page.getByLabel('Precio').fill('0')
  await page.getByLabel('Stock').fill('-1')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('El precio debe ser mayor que 0')).toBeVisible()
  await expect(page.getByText(/stock debe ser un entero/)).toBeVisible()

  await page.getByLabel('Precio').fill('15.50')
  await page.getByLabel('Stock').fill('0')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page).toHaveURL(/\/admin\/productos$/)

  // el producto nuevo es el último: buscar su fila recorriendo páginas
  let row = await findRow(page, name)
  await expect(row).toContainText('15,50')
  await expect(row).toContainText('Activo')

  // el cliente lo ve con "Sin stock"
  const customerPage = await (await browser.newContext()).newPage()
  await login(customerPage, CUSTOMER)
  await customerPage.getByLabel('Buscar productos').fill(name)
  await customerPage.getByRole('button', { name: 'Buscar' }).click()
  const card = customerPage.getByRole('article')
  await expect(card).toHaveCount(1)
  await expect(card.getByRole('button', { name: 'Sin stock' })).toBeDisabled()

  // editar
  await row.getByRole('link', { name: 'Editar' }).click()
  await page.getByLabel('Stock').fill('7')
  await page.getByRole('button', { name: 'Guardar' }).click()
  row = await findRow(page, name)
  await expect(row.getByRole('cell').nth(2)).toHaveText('7')

  // desactivar
  page.once('dialog', (d) => d.accept())
  await row.getByRole('button', { name: 'Desactivar' }).click()
  row = await findRow(page, name)
  await expect(row).toContainText('Inactivo')

  await customerPage.getByRole('button', { name: 'Buscar' }).click()
  await expect(customerPage.getByText('No se encontraron productos.')).toBeVisible()
})

test('el administrador no ve acciones de carrito en el catálogo', async ({ page }) => {
  await login(page, ADMIN)
  await page.goto('/')
  await expect(page.getByRole('article').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Añadir al carrito|Sin stock/ })).toHaveCount(0)
})
