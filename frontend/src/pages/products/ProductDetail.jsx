import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduct } from '../../api/products.js'
import { AddToCartButton, ProductImage } from '../../components/ProductCard.jsx'
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
      <Link to="/" className="text-sm">Volver al catálogo</Link>
      <div className="grid gap-6 border border-line bg-surface p-6 md:grid-cols-2">
        <ProductImage src={product.image_url} alt={product.name} className="h-64 w-full md:h-80" />
        <div className="space-y-4">
          <h1>{product.name}</h1>
          {!product.is_active && <p className="text-sm text-accent-text">Producto inactivo</p>}
          <p className="text-body">{product.description}</p>
          <p className="text-2xl text-heading">{formatPrice(product.price)}</p>
          <p className={soldOut ? 'text-muted' : 'text-body'}>
            {soldOut ? 'Sin stock' : `${product.stock} unidades disponibles`}
          </p>
          {isAdmin ? (
            <Link to={`/admin/productos/${product.id}/editar`}>
              Editar producto
            </Link>
          ) : (
            <div className="flex flex-wrap items-start gap-3">
              <input type="number" aria-label="Cantidad" min={1} max={Math.max(product.stock, 1)}
                disabled={soldOut} value={quantity} className={`${inputCls} w-24`}
                onChange={(e) => setQuantity(clamp(e.target.value))} />
              <AddToCartButton productId={product.id} stock={product.stock} quantity={quantity} className="" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
