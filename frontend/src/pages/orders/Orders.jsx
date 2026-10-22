import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listOrders } from '../../api/orders.js'
import { Badge, Pagination, StateMessage, inputCls } from '../../components/ui.jsx'
import { useAsync } from '../../hooks.js'
import { STATUSES, STATUS_LABELS, formatDate } from '../../utils/orders.js'
import { formatPrice } from '../../utils/validation.js'

const PAGE_SIZE = 10

export default function Orders() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const { status: state, data, error } = useAsync(
    () => listOrders({ page, page_size: PAGE_SIZE, status }),
    [page, status],
  )

  return (
    <div className="space-y-4">
      <h1>Mis pedidos</h1>
      <select aria-label="Filtrar por estado" className={`${inputCls} sm:max-w-[12rem]`} value={status}
        onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
        <option value="">Todos los estados</option>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      {state === 'loading' && <StateMessage>Cargando pedidos...</StateMessage>}
      {state === 'error' && <StateMessage tone="error">{error.message}</StateMessage>}
      {state === 'ok' && data.items.length === 0 && (
        <StateMessage>
          No hay pedidos. <Link to="/">Ver el catálogo</Link>
        </StateMessage>
      )}
      {state === 'ok' && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-alt text-heading">
                <tr>
                  <th className="px-3 py-2">Pedido</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id} className="border-t border-line">
                    <td className="px-3 py-2">#{o.id}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(o.created_at)}</td>
                    <td className="px-3 py-2"><Badge status={o.status} /></td>
                    <td className="whitespace-nowrap px-3 py-2">{formatPrice(o.total)}</td>
                    <td className="whitespace-nowrap px-3 py-2"><Link to={`/pedidos/${o.id}`}>Ver detalle</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
        </>
      )}
    </div>
  )
}
