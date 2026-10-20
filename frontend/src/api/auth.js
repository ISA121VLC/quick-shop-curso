import { request } from './client.js'

export const register = (body) => request('/auth/register', { method: 'POST', body })
export const login = (body) => request('/auth/login', { method: 'POST', body })
export const logout = () => request('/auth/logout', { method: 'POST' })
export const me = () => request('/auth/me')
