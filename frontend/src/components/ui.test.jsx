import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge, EmptyState, Field, FormError, ORDER_STATUS, StateMessage } from './ui.jsx'

describe('componentes compartidos de estilo', () => {
  it.each(Object.entries(ORDER_STATUS))('Badge %s aplica sus clases', (status, info) => {
    render(<Badge status={status} />)
    const el = screen.getByText(info.label)
    for (const cls of info.cls.split(' ')) expect(el).toHaveClass(cls)
  })

  it('Badge ignora estados desconocidos', () => {
    const { container } = render(<Badge status="otro" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('el error usa el aviso con borde de acento', () => {
    render(<StateMessage tone="error">Stock superado</StateMessage>)
    expect(screen.getByRole('alert')).toHaveClass('border-l-4', 'border-accent', 'bg-accent-tint', 'text-accent-text')
  })

  it('FormError no renderiza sin mensaje y usa el aviso con mensaje', () => {
    const { rerender } = render(<FormError>{''}</FormError>)
    expect(screen.queryByRole('alert')).toBeNull()
    rerender(<FormError>Fallo</FormError>)
    expect(screen.getByRole('alert')).toHaveClass('bg-accent-tint')
  })

  it('EmptyState usa fondo alternativo y texto principal', () => {
    render(<EmptyState>No hay pedidos</EmptyState>)
    expect(screen.getByRole('status')).toHaveClass('bg-surface-alt', 'text-body')
  })

  it('Field marca el control como invalido cuando hay error', () => {
    render(
      <Field label="Email" htmlFor="e" error="Obligatorio">
        <input id="e" />
      </Field>,
    )
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })
})
