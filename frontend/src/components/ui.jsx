import { Children, cloneElement, isValidElement } from 'react'
import { STATUS_LABELS } from '../utils/orders.js'

export const inputCls =
  'w-full border border-line bg-surface px-3 py-2.5 text-sm text-body focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-inset focus:ring-accent-text aria-invalid:border-accent-text'
export const primaryBtn =
  'inline-flex items-center justify-center border border-transparent bg-accent px-6 py-3 text-sm font-normal text-ink enabled:hover:bg-accent-text enabled:hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-alt disabled:text-muted'
export const secondaryBtn =
  'inline-flex items-center justify-center border border-heading bg-transparent px-6 py-3 text-sm font-normal text-heading enabled:hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50'
export const noticeCls = 'border-l-4 border-accent bg-accent-tint px-4 py-3 text-sm text-accent-text'

export function EmptyState({ children }) {
  return (
    <div role="status" className="bg-surface-alt p-8 text-center text-sm text-body">
      {children}
    </div>
  )
}

export function StateMessage({ children, tone = 'neutral' }) {
  if (tone === 'error') {
    return (
      <div role="alert" className={noticeCls}>
        {children}
      </div>
    )
  }
  return <EmptyState>{children}</EmptyState>
}

export function Field({ label, htmlFor, error, children }) {
  const control = error
    ? Children.map(children, (child) =>
        isValidElement(child) ? cloneElement(child, { 'aria-invalid': true }) : child,
      )
    : children
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm text-heading">
        {label}
      </label>
      {control}
      {error && (
        <p role="alert" className="text-sm text-accent-text">
          {error}
        </p>
      )}
    </div>
  )
}

export function FormError({ children }) {
  if (!children) return null
  return (
    <p role="alert" className={noticeCls}>
      {children}
    </p>
  )
}

export const ORDER_STATUS = {
  pending: { label: STATUS_LABELS.pending, cls: 'bg-accent-tint text-accent-text' },
  confirmed: { label: STATUS_LABELS.confirmed, cls: 'bg-surface-alt text-teal-brand' },
  shipped: { label: STATUS_LABELS.shipped, cls: 'bg-teal-brand text-white' },
  delivered: { label: STATUS_LABELS.delivered, cls: 'bg-slate-brand text-white' },
  cancelled: { label: STATUS_LABELS.cancelled, cls: 'bg-surface-alt text-body' },
}

export function Badge({ status }) {
  const info = ORDER_STATUS[status]
  if (!info) return null
  return (
    <span data-status={status} className={`inline-block px-2 py-1 text-sm ${info.cls}`}>
      {info.label}
    </span>
  )
}

export function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <nav className="flex items-center justify-between gap-2" aria-label="Paginación">
      <button className={secondaryBtn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span className="text-sm text-muted">
        Página {page} de {pages}
      </span>
      <button className={secondaryBtn} disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
    </nav>
  )
}
