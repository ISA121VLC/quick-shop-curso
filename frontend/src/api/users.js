import { request } from './client.js'

export const updateMe = (body) => request('/users/me', { method: 'PATCH', body })
export const changePassword = (body) => request('/users/me/password', { method: 'POST', body })
export const listUsers = (params) => request('/users', { params })
