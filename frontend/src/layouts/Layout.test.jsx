import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Layout from './Layout.jsx'

const mockUser = { current: null }
const mockCart = { itemCount: 0 }
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockUser.current, logout: vi.fn() }),
}))
vi.mock('../context/CartContext.jsx', () => ({ useCart: () => mockCart }))

const renderLayout = () => render(<MemoryRouter><Layout /></MemoryRouter>)

describe('Layout', () => {
  beforeEach(() => {
    mockCart.itemCount = 0
  })

  it('muestra el contador del carrito al cliente', () => {
    mockUser.current = { role: 'customer', full_name: 'Cli' }
    mockCart.itemCount = 3
    renderLayout()
    expect(screen.getByRole('link', { name: /Carrito/ })).toBeInTheDocument()
    expect(screen.getByLabelText('3 productos en el carrito')).toHaveClass('bg-accent', 'text-ink')
    expect(screen.getByRole('link', { name: 'Mis pedidos' })).toBeInTheDocument()
  })

  it('el administrador no ve carrito y sí la gestión de pedidos', () => {
    mockUser.current = { role: 'admin', full_name: 'Adm' }
    renderLayout()
    expect(screen.queryByRole('link', { name: /Carrito/ })).toBeNull()
    expect(screen.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('href', '/admin/pedidos')
  })

  it('sin sesión no hay carrito ni pedidos', () => {
    mockUser.current = null
    renderLayout()
    expect(screen.queryByRole('link', { name: /Carrito/ })).toBeNull()
    expect(screen.getByText('QuickShop', { selector: 'footer div' })).toBeInTheDocument()
  })
})
