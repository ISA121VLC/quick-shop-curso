import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { secondaryBtn } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

const linkCls = ({ isActive }) =>
  `border-b-2 py-1 text-sm ${isActive ? 'border-accent text-heading' : 'border-transparent text-accent-text'}`

export default function Layout() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="text-lg text-heading">
            QuickShop
          </Link>
          <nav className="flex flex-wrap items-center gap-4">
            {user && (
              <NavLink to="/" end className={linkCls}>
                Catálogo
              </NavLink>
            )}
            {user?.role === 'customer' && (
              <>
                <NavLink to="/pedidos" className={linkCls}>
                  Mis pedidos
                </NavLink>
                <NavLink to="/carrito" className={linkCls}>
                  Carrito
                  <span
                    aria-label={`${itemCount} productos en el carrito`}
                    className="ml-2 inline-block bg-accent px-2 text-sm text-ink"
                  >
                    {itemCount}
                  </span>
                </NavLink>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <NavLink to="/admin/productos" className={linkCls}>
                  Productos
                </NavLink>
                <NavLink to="/admin/usuarios" className={linkCls}>
                  Usuarios
                </NavLink>
                <NavLink to="/admin/pedidos" className={linkCls}>
                  Pedidos
                </NavLink>
              </>
            )}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <Link to="/perfil" className="text-sm">
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
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="bg-slate-brand text-white">
        <div className="mx-auto max-w-page px-4 py-4 text-sm">QuickShop</div>
      </footer>
    </div>
  )
}
