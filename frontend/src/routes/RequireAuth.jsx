import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { StateMessage } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <StateMessage>Cargando sesión...</StateMessage>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
