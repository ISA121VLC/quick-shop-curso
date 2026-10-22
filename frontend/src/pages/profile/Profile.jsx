import { useState } from 'react'
import { changePassword, updateMe } from '../../api/users.js'
import { Field, FormError, inputCls, primaryBtn } from '../../components/ui.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { validatePassword } from '../../utils/validation.js'

function NameForm() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user.full_name)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setOk(false)
    if (!name.trim() || name.trim().length > 120) {
      setError('El nombre debe tener entre 1 y 120 caracteres')
      return
    }
    try {
      setUser(await updateMe({ full_name: name.trim() }))
      setError('')
      setOk(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 border border-line bg-surface p-6">
      <h2>Datos personales</h2>
      <FormError>{error}</FormError>
      {ok && <p role="status" className="text-sm text-teal-brand">Perfil actualizado</p>}
      <Field label="Email" htmlFor="profile-email">
        <input id="profile-email" className={`${inputCls} bg-surface-alt`} value={user.email} readOnly />
      </Field>
      <Field label="Nombre completo" htmlFor="profile-name">
        <input id="profile-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <button type="submit" className={primaryBtn}>Guardar</button>
    </form>
  )
}

function PasswordForm() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setOk(false)
    const next = {}
    if (!form.current) next.current = 'La contraseña actual es obligatoria'
    const pwdError = validatePassword(form.next)
    if (pwdError) next.next = pwdError
    if (form.confirm !== form.next) next.confirm = 'Las contraseñas no coinciden'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    try {
      await changePassword({ current_password: form.current, new_password: form.next })
      setForm({ current: '', next: '', confirm: '' })
      setError('')
      setOk(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 border border-line bg-surface p-6">
      <h2>Cambiar contraseña</h2>
      <FormError>{error}</FormError>
      {ok && <p role="status" className="text-sm text-teal-brand">Contraseña actualizada</p>}
      <Field label="Contraseña actual" htmlFor="current" error={errors.current}>
        <input id="current" type="password" className={inputCls} value={form.current} onChange={set('current')} />
      </Field>
      <Field label="Nueva contraseña" htmlFor="next" error={errors.next}>
        <input id="next" type="password" className={inputCls} value={form.next} onChange={set('next')} />
      </Field>
      <Field label="Confirmar nueva contraseña" htmlFor="confirm-next" error={errors.confirm}>
        <input id="confirm-next" type="password" className={inputCls} value={form.confirm} onChange={set('confirm')} />
      </Field>
      <button type="submit" className={primaryBtn}>Cambiar contraseña</button>
    </form>
  )
}

export default function Profile() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1>Mi perfil</h1>
      <NameForm />
      <PasswordForm />
    </div>
  )
}
