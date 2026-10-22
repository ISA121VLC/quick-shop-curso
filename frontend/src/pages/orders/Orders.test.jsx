import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ordersApi from '../../api/orders.js'
import OrderDetail from './OrderDetail.jsx'
import Orders from './Orders.jsx'

vi.mock('../../api/orders.js', () => ({ listOrders: vi.fn(), getOrder: vi.fn(), cancelOrder: vi.fn() }))

const order = (over = {}) => ({
  id: 5,
  user_id: 1,
  status: 'pending',
  total: '24.25',
  created_at: '2026-10-22T10:00:00Z',
  updated_at: '2026-10-22T10:00:00Z',
  items: [{ product_id: 1, product_name: 'Laptop', unit_price: '10.50', quantity: 2, subtotal: '21.00' }],
  ...over,
})
const page = (items) => ({ items, total: items.length, page: 1, page_size: 10 })

describe('Orders', () => {
  beforeEach(() => vi.clearAllMocks())
  const renderList = () => render(<MemoryRouter><Orders /></MemoryRouter>)

  it('lista los pedidos con su estado y total', async () => {
    ordersApi.listOrders.mockResolvedValue(page([order(), order({ id: 6, status: 'shipped', total: '5.00' })]))
    renderList()
    expect(screen.getByText('Cargando pedidos...')).toBeInTheDocument()
    expect(await screen.findByText('#5')).toBeInTheDocument()
    expect(screen.getByText('Pendiente', { selector: 'span[data-status]' })).toHaveAttribute('data-status', 'pending')
    expect(screen.getByText('Enviado', { selector: 'span[data-status]' })).toHaveAttribute('data-status', 'shipped')
    expect(screen.getByText('24,25 €')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ver detalle' })[0]).toHaveAttribute('href', '/pedidos/5')
  })

  it('muestra el estado vacío con enlace al catálogo', async () => {
    ordersApi.listOrders.mockResolvedValue(page([]))
    renderList()
    expect(await screen.findByRole('link', { name: 'Ver el catálogo' })).toBeInTheDocument()
  })

  it('muestra el error', async () => {
    ordersApi.listOrders.mockRejectedValue(new Error('Fallo de red'))
    renderList()
    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo de red')
  })

  it('el filtro por estado vuelve a consultar con el estado elegido', async () => {
    ordersApi.listOrders.mockResolvedValue(page([order()]))
    renderList()
    await screen.findByText('#5')
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por estado'), 'confirmed')
    await waitFor(() =>
      expect(ordersApi.listOrders).toHaveBeenLastCalledWith({ page: 1, page_size: 10, status: 'confirmed' }),
    )
  })
})

describe('OrderDetail', () => {
  beforeEach(() => vi.clearAllMocks())
  const renderDetail = () =>
    render(
      <MemoryRouter initialEntries={['/pedidos/5']}>
        <Routes><Route path="/pedidos/:id" element={<OrderDetail />} /></Routes>
      </MemoryRouter>,
    )

  it('muestra ítems, total y el botón de cancelar solo en pending', async () => {
    ordersApi.getOrder.mockResolvedValue(order())
    renderDetail()
    expect(await screen.findByRole('heading', { name: 'Pedido #5' })).toBeInTheDocument()
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.getByText('21,00 €')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar pedido' })).toBeInTheDocument()
  })

  it.each(['confirmed', 'shipped', 'delivered', 'cancelled'])('sin botón de cancelar en %s', async (status) => {
    ordersApi.getOrder.mockResolvedValue(order({ status }))
    renderDetail()
    await screen.findByRole('heading', { name: 'Pedido #5' })
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).toBeNull()
  })

  it('cancelar actualiza el estado', async () => {
    ordersApi.getOrder.mockResolvedValue(order())
    ordersApi.cancelOrder.mockResolvedValue(order({ status: 'cancelled' }))
    renderDetail()
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    expect(ordersApi.cancelOrder).toHaveBeenCalledWith(5)
    expect(await screen.findByText('Cancelado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).toBeNull()
  })

  it('pedido inexistente', async () => {
    ordersApi.getOrder.mockRejectedValue(Object.assign(new Error('x'), { status: 404 }))
    renderDetail()
    expect(await screen.findByText('Pedido no encontrado')).toBeInTheDocument()
  })
})
