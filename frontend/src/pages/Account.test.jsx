import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as productsApi from '../api/products.js'
import * as usersApi from '../api/users.js'
import AdminUsers from './admin/AdminUsers.jsx'
import ProductForm from './admin/ProductForm.jsx'
import Profile from './profile/Profile.jsx'

vi.mock('../api/users.js', () => ({ updateMe: vi.fn(), changePassword: vi.fn(), listUsers: vi.fn() }))
vi.mock('../api/products.js', () => ({
  createProduct: vi.fn(),
  getProduct: vi.fn(),
  replaceProduct: vi.fn(),
}))
const setUser = vi.fn()
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'c@t.com', full_name: 'Cli', role: 'customer' },
    setUser,
  }),
}))

beforeEach(() => vi.clearAllMocks())

describe('Profile', () => {
  it('muestra el email de solo lectura y guarda el nombre', async () => {
    usersApi.updateMe.mockResolvedValue({ id: 1, full_name: 'Nuevo' })
    render(<Profile />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly')
    const input = screen.getByLabelText('Nombre completo')
    await userEvent.clear(input)
    await userEvent.type(input, 'Nuevo')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(usersApi.updateMe).toHaveBeenCalledWith({ full_name: 'Nuevo' })
    expect(setUser).toHaveBeenCalledWith({ id: 1, full_name: 'Nuevo' })
  })

  it('muestra el error del servidor al cambiar la contraseña', async () => {
    usersApi.changePassword.mockRejectedValue(new Error('La contraseña actual es incorrecta'))
    render(<Profile />)
    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'Mala1234!')
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'Nueva1234!')
    await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'), 'Nueva1234!')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(await screen.findByText('La contraseña actual es incorrecta')).toBeInTheDocument()
  })

  it('no llama a la API si las contraseñas no coinciden', async () => {
    render(<Profile />)
    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'Mala1234!')
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'Nueva1234!')
    await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'), 'Otra1234!')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(usersApi.changePassword).not.toHaveBeenCalled()
  })
})

describe('ProductForm', () => {
  const renderForm = () =>
    render(
      <MemoryRouter initialEntries={['/admin/productos/nuevo']}>
        <Routes>
          <Route path="/admin/productos/nuevo" element={<ProductForm />} />
          <Route path="/admin/productos" element={<div>lista productos</div>} />
        </Routes>
      </MemoryRouter>,
    )

  it('valida precio y stock en cliente sin enviar', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Nombre'), 'Lámpara')
    await userEvent.type(screen.getByLabelText('Precio'), '0')
    await userEvent.clear(screen.getByLabelText('Stock'))
    await userEvent.type(screen.getByLabelText('Stock'), '-1')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('El precio debe ser mayor que 0')).toBeInTheDocument()
    expect(screen.getByText(/stock debe ser un entero/)).toBeInTheDocument()
    expect(productsApi.createProduct).not.toHaveBeenCalled()
  })

  it('crea el producto y vuelve a la lista', async () => {
    productsApi.createProduct.mockResolvedValue({ id: 1 })
    renderForm()
    await userEvent.type(screen.getByLabelText('Nombre'), 'Lámpara')
    await userEvent.type(screen.getByLabelText('Precio'), '15.50')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(productsApi.createProduct).toHaveBeenCalledWith({
      name: 'Lámpara',
      description: '',
      price: '15.50',
      stock: 0,
      image_url: null,
      is_active: true,
    })
    expect(await screen.findByText('lista productos')).toBeInTheDocument()
  })
})

describe('AdminUsers', () => {
  it('lista usuarios y pasa el filtro de rol a la API', async () => {
    usersApi.listUsers.mockResolvedValue({
      items: [{ id: 1, full_name: 'Ana', email: 'ana@t.com', role: 'customer', is_active: true }],
      total: 1,
      page: 1,
      page_size: 20,
    })
    render(<AdminUsers />)
    expect(await screen.findByText('ana@t.com')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por rol'), 'admin')
    expect(usersApi.listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ role: 'admin', page: 1 }),
    )
  })
})
