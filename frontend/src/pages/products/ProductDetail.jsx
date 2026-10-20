import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduct } from '../../api/products.js'
import { ProductImage } from '../../components/ProductCard.jsx'
import { StateMessage, inputCls } from '../../components/ui.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAsync } from '../../hooks.js'
import { formatPrice } from '../../utils/validation.js'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const { status, data: product, error } = useAsync(() => getProduct(id), [id])

  if (status === 'loading') return <StateMessage>Cargando producto...</StateMessage>
  if (status === 'error') {
    return (
      <StateMessage tone="error">
        {error.status === 404 ? 'Producto no encontrado' : error.message}
      </StateMessage>
    )
  }

  const soldOut = product.stock === 0
  const isAdmin = user.role === 'admin'
  const clamp = (value) => Math.min(Math.max(1, Number(value) || 1), Math.max(product.stock, 1))

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-indigo-700 hover:underline">Volver al catálogo</Link>
      <div className="grid gap-6 rounded-lg bg-white p-6 shadow-sm md:grid-cols-2">
        <ProductImage src={product.image_url} alt={product.name} className="h-64 w-full rounded-md md:h-80" />
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {!product.is_active && <p className="text-sm font-medium text-amber-700">Producto inactivo</p>}
          <p className="text-slate-700">{product.description}</p>
          <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
          <p className={soldOut ? 'text-red-600' : 'text-slate-600'}>
            {soldOut ? 'Sin stock' : `${product.stock} unidades disponibles`}
          </p>
          {isAdmin ? (
            <Link to={`/admin/productos/${product.id}/editar`} className="text-indigo-700 hover:underline">
              Editar producto
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <input type="number" aria-label="Cantidad" min={1} max={Math.max(product.stock, 1)}
                disabled={soldOut} value={quantity} className={`${inputCls} w-24`}
                onChange={(e) => setQuantity(clamp(e.target.value))} />
              <button type="button" disabled title="Disponible próximamente"
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500 disabled:cursor-not-allowed">
                {soldOut ? 'Sin stock' : 'Añadir al carrito'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
