import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './client.js'

function mockFetch(status, body) {
  const fn = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('request', () => {
  it('envía credenciales y serializa el cuerpo y los parámetros', async () => {
    const fetchMock = mockFetch(200, { ok: true })
    await request('/products', { method: 'POST', body: { a: 1 }, params: { q: 'x', skip: '' } })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url.pathname).toBe('/api/products')
    expect(url.searchParams.get('q')).toBe('x')
    expect(url.searchParams.has('skip')).toBe(false)
    expect(options.credentials).toBe('include')
    expect(options.body).toBe('{"a":1}')
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  it('devuelve null en 204', async () => {
    mockFetch(204, null)
    expect(await request('/auth/logout', { method: 'POST' })).toBeNull()
  })

  it('lanza ApiError con el detalle de texto', async () => {
    mockFetch(401, { detail: 'No autenticado' })
    await expect(request('/auth/me')).rejects.toMatchObject({ status: 401, message: 'No autenticado' })
  })

  it('une los mensajes de validación 422', async () => {
    mockFetch(422, { detail: [{ msg: 'Value error, Falta mayúscula' }] })
    const error = await request('/x').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Falta mayúscula')
  })
})
