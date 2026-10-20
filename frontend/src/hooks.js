import { useEffect, useState } from 'react'

// Ejecuta una carga asíncrona y expone { data, status, error } con estados de carga, error y ok.
export function useAsync(load, deps) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, status: 'loading' }))
    load()
      .then((data) => active && setState({ status: 'ok', data, error: null }))
      .catch((error) => active && setState({ status: 'error', data: null, error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
