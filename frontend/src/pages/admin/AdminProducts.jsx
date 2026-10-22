import { useState } from 'react'
import { Link } from 'react-router-dom'
import { deactivateProduct, listProducts } from '../../api/products.js'
import { Pagination, StateMessage, primaryBtn, secondaryBtn } from '../../components/ui.jsx'
import { useAsync } from '../../hooks.js'
import { formatPrice } from '../../utils/validation.js'

const PAGE_SIZE = 10

export default function AdminProducts() {
  const [page, setPage] = useState(1)
  const [version, setVersion] = useState(0)
  const [actionError, setActionError] = useState('')
  const { status, data, error } = useAsync(
    () => listProducts({ page, page_size: PAGE_SIZE, include_inactive: 'true' }),
    [page, version],
  )

  async function handleDeactivate(product) {
    if (!window.confirm(`¿Desactivar "${product.name}"?`)) return
    try {
      await deactivateProduct(product.id)
      setActionError('')
      setVersion((v) => v + 1)
    } catch (err) {
      setActionError(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1>Gestión de productos</h1>
        <Link to="/admin/productos/nuevo" className={primaryBtn}>Nuevo producto</Link>
      </div>
      {actionError && <StateMessage tone="error">{actionError}</StateMessage>}
      {status === 'loading' && <StateMessage>Cargando productos...</StateMessage>}
      {status === 'error' && <StateMessage tone="error">{error.message}</StateMessage>}
      {status === 'ok' && data.items.length === 0 && <StateMessage>No hay productos.</StateMessage>}
      {status === 'ok' && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-alt text-heading">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Precio</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{formatPrice(p.price)}</td>
                    <td className="px-3 py-2">{p.stock}</td>
                    <td className="px-3 py-2">{p.is_active ? 'Activo' : 'Inactivo'}</td>
                    <td className="flex gap-2 px-3 py-2">
                      <Link to={`/admin/productos/${p.id}/editar`} className={secondaryBtn}>Editar</Link>
                      {p.is_active && (
                        <button className={secondaryBtn} onClick={() => handleDeactivate(p)}>
                          Desactivar
                        </button>
                      )}
                    </td>
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
