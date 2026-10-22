import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ordersApi from '../../api/orders.js'
import Cart from './Cart.jsx'

vi.mock('../../api/orders.js', () => ({ createOrder: vi.fn() }))
const ctx = {
  cart: null, loading: false, error: null,
  updateItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), refresh: vi.fn(),
}
vi.mock('../../context/CartContext.jsx', () => ({ useCart: () => ctx }))

const product = (over = {}) => ({
  id: 1, name: 'Laptop', price: '10.00', stock: 5, image_url: null, is_active: true, ...over,
})
const item = (over = {}) => ({
  id: 11, product: product(), quantity: 2, subtotal: '20.00', available: true, ...over,
})
const cartOf = (items, total = '20.00') => ({ id: 1, items, total, item_count: items.length })

const renderCart = () =>
  render(
    <MemoryRouter initialEntries={['/carrito']}>
      <Routes>
        <Route path="/carrito" element={<Cart />} />
        <Route path="/pedidos/:id" element={<div>detalle pedido</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('Cart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ctx.cart = cartOf([item()])
    ctx.loading = false
    ctx.error = null
    ctx.refresh.mockResolvedValue(null)
  })

  it('muestra carga y error', () => {
    ctx.cart = null
    ctx.loading = true
    const { unmount } = renderCart()
    expect(screen.getByText('Cargando carrito...')).toBeInTheDocument()
    unmount()
    ctx.loading = false
    ctx.error = new Error('Fallo de red')
    renderCart()
    expect(screen.getByRole('alert')).toHaveTextContent('Fallo de red')
  })

  it('muestra el estado vacío con enlace al catálogo', () => {
    ctx.cart = cartOf([], '0.00')
    renderCart()
    expect(screen.getByRole('status')).toHaveTextContent('Tu carrito está vacío')
    expect(screen.getByRole('link', { name: 'Ver el catálogo' })).toHaveAttribute('href', '/')
  })

  it('lista ítems con subtotal, total y selector con tope de stock', () => {
    renderCart()
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.getByText('20,00 €')).toBeInTheDocument()
    expect(screen.getByText('Total: 20,00 €')).toBeInTheDocument()
    const select = screen.getByLabelText('Cantidad de Laptop')
    expect([...select.options].map((o) => o.value)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('cambiar cantidad, eliminar y vaciar llaman al contexto', async () => {
    ctx.updateItem.mockResolvedValue({})
    ctx.removeItem.mockResolvedValue({})
    ctx.clear.mockResolvedValue({})
    renderCart()
    await userEvent.selectOptions(screen.getByLabelText('Cantidad de Laptop'), '4')
    expect(ctx.updateItem).toHaveBeenCalledWith(11, 4)
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(ctx.removeItem).toHaveBeenCalledWith(11)
    await userEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    expect(ctx.clear).toHaveBeenCalled()
  })

  it('muestra el error 409 de stock al cambiar cantidad', async () => {
    ctx.updateItem.mockRejectedValue(new Error('Stock insuficiente: solo hay 3 unidades disponibles'))
    renderCart()
    await userEvent.selectOptions(screen.getByLabelText('Cantidad de Laptop'), '4')
    expect(await screen.findByRole('alert')).toHaveTextContent('solo hay 3 unidades disponibles')
  })

  it('señala los ítems no disponibles y bloquea el pedido', () => {
    ctx.cart = cartOf([item({ available: false, product: product({ is_active: false }) })])
    renderCart()
    expect(screen.getByText(/No disponible/)).toBeInTheDocument()
    expect(screen.getByLabelText('Cantidad de Laptop')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Realizar pedido' })).toBeDisabled()
  })

  it('realizar pedido pasa por la confirmación y redirige al detalle', async () => {
    ordersApi.createOrder.mockResolvedValue({ id: 77 })
    renderCart()
    await userEvent.click(screen.getByRole('button', { name: 'Realizar pedido' }))
    expect(screen.getByRole('heading', { name: 'Confirmar pedido' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Realizar pedido' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }))
    expect(await screen.findByText('detalle pedido')).toBeInTheDocument()
    expect(ctx.refresh).toHaveBeenCalled()
  })

  it('el error 409 al crear el pedido se muestra y vuelve al carrito', async () => {
    ordersApi.createOrder.mockRejectedValue(new Error("'Laptop': stock insuficiente"))
    renderCart()
    await userEvent.click(screen.getByRole('button', { name: 'Realizar pedido' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("'Laptop': stock insuficiente")
    await waitFor(() => expect(screen.getByRole('button', { name: 'Realizar pedido' })).toBeEnabled())
  })
})
