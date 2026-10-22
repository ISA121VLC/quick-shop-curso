import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createProduct, getProduct, replaceProduct } from '../../api/products.js'
import { Field, FormError, StateMessage, inputCls, primaryBtn, secondaryBtn } from '../../components/ui.jsx'
import { validateProductForm } from '../../utils/validation.js'

const EMPTY = { name: '', description: '', price: '', stock: '0', image_url: '', is_active: true }

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(Boolean(id))
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    getProduct(id)
      .then((p) => active && setForm({
        name: p.name,
        description: p.description,
        price: p.price,
        stock: String(p.stock),
        image_url: p.image_url ?? '',
        is_active: p.is_active,
      }))
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validateProductForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const body = {
      name: form.name.trim(),
      description: form.description,
      price: form.price.trim(),
      stock: Number(form.stock),
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
    }
    setSubmitting(true)
    setError('')
    try {
      if (id) await replaceProduct(id, body)
      else await createProduct(body)
      navigate('/admin/productos')
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (loading) return <StateMessage>Cargando producto...</StateMessage>
  if (loadError) return <StateMessage tone="error">{loadError}</StateMessage>

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6">{id ? 'Editar producto' : 'Nuevo producto'}</h1>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 border border-line bg-surface p-6">
        <FormError>{error}</FormError>
        <Field label="Nombre" htmlFor="name" error={errors.name}>
          <input id="name" className={inputCls} value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Descripción" htmlFor="description">
          <textarea id="description" rows={3} className={inputCls} value={form.description} onChange={set('description')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio" htmlFor="price" error={errors.price}>
            <input id="price" inputMode="decimal" className={inputCls} value={form.price} onChange={set('price')} />
          </Field>
          <Field label="Stock" htmlFor="stock" error={errors.stock}>
            <input id="stock" inputMode="numeric" className={inputCls} value={form.stock} onChange={set('stock')} />
          </Field>
        </div>
        <Field label="URL de la imagen" htmlFor="image_url">
          <input id="image_url" className={inputCls} value={form.image_url} onChange={set('image_url')} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Producto activo
        </label>
        <div className="flex gap-3">
          <button type="submit" className={primaryBtn} disabled={submitting}>Guardar</button>
          <button type="button" className={secondaryBtn} onClick={() => navigate('/admin/productos')}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
