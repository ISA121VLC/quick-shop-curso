import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Field, FormError, inputCls, primaryBtn } from '../../components/ui.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

function homeFor(user) {
  return user.role === 'admin' ? '/admin/productos' : '/'
}

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={homeFor(user)} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = {}
    if (!email.trim()) errors.email = 'El email es obligatorio'
    if (!password) errors.password = 'La contraseña es obligatoria'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    setSubmitting(true)
    setError('')
    try {
      const u = await login(email.trim(), password)
      const from = location.state?.from
      navigate(u.role === 'admin' || !from ? homeFor(u) : from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Iniciar sesión</h1>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <FormError>{error}</FormError>
        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <input id="email" type="email" className={inputCls} value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={fieldErrors.password}>
          <input id="password" type="password" className={inputCls} value={password}
            autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button type="submit" className={`${primaryBtn} w-full`} disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="text-indigo-700 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
