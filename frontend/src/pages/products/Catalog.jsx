import { useState } from 'react'
import { listProducts } from '../../api/products.js'
import ProductCard from '../../components/ProductCard.jsx'
import { Pagination, StateMessage, inputCls, primaryBtn } from '../../components/ui.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAsync } from '../../hooks.js'

const PAGE_SIZE = 12

export default function Catalog() {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const { status, data, error } = useAsync(
    () =>
      listProducts({
        page,
        page_size: PAGE_SIZE,
        q: search,
        in_stock: inStock ? 'true' : undefined,
      }),
    [page, search, inStock, refresh],
  )

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    setSearch(q.trim())
    setRefresh((n) => n + 1)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Catálogo</h1>
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
        <input aria-label="Buscar productos" placeholder="Buscar por nombre" className={`${inputCls} sm:max-w-xs`}
          value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className={primaryBtn}>Buscar</button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inStock}
            onChange={(e) => { setPage(1); setInStock(e.target.checked) }} />
          En stock
        </label>
      </form>
      {status === 'loading' && <StateMessage>Cargando productos...</StateMessage>}
      {status === 'error' && <StateMessage tone="error">{error.message}</StateMessage>}
      {status === 'ok' && data.items.length === 0 && (
        <StateMessage>No se encontraron productos.</StateMessage>
      )}
      {status === 'ok' && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} isAdmin={user.role === 'admin'} />
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
        </>
      )}
    </div>
  )
}
