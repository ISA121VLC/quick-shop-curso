import { request } from './client.js'

export const getCart = () => request('/cart')
export const addItem = (productId, quantity = 1) =>
  request('/cart/items', { method: 'POST', body: { product_id: productId, quantity } })
export const updateItem = (itemId, quantity) =>
  request(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } })
export const removeItem = (itemId) => request(`/cart/items/${itemId}`, { method: 'DELETE' })
export const clearCart = () => request('/cart', { method: 'DELETE' })
