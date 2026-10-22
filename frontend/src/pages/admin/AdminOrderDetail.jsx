import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrder, updateOrderStatus } from '../../api/orders.js'
import { getUser } from '../../api/users.js'
import OrderItems from '../../components/OrderItems.jsx'
import { Badge, StateMessage, inputCls, primaryBtn } from '../../components/ui.jsx'
import { useAsync } from '../../hooks.js'
import { STATUS_LABELS, STATUS_TRANSITIONS, formatDate } from '../../utils/orders.js'

export default function AdminOrderDetail() {
  const { id } = useParams()
  const { status, data, error } = useAsync(() => getOrder(id), [id])
  const customer = useAsync(
    () => (data ? getUser(data.user_id) : Promise.resolve(null)),
    [data?.user_id],
  )
  const [updated, setUpdated] = useState(null)
  const [next, setNext] = useState('')
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (status === 'loading') return <StateMessage>Cargando pedido...</StateMessage>
  if (status === 'error') {
    return (
      <StateMessage tone="error">
        {error.status === 404 ? 'Pedido no encontrado' : error.message}
      </StateMessage>
    )
  }

  const order = updated?.id === data.id ? updated : data
  const options = STATUS_TRANSITIONS[order.status] ?? []

  async function handleSubmit(e) {
    e.preventDefault()
    if (!next) return
    setBusy(true)
    setActionError(null)
    try {
      setUpdated(await updateOrderStatus(order.id, next))
      setNext('')
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/admin/pedidos" className="text-sm">Volver a pedidos</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1>Pedido #{order.id}</h1>
        <Badge status={order.status} />
      </div>
      <p className="text-sm text-body">
        Cliente: {customer.data ? `${customer.data.full_name} (${customer.data.email})` : `#${order.user_id}`}
        {' - '}
        {formatDate(order.created_at)}
      </p>
      {actionError && <StateMessage tone="error">{actionError}</StateMessage>}
      <OrderItems order={order} />
      {options.length > 0 ? (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <select aria-label="Nuevo estado" className={`${inputCls} sm:max-w-[12rem]`} value={next}
            onChange={(e) => setNext(e.target.value)}>
            <option value="">Cambiar estado a...</option>
            {options.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button type="submit" className={primaryBtn} disabled={busy || !next}>Aplicar</button>
        </form>
      ) : (
        <p className="text-sm text-muted">Estado final: no admite más cambios.</p>
      )}
    </div>
  )
}
