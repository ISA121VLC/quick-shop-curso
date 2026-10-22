import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cancelOrder, getOrder } from '../../api/orders.js'
import OrderItems from '../../components/OrderItems.jsx'
import { Badge, StateMessage, secondaryBtn } from '../../components/ui.jsx'
import { useAsync } from '../../hooks.js'
import { formatDate } from '../../utils/orders.js'

export default function OrderDetail() {
  const { id } = useParams()
  const { status, data, error } = useAsync(() => getOrder(id), [id])
  const [updated, setUpdated] = useState(null)
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

  async function handleCancel() {
    setBusy(true)
    setActionError(null)
    try {
      setUpdated(await cancelOrder(order.id))
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/pedidos" className="text-sm">Volver a mis pedidos</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1>Pedido #{order.id}</h1>
        <Badge status={order.status} />
      </div>
      <p className="text-sm text-muted">Realizado el {formatDate(order.created_at)}</p>
      {actionError && <StateMessage tone="error">{actionError}</StateMessage>}
      <OrderItems order={order} />
      {order.status === 'pending' && (
        <button type="button" className={secondaryBtn} disabled={busy} onClick={handleCancel}>
          Cancelar pedido
        </button>
      )}
    </div>
  )
}
