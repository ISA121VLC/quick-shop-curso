import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrder } from '../../api/orders.js'
import { ProductImage } from '../../components/ProductCard.jsx'
import { StateMessage, primaryBtn, secondaryBtn, inputCls } from '../../components/ui.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { formatPrice } from '../../utils/validation.js'

const MAX_OPTIONS = 100

function quantityOptions(item) {
  const top = Math.max(1, Math.min(item.product.stock, MAX_OPTIONS))
  const options = Array.from({ length: top }, (_, i) => i + 1)
  if (!options.includes(item.quantity)) options.push(item.quantity)
  return options.sort((a, b) => a - b)
}

function CartRow({ item, onChange, onRemove, busy }) {
  const { product } = item
  const unavailable = !item.available
  return (
    <li className="flex flex-wrap items-center gap-4 border-b border-line py-4">
      <ProductImage src={product.image_url} alt={product.name} className="h-16 w-16 shrink-0" />
      <div className="min-w-[10rem] flex-1">
        <h3 className="text-lg">
          <Link to={`/productos/${product.id}`} className="text-heading">{product.name}</Link>
        </h3>
        <p className={unavailable ? 'text-sm text-muted' : 'text-sm text-body'}>
          {formatPrice(product.price)} por unidad
          {unavailable && ' - No disponible'}
        </p>
      </div>
      <div className="w-24">
        <select
          aria-label={`Cantidad de ${product.name}`}
          className={inputCls}
          value={item.quantity}
          disabled={unavailable || busy}
          onChange={(e) => onChange(item, Number(e.target.value))}
        >
          {quantityOptions(item).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <p className="w-24 text-right text-heading">{formatPrice(item.subtotal)}</p>
      <button type="button" className={secondaryBtn} disabled={busy} onClick={() => onRemove(item)}>
        Eliminar
      </button>
    </li>
  )
}

export default function Cart() {
  const { cart, loading, error, updateItem, removeItem, clear, refresh } = useCart()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function perform(operation) {
    setBusy(true)
    setActionError(null)
    try {
      await operation()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleOrder() {
    setBusy(true)
    setActionError(null)
    try {
      const order = await createOrder()
      await refresh()
      navigate(`/pedidos/${order.id}`)
    } catch (e) {
      setActionError(e.message)
      setConfirming(false)
      await refresh()
      setBusy(false)
    }
  }

  if (!cart && loading) return <StateMessage>Cargando carrito...</StateMessage>
  if (!cart && error) return <StateMessage tone="error">{error.message}</StateMessage>
  if (!cart) return null

  const hasUnavailable = cart.items.some((i) => !i.available)

  return (
    <div className="space-y-4">
      <h1>Carrito</h1>
      {actionError && <StateMessage tone="error">{actionError}</StateMessage>}
      {cart.items.length === 0 ? (
        <StateMessage>
          Tu carrito está vacío. <Link to="/">Ver el catálogo</Link>
        </StateMessage>
      ) : confirming ? (
        <section aria-label="Confirmación de pedido" className="space-y-4">
          <h2>Confirmar pedido</h2>
          <ul className="border-t border-line">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 border-b border-line py-3">
                <span>{item.product.name} x {item.quantity}</span>
                <span>{formatPrice(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <p className="text-right text-lg text-heading">Total: {formatPrice(cart.total)}</p>
          <div className="flex justify-end gap-3">
            <button type="button" className={secondaryBtn} disabled={busy} onClick={() => setConfirming(false)}>
              Volver al carrito
            </button>
            <button type="button" className={primaryBtn} disabled={busy} onClick={handleOrder}>
              Confirmar pedido
            </button>
          </div>
        </section>
      ) : (
        <>
          <ul className="border-t border-line">
            {cart.items.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                busy={busy}
                onChange={(it, quantity) => perform(() => updateItem(it.id, quantity))}
                onRemove={(it) => perform(() => removeItem(it.id))}
              />
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" className={secondaryBtn} disabled={busy} onClick={() => perform(clear)}>
              Vaciar carrito
            </button>
            <div className="space-y-2 text-right">
              <p className="text-lg text-heading">Total: {formatPrice(cart.total)}</p>
              {hasUnavailable && (
                <p className="text-sm text-accent-text">
                  Elimina los productos no disponibles para poder realizar el pedido.
                </p>
              )}
              <button
                type="button"
                className={primaryBtn}
                disabled={busy || hasUnavailable}
                onClick={() => setConfirming(true)}
              >
                Realizar pedido
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
