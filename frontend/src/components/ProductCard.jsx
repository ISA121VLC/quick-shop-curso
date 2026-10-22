import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { StateMessage, primaryBtn } from './ui.jsx'
import { formatPrice } from '../utils/validation.js'

export function ProductImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-surface-alt text-sm text-body ${className}`}>
        Sin imagen
      </div>
    )
  }
  return <img src={src} alt={alt} className={`object-cover ${className}`} onError={() => setFailed(true)} />
}

// Añade el producto al carrito y muestra el resultado; con stock 0 queda deshabilitado.
export function AddToCartButton({ productId, stock, quantity = 1, className = 'w-full' }) {
  const { addItem } = useCart()
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)
  const soldOut = stock === 0

  async function handleAdd() {
    setBusy(true)
    setMessage(null)
    try {
      await addItem(productId, quantity)
      setMessage({ tone: 'ok', text: 'Añadido al carrito' })
    } catch (e) {
      setMessage({ tone: 'error', text: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={soldOut || busy}
        onClick={handleAdd}
        className={`${primaryBtn} ${className}`}
      >
        {soldOut ? 'Sin stock' : 'Añadir al carrito'}
      </button>
      {message?.tone === 'error' && <StateMessage tone="error">{message.text}</StateMessage>}
      {message?.tone === 'ok' && (
        <p role="status" className="text-sm text-teal-brand">
          {message.text}
        </p>
      )}
    </div>
  )
}

export default function ProductCard({ product, isAdmin }) {
  return (
    <article className="flex flex-col overflow-hidden border-b border-line bg-surface">
      <ProductImage src={product.image_url} alt={product.name} className="h-40 w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg">
          <Link to={`/productos/${product.id}`} className="text-heading">
            {product.name}
          </Link>
        </h3>
        <p className="text-lg text-heading">{formatPrice(product.price)}</p>
        <p className={`text-sm ${product.stock === 0 ? 'text-muted' : 'text-body'}`}>
          {product.stock === 0 ? 'Sin stock' : `${product.stock} en stock`}
        </p>
        {!isAdmin && (
          <div className="mt-auto pt-2">
            <AddToCartButton productId={product.id} stock={product.stock} />
          </div>
        )}
      </div>
    </article>
  )
}
