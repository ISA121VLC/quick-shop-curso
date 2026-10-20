import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { secondaryBtn } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const linkCls = ({ isActive }) =>
  `text-sm ${isActive ? 'font-semibold text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-indigo-700">
            QuickShop
          </Link>
          <nav className="flex flex-wrap items-center gap-4">
            {user && (
              <NavLink to="/" end className={linkCls}>
                Catálogo
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <>
                <NavLink to="/admin/productos" className={linkCls}>
                  Productos
                </NavLink>
                <NavLink to="/admin/usuarios" className={linkCls}>
                  Usuarios
                </NavLink>
              </>
            )}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <Link to="/perfil" className="text-sm text-slate-700 hover:underline">
                  {user.full_name}
                </Link>
                <button className={secondaryBtn} onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkCls}>
                  Iniciar sesión
                </NavLink>
                <NavLink to="/registro" className={linkCls}>
                  Registrarse
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
