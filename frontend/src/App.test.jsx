import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

const mockUser = { current: null }
vi.mock('./context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockUser.current, loading: false, logout: vi.fn() }),
}))
vi.mock('./context/CartContext.jsx', () => ({
  useCart: () => ({ cart: null, itemCount: 0, loading: true, error: null }),
}))
vi.mock('./api/orders.js', () => ({
  listOrders: vi.fn(() => new Promise(() => {})),
  getOrder: vi.fn(() => new Promise(() => {})),
}))
vi.mock('./api/users.js', () => ({ listUsers: vi.fn(() => new Promise(() => {})), getUser: vi.fn() }))
vi.mock('./api/products.js', () => ({ listProducts: vi.fn(() => new Promise(() => {})) }))

const customer = { id: 1, role: 'customer', full_name: 'Cli' }
const admin = { id: 2, role: 'admin', full_name: 'Adm' }
const at = (path) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)

describe('rutas de carrito y pedidos', () => {
  it.each(['/carrito', '/pedidos', '/pedidos/3'])('%s: el administrador recibe 403', (path) => {
    mockUser.current = admin
    at(path)
    expect(screen.getByRole('heading', { name: '403' })).toBeInTheDocument()
  })

  it.each(['/admin/pedidos', '/admin/pedidos/3'])('%s: el cliente recibe 403', (path) => {
    mockUser.current = customer
    at(path)
    expect(screen.getByRole('heading', { name: '403' })).toBeInTheDocument()
  })

  it('el cliente accede a carrito y pedidos', () => {
    mockUser.current = customer
    at('/carrito')
    expect(screen.getByText('Cargando carrito...')).toBeInTheDocument()
  })

  it('el admin accede a la gestión de pedidos', () => {
    mockUser.current = admin
    at('/admin/pedidos')
    expect(screen.getByRole('heading', { name: 'Gestión de pedidos' })).toBeInTheDocument()
  })

  it('sin sesión redirige a login', () => {
    mockUser.current = null
    at('/pedidos')
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
