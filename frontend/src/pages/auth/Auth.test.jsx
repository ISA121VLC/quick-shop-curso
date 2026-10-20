import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../context/AuthContext.jsx'
import Login from './Login.jsx'
import Register from './Register.jsx'

vi.mock('../../api/auth.js', () => ({
  me: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}))
import * as authApi from '../../api/auth.js'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/" element={<div>inicio cliente</div>} />
          <Route path="/admin/productos" element={<div>panel admin</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authApi.me.mockRejectedValue(new Error('401'))
})

describe('Login', () => {
  it('redirige a / al iniciar sesión como cliente', async () => {
    authApi.login.mockResolvedValue({ id: 1, role: 'customer', full_name: 'C' })
    renderAt('/login')
    await userEvent.type(await screen.findByLabelText('Email'), 'c@t.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Cliente1234!')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('inicio cliente')).toBeInTheDocument()
  })

  it('redirige a /admin/productos como administrador', async () => {
    authApi.login.mockResolvedValue({ id: 2, role: 'admin', full_name: 'A' })
    renderAt('/login')
    await userEvent.type(await screen.findByLabelText('Email'), 'a@t.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Admin1234!')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('panel admin')).toBeInTheDocument()
  })

  it('muestra el error de credenciales', async () => {
    authApi.login.mockRejectedValue(new Error('Credenciales inválidas'))
    renderAt('/login')
    await userEvent.type(await screen.findByLabelText('Email'), 'c@t.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
  })

  it('valida campos vacíos sin llamar a la API', async () => {
    renderAt('/login')
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('El email es obligatorio')).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
  })
})

describe('Register', () => {
  async function fill({ password = 'Valida123!', confirm = 'Valida123!' } = {}) {
    await userEvent.type(await screen.findByLabelText('Nombre completo'), 'Ana')
    await userEvent.type(screen.getByLabelText('Email'), 'ana@t.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), password)
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), confirm)
    await userEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
  }

  it('crea la cuenta y lleva a /login', async () => {
    authApi.register.mockResolvedValue({ id: 3 })
    renderAt('/registro')
    await fill()
    await waitFor(() => expect(authApi.register).toHaveBeenCalledTimes(1))
    expect(authApi.register).toHaveBeenCalledWith({
      full_name: 'Ana',
      email: 'ana@t.com',
      password: 'Valida123!',
    })
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('error en línea si las contraseñas no coinciden', async () => {
    renderAt('/registro')
    await fill({ confirm: 'Otra1234!' })
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('error en línea si la contraseña es débil', async () => {
    renderAt('/registro')
    await fill({ password: 'debil', confirm: 'debil' })
    expect(screen.getByText(/al menos 8/)).toBeInTheDocument()
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('muestra el error del servidor (email duplicado)', async () => {
    authApi.register.mockRejectedValue(new Error('El email ya está registrado'))
    renderAt('/registro')
    await fill()
    expect(await screen.findByText('El email ya está registrado')).toBeInTheDocument()
  })
})
