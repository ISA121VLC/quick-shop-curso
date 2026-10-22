import { expect, test } from '@playwright/test'
import { ADMIN, CUSTOMER, login, uniqueId } from './helpers.js'

const badge = (page) => page.locator('[data-status]').first()

async function stockOf(page, productId) {
  const response = await page.request.get(`/api/products/${productId}`)
  return (await response.json()).stock
}

async function placeOrder(page, productName, quantity) {
  await page.goto('/')
  await page.getByLabel('Buscar productos').fill(productName)
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await page.getByRole('link', { name: productName }).click()
  await page.getByLabel('Cantidad', { exact: true }).fill(String(quantity))
  await page.getByRole('button', { name: 'Añadir al carrito' }).click()
  await expect(page.getByText('Añadido al carrito')).toBeVisible()
  await page.getByRole('link', { name: /^Carrito/ }).click()
  await page.getByRole('button', { name: 'Realizar pedido' }).click()
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page).toHaveURL(/\/pedidos\/\d+$/)
  await expect(badge(page)).toHaveText('Pendiente')
  return page.url().split('/').pop()
}

async function changeStatus(page, orderId, label, expected) {
  await page.goto(`/admin/pedidos/${orderId}`)
  await page.getByLabel('Nuevo estado').selectOption({ label })
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(badge(page)).toHaveText(expected)
}

test('compra, cancelación y gestión de estados con movimiento de stock', async ({ page, browser }) => {
  const name = `Producto Pedido ${uniqueId()}`
  const adminPage = await (await browser.newContext()).newPage()
  await login(adminPage, ADMIN)
  const created = await adminPage.request.post('/api/products', {
    data: { name, description: 'E2E', price: '10.00', stock: 3 },
  })
  expect(created.status()).toBe(201)
  const productId = (await created.json()).id

  await login(page, CUSTOMER)
  expect((await page.request.delete('/api/cart')).status()).toBe(200)
  await page.reload()

  // añadir el máximo y superar el stock
  await page.getByLabel('Buscar productos').fill(name)
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await page.getByRole('link', { name }).click()
  await page.getByLabel('Cantidad', { exact: true }).fill('3')
  await page.getByRole('button', { name: 'Añadir al carrito' }).click()
  await expect(page.getByText('Añadido al carrito')).toBeVisible()
  await expect(page.getByLabel('3 productos en el carrito')).toBeVisible()
  await page.getByRole('button', { name: 'Añadir al carrito' }).click()
  await expect(page.getByRole('alert')).toContainText('unidades disponibles')

  // pedido A: se crea sin tocar el stock y el cliente lo cancela
  await page.getByRole('link', { name: /^Carrito/ }).click()
  await page.getByRole('button', { name: 'Realizar pedido' }).click()
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page).toHaveURL(/\/pedidos\/\d+$/)
  await expect(badge(page)).toHaveText('Pendiente')
  expect(await stockOf(page, productId)).toBe(3)
  await page.getByRole('button', { name: 'Cancelar pedido' }).click()
  await expect(badge(page)).toHaveText('Cancelado')
  await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0)
  expect(await stockOf(page, productId)).toBe(3)

  // pedido B: el admin confirma (descuenta), envía y entrega
  const orderB = await placeOrder(page, name, 2)
  await changeStatus(adminPage, orderB, 'Confirmado', 'Confirmado')
  expect(await stockOf(page, productId)).toBe(1)
  await changeStatus(adminPage, orderB, 'Enviado', 'Enviado')
  await changeStatus(adminPage, orderB, 'Entregado', 'Entregado')
  await expect(adminPage.getByLabel('Nuevo estado')).toHaveCount(0)

  // pedido C: confirmado y cancelado por el admin restituye el stock
  const orderC = await placeOrder(page, name, 1)
  await changeStatus(adminPage, orderC, 'Confirmado', 'Confirmado')
  expect(await stockOf(page, productId)).toBe(0)
  await changeStatus(adminPage, orderC, 'Cancelado', 'Cancelado')
  expect(await stockOf(page, productId)).toBe(1)

  // el cliente ve su historial y el filtro por estado
  await page.goto('/pedidos')
  await expect(page.getByRole('row', { name: new RegExp(`#${orderB}\\b`) })).toContainText('Entregado')
  await page.getByLabel('Filtrar por estado').selectOption('cancelled')
  await expect(page.getByRole('row', { name: new RegExp(`#${orderC}\\b`) })).toBeVisible()
  await expect(page.getByRole('row', { name: new RegExp(`#${orderB}\\b`) })).toHaveCount(0)

  // el listado del admin muestra el pedido con su cliente
  await adminPage.goto('/admin/pedidos')
  await expect(adminPage.getByRole('row', { name: new RegExp(`#${orderB}\\b`) })).toContainText('Cliente')
})

test('el cliente no ve pedidos ajenos y el admin no tiene carrito', async ({ page, browser }) => {
  await login(page, CUSTOMER)
  expect((await page.request.get('/api/orders/999999')).status()).toBe(404)
  await page.goto('/admin/pedidos')
  await expect(page.getByRole('heading', { name: '403' })).toBeVisible()

  const adminPage = await (await browser.newContext()).newPage()
  await login(adminPage, ADMIN)
  await expect(adminPage.getByRole('link', { name: /^Carrito/ })).toHaveCount(0)
  await adminPage.goto('/carrito')
  await expect(adminPage.getByRole('heading', { name: '403' })).toBeVisible()
})
