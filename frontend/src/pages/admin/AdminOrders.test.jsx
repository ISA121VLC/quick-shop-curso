import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ordersApi from '../../api/orders.js'
import * as usersApi from '../../api/users.js'
import { STATUS_TRANSITIONS } from '../../utils/orders.js'
import AdminOrderDetail from './AdminOrderDetail.jsx'
import AdminOrders from './AdminOrders.jsx'

vi.mock('../../api/orders.js', () => ({
  listOrders: vi.fn(), getOrder: vi.fn(), updateOrderStatus: vi.fn(),
}))
vi.mock('../../api/users.js', () => ({ listUsers: vi.fn(), getUser: vi.fn() }))

const order = (over = {}) => ({
  id: 5, user_id: 1, status: 'pending', total: '21.00',
  created_at: '2026-10-22T10:00:00Z', updated_at: '2026-10-22T10:00:00Z',
  items: [{ product_id: 1, product_name: 'Laptop', unit_price: '10.50', quantity: 2, subtotal: '21.00' }],
  ...over,
})
const customer = { id: 1, full_name: 'Cliente Uno', email: 'c1@quickshop.com' }

describe('AdminOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usersApi.listUsers.mockResolvedValue({ items: [customer], total: 1, page: 1, page_size: 100 })
    ordersApi.listOrders.mockResolvedValue({ items: [order()], total: 1, page: 1, page_size: 20 })
  })
  const renderList = () => render(<MemoryRouter><AdminOrders /></MemoryRouter>)

  it('muestra pedidos con nombre del cliente y enlace de gestión', async () => {
    renderList()
    const row = (await screen.findByText('#5')).closest('tr')
    expect(within(row).getByText('Cliente Uno')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: 'Gestionar' })).toHaveAttribute('href', '/admin/pedidos/5')
  })

  it('los filtros de estado y cliente se envían a la API', async () => {
    renderList()
    await screen.findByText('#5')
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por estado'), 'pending')
    await userEvent.selectOptions(await screen.findByRole('option', { name: 'Cliente Uno' }).then((o) => o.parentElement), '1')
    await waitFor(() =>
      expect(ordersApi.listOrders).toHaveBeenLastCalledWith({
        page: 1, page_size: 20, status: 'pending', user_id: '1',
      }),
    )
  })

  it('muestra vacío y error', async () => {
    ordersApi.listOrders.mockResolvedValueOnce({ items: [], total: 0, page: 1, page_size: 20 })
    const { unmount } = renderList()
    expect(await screen.findByText('No hay pedidos.')).toBeInTheDocument()
    unmount()
    ordersApi.listOrders.mockRejectedValueOnce(new Error('Fallo'))
    renderList()
    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo')
  })
})

describe('AdminOrderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usersApi.getUser.mockResolvedValue(customer)
  })
  const renderDetail = () =>
    render(
      <MemoryRouter initialEntries={['/admin/pedidos/5']}>
        <Routes><Route path="/admin/pedidos/:id" element={<AdminOrderDetail />} /></Routes>
      </MemoryRouter>,
    )

  it.each(Object.keys(STATUS_TRANSITIONS))('ofrece solo las transiciones válidas desde %s', async (status) => {
    ordersApi.getOrder.mockResolvedValue(order({ status }))
    renderDetail()
    await screen.findByRole('heading', { name: 'Pedido #5' })
    const expected = STATUS_TRANSITIONS[status]
    if (expected.length === 0) {
      expect(screen.queryByLabelText('Nuevo estado')).toBeNull()
      return
    }
    const options = within(screen.getByLabelText('Nuevo estado')).getAllByRole('option').slice(1)
    expect(options.map((o) => o.value)).toEqual(expected)
  })

  it('muestra los datos del cliente y aplica el cambio de estado', async () => {
    ordersApi.getOrder.mockResolvedValue(order())
    ordersApi.updateOrderStatus.mockResolvedValue(order({ status: 'confirmed' }))
    renderDetail()
    expect(await screen.findByText(/Cliente Uno \(c1@quickshop.com\)/)).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Nuevo estado'), 'confirmed')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(ordersApi.updateOrderStatus).toHaveBeenCalledWith(5, 'confirmed')
    expect(await screen.findByText('Confirmado', { selector: 'span[data-status]' })).toBeInTheDocument()
  })

  it('muestra el error 409 de stock al confirmar', async () => {
    ordersApi.getOrder.mockResolvedValue(order())
    ordersApi.updateOrderStatus.mockRejectedValue(new Error("'Laptop': stock insuficiente"))
    renderDetail()
    await userEvent.selectOptions(await screen.findByLabelText('Nuevo estado'), 'confirmed')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("stock insuficiente")
  })
})
