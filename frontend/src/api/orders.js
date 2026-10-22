import { request } from './client.js'

export const createOrder = () => request('/orders', { method: 'POST' })
export const listOrders = (params) => request('/orders', { params })
export const getOrder = (id) => request(`/orders/${id}`)
export const cancelOrder = (id) => request(`/orders/${id}/cancel`, { method: 'POST' })
export const updateOrderStatus = (id, status) =>
  request(`/orders/${id}/status`, { method: 'PATCH', body: { status } })
