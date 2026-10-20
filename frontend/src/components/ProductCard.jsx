import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/validation.js'

export function ProductImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-slate-200 text-sm text-slate-500 ${className}`}>
        Sin imagen
      </div>
    )
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} onError={() => setFailed(true)} />
}

// Hasta que exista el módulo de carrito, la acción de añadir queda deshabilitada.
export function AddToCartButton({ stock }) {
  const soldOut = stock === 0
  return (
    <button
      type="button"
      disabled
      title={soldOut ? undefined : 'Disponible próximamente'}
      className="w-full rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-500 disabled:cursor-not-allowed"
    >
      {soldOut ? 'Sin stock' : 'Añadir al carrito'}
    </button>
  )
}

export default function ProductCard({ product, isAdmin }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ProductImage src={product.image_url} alt={product.name} className="h-40 w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold">
          <Link to={`/productos/${product.id}`} className="hover:text-indigo-700">
            {product.name}
          </Link>
        </h3>
        <p className="text-lg font-bold">{formatPrice(product.price)}</p>
        <p className={`text-sm ${product.stock === 0 ? 'text-red-600' : 'text-slate-600'}`}>
          {product.stock === 0 ? 'Sin stock' : `${product.stock} en stock`}
        </p>
        {!isAdmin && (
          <div className="mt-auto pt-2">
            <AddToCartButton stock={product.stock} />
          </div>
        )}
      </div>
    </article>
  )
}
