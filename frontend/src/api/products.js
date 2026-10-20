import { request } from './client.js'

export const listProducts = (params) => request('/products', { params })
export const getProduct = (id) => request(`/products/${id}`)
export const createProduct = (body) => request('/products', { method: 'POST', body })
export const replaceProduct = (id, body) => request(`/products/${id}`, { method: 'PUT', body })
export const deactivateProduct = (id) => request(`/products/${id}`, { method: 'DELETE' })
