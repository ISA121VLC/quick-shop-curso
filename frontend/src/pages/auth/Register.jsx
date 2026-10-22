import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, FormError, inputCls, primaryBtn } from '../../components/ui.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { validatePassword } from '../../utils/validation.js'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    const next = {}
    if (!form.full_name.trim()) next.full_name = 'El nombre es obligatorio'
    else if (form.full_name.trim().length > 120) next.full_name = 'Máximo 120 caracteres'
    if (!form.email.trim()) next.email = 'El email es obligatorio'
    const pwdError = validatePassword(form.password)
    if (pwdError) next.password = pwdError
    if (form.confirm !== form.password) next.confirm = 'Las contraseñas no coinciden'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setSubmitting(true)
    setError('')
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6">Crear cuenta</h1>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 border border-line bg-surface p-6">
        <FormError>{error}</FormError>
        <Field label="Nombre completo" htmlFor="full_name" error={errors.full_name}>
          <input id="full_name" className={inputCls} value={form.full_name} onChange={set('full_name')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" className={inputCls} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={errors.password}>
          <input id="password" type="password" className={inputCls} value={form.password}
            autoComplete="new-password" onChange={set('password')} />
        </Field>
        <Field label="Confirmar contraseña" htmlFor="confirm" error={errors.confirm}>
          <input id="confirm" type="password" className={inputCls} value={form.confirm}
            autoComplete="new-password" onChange={set('confirm')} />
        </Field>
        <button type="submit" className={`${primaryBtn} w-full`} disabled={submitting}>
          {submitting ? 'Creando...' : 'Registrarse'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-body">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
