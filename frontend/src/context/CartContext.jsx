import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as cartApi from '../api/cart.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const isCustomer = user?.role === 'customer'
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!isCustomer) return null
    setLoading(true)
    setError(null)
    try {
      const data = await cartApi.getCart()
      setCart(data)
      return data
    } catch (e) {
      setError(e)
      return null
    } finally {
      setLoading(false)
    }
  }, [isCustomer])

  // Solo los clientes tienen carrito: el admin y la sesión cerrada no hacen peticiones.
  useEffect(() => {
    if (isCustomer) refresh()
    else {
      setCart(null)
      setError(null)
    }
  }, [isCustomer, user?.id, refresh])

  // Cada operación devuelve el carrito actualizado y propaga el error (por ejemplo 409 de stock).
  const run = useCallback(async (operation) => {
    const data = await operation()
    setCart(data)
    return data
  }, [])

  const value = useMemo(
    () => ({
      cart,
      itemCount: cart?.item_count ?? 0,
      loading,
      error,
      refresh,
      addItem: (productId, quantity = 1) => run(() => cartApi.addItem(productId, quantity)),
      updateItem: (itemId, quantity) => run(() => cartApi.updateItem(itemId, quantity)),
      removeItem: (itemId) => run(() => cartApi.removeItem(itemId)),
      clear: () => run(() => cartApi.clearCart()),
    }),
    [cart, loading, error, refresh, run],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
