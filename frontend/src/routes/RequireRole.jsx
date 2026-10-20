import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Forbidden from '../pages/Forbidden.jsx'

export default function RequireRole({ roles }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) return <Forbidden />
  return <Outlet />
}
