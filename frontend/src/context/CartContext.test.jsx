import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CartProvider, useCart } from './CartContext.jsx'

vi.mock('../api/cart.js', () => ({
  getCart: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
}))
const mockUser = { current: null }
vi.mock('./AuthContext.jsx', () => ({ useAuth: () => ({ user: mockUser.current }) }))
import * as cartApi from '../api/cart.js'

const cartWith = (count) => ({ id: 1, items: [], total: '0.00', item_count: count })

function Probe() {
  const { itemCount, addItem } = useCart()
  const handleAdd = () => addItem(7, 2).catch((e) => document.body.setAttribute('data-error', e.message))
  return (
    <div>
      <span>contador:{itemCount}</span>
      <button onClick={handleAdd}>añadir</button>
    </div>
  )
}

const renderProbe = () => render(<CartProvider><Probe /></CartProvider>)

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.removeAttribute('data-error')
  })

  it('carga el carrito de un cliente', async () => {
    mockUser.current = { id: 1, role: 'customer' }
    cartApi.getCart.mockResolvedValue(cartWith(3))
    renderProbe()
    expect(await screen.findByText('contador:3')).toBeInTheDocument()
  })

  it('el administrador no hace peticiones de carrito', async () => {
    mockUser.current = { id: 2, role: 'admin' }
    renderProbe()
    expect(screen.getByText('contador:0')).toBeInTheDocument()
    await Promise.resolve()
    expect(cartApi.getCart).not.toHaveBeenCalled()
  })

  it('sin sesión no hay peticiones', () => {
    mockUser.current = null
    renderProbe()
    expect(cartApi.getCart).not.toHaveBeenCalled()
  })

  it('añadir actualiza el contador', async () => {
    mockUser.current = { id: 1, role: 'customer' }
    cartApi.getCart.mockResolvedValue(cartWith(0))
    cartApi.addItem.mockResolvedValue(cartWith(2))
    renderProbe()
    await screen.findByText('contador:0')
    await userEvent.click(screen.getByText('añadir'))
    expect(await screen.findByText('contador:2')).toBeInTheDocument()
    expect(cartApi.addItem).toHaveBeenCalledWith(7, 2)
  })

  it('propaga el mensaje del error 409 y mantiene el carrito', async () => {
    mockUser.current = { id: 1, role: 'customer' }
    cartApi.getCart.mockResolvedValue(cartWith(1))
    cartApi.addItem.mockRejectedValue(new Error('Stock insuficiente: solo hay 3 unidades disponibles'))
    renderProbe()
    await screen.findByText('contador:1')
    await userEvent.click(screen.getByText('añadir'))
    await waitFor(() =>
      expect(document.body.getAttribute('data-error')).toBe('Stock insuficiente: solo hay 3 unidades disponibles'),
    )
    expect(screen.getByText('contador:1')).toBeInTheDocument()
  })
})
