import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductCard from '../../components/ProductCard.jsx'
import * as productsApi from '../../api/products.js'
import Catalog from './Catalog.jsx'

vi.mock('../../api/products.js', () => ({ listProducts: vi.fn() }))
const addItem = vi.fn()
vi.mock('../../context/CartContext.jsx', () => ({ useCart: () => ({ addItem }) }))
const mockUser = { current: { role: 'customer' } }
vi.mock('../../context/AuthContext.jsx', () => ({ useAuth: () => ({ user: mockUser.current }) }))

const product = (over = {}) => ({
  id: 1, name: 'Laptop', price: '1299.99', stock: 3, image_url: null, is_active: true, ...over,
})

describe('ProductCard', () => {
  it('deshabilita el botón y muestra Sin stock con stock 0', () => {
    render(<MemoryRouter><ProductCard product={product({ stock: 0 })} isAdmin={false} /></MemoryRouter>)
    const button = screen.getByRole('button', { name: 'Sin stock' })
    expect(button).toBeDisabled()
  })

  it('oculta la acción de carrito al administrador', () => {
    render(<MemoryRouter><ProductCard product={product()} isAdmin /></MemoryRouter>)
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('Añadir al carrito', () => {
  beforeEach(() => vi.clearAllMocks())

  const renderCard = (over) =>
    render(<MemoryRouter><ProductCard product={product(over)} isAdmin={false} /></MemoryRouter>)

  it('añade el producto y confirma', async () => {
    addItem.mockResolvedValue({})
    renderCard({ id: 9 })
    await userEvent.click(screen.getByRole('button', { name: 'Añadir al carrito' }))
    expect(addItem).toHaveBeenCalledWith(9, 1)
    expect(await screen.findByText('Añadido al carrito')).toBeInTheDocument()
  })

  it('muestra el mensaje de stock superado', async () => {
    addItem.mockRejectedValue(new Error('Stock insuficiente: solo hay 3 unidades disponibles'))
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Añadir al carrito' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('solo hay 3 unidades disponibles')
  })

  it('no llama al carrito con stock 0', async () => {
    renderCard({ stock: 0 })
    await userEvent.click(screen.getByRole('button', { name: 'Sin stock' }))
    expect(addItem).not.toHaveBeenCalled()
  })
})

describe('Catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.current = { role: 'customer' }
  })

  const renderCatalog = () => render(<MemoryRouter><Catalog /></MemoryRouter>)

  it('muestra estado de carga y luego los productos', async () => {
    productsApi.listProducts.mockResolvedValue({ items: [product()], total: 1, page: 1, page_size: 12 })
    renderCatalog()
    expect(screen.getByText('Cargando productos...')).toBeInTheDocument()
    expect(await screen.findByText('Laptop')).toBeInTheDocument()
  })

  it('muestra estado vacío', async () => {
    productsApi.listProducts.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 12 })
    renderCatalog()
    expect(await screen.findByText('No se encontraron productos.')).toBeInTheDocument()
  })

  it('muestra estado de error', async () => {
    productsApi.listProducts.mockRejectedValue(new Error('Fallo de red'))
    renderCatalog()
    expect(await screen.findByText('Fallo de red')).toBeInTheDocument()
  })
})
