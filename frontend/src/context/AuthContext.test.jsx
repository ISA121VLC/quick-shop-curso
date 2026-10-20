import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RequireAuth from '../routes/RequireAuth.jsx'
import RequireRole from '../routes/RequireRole.jsx'
import { AuthProvider, useAuth } from './AuthContext.jsx'

vi.mock('../api/auth.js', () => ({
  me: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}))
import * as authApi from '../api/auth.js'

const customer = { id: 1, email: 'c@t.com', full_name: 'Cli', role: 'customer' }
const admin = { id: 2, email: 'a@t.com', full_name: 'Adm', role: 'admin' }

function Probe() {
  const { user, logout } = useAuth()
  return (
    <div>
      <span>usuario:{user?.full_name}</span>
      <button onClick={logout}>salir</button>
    </div>
  )
}

function renderApp(initial) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>pantalla login</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Probe />} />
            <Route element={<RequireRole roles={['admin']} />}>
              <Route path="/admin" element={<div>zona admin</div>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  const spy = vi.spyOn(Storage.prototype, 'setItem')
  spy.mockClear()
})

describe('AuthContext y rutas protegidas', () => {
  it('restaura la sesión con /auth/me', async () => {
    authApi.me.mockResolvedValue(customer)
    renderApp('/')
    expect(await screen.findByText('usuario:Cli')).toBeInTheDocument()
    expect(authApi.me).toHaveBeenCalledTimes(1)
  })

  it('redirige a /login sin sesión', async () => {
    authApi.me.mockRejectedValue(new Error('401'))
    renderApp('/')
    expect(await screen.findByText('pantalla login')).toBeInTheDocument()
  })

  it('muestra 403 a un cliente en ruta de admin', async () => {
    authApi.me.mockResolvedValue(customer)
    renderApp('/admin')
    expect(await screen.findByText('403')).toBeInTheDocument()
  })

  it('permite al admin entrar en ruta de admin', async () => {
    authApi.me.mockResolvedValue(admin)
    renderApp('/admin')
    expect(await screen.findByText('zona admin')).toBeInTheDocument()
  })

  it('logout limpia la sesión y redirige a /login', async () => {
    authApi.me.mockResolvedValue(customer)
    authApi.logout.mockResolvedValue(null)
    renderApp('/')
    await userEvent.click(await screen.findByText('salir'))
    await waitFor(() => expect(screen.getByText('pantalla login')).toBeInTheDocument())
    expect(authApi.logout).toHaveBeenCalled()
  })

  it('no guarda nada en localStorage ni sessionStorage', async () => {
    authApi.me.mockResolvedValue(customer)
    renderApp('/')
    await screen.findByText('usuario:Cli')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
