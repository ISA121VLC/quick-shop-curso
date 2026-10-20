import { useState } from 'react'
import { listUsers } from '../../api/users.js'
import { Pagination, StateMessage, inputCls, primaryBtn } from '../../components/ui.jsx'
import { useAsync } from '../../hooks.js'

const PAGE_SIZE = 20

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const { status, data, error } = useAsync(
    () => listUsers({ page, page_size: PAGE_SIZE, q: search, role }),
    [page, search, role],
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()) }}
        className="flex flex-wrap items-center gap-3"
      >
        <input aria-label="Buscar usuarios" placeholder="Email o nombre" className={`${inputCls} sm:max-w-xs`}
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filtrar por rol" className={`${inputCls} sm:max-w-[10rem]`} value={role}
          onChange={(e) => { setPage(1); setRole(e.target.value) }}>
          <option value="">Todos los roles</option>
          <option value="customer">Cliente</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit" className={primaryBtn}>Buscar</button>
      </form>
      {status === 'loading' && <StateMessage>Cargando usuarios...</StateMessage>}
      {status === 'error' && <StateMessage tone="error">{error.message}</StateMessage>}
      {status === 'ok' && data.items.length === 0 && <StateMessage>No hay usuarios.</StateMessage>}
      {status === 'ok' && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{u.full_name}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">{u.role === 'admin' ? 'Administrador' : 'Cliente'}</td>
                    <td className="px-3 py-2">{u.is_active ? 'Activo' : 'Inactivo'}</td>
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
