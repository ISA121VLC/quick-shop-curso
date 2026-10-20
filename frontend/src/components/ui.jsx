export const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
export const primaryBtn =
  'inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500'
export const secondaryBtn =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50'

export function StateMessage({ children, tone = 'neutral' }) {
  const color = tone === 'error' ? 'text-red-700 bg-red-50' : 'text-slate-600 bg-white'
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border border-slate-200 p-8 text-center text-sm ${color}`}
    >
      {children}
    </div>
  )
}

export function Field({ label, htmlFor, error, children }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function FormError({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  )
}

export function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <nav className="flex items-center justify-between gap-2" aria-label="Paginación">
      <button className={secondaryBtn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span className="text-sm text-slate-600">
        Página {page} de {pages}
      </span>
      <button className={secondaryBtn} disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
    </nav>
  )
}
