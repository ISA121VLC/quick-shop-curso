export function validatePassword(password) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir una mayúscula'
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir una minúscula'
  if (!/\d/.test(password)) return 'La contraseña debe incluir un dígito'
  if (!/[^A-Za-z0-9]/.test(password)) return 'La contraseña debe incluir un símbolo'
  return null
}

export function validateProductForm({ name, price, stock }) {
  const errors = {}
  if (!name.trim()) errors.name = 'El nombre es obligatorio'
  else if (name.trim().length > 200) errors.name = 'El nombre no puede superar 200 caracteres'
  const priceText = String(price).trim()
  if (!/^\d+(\.\d{1,2})?$/.test(priceText)) {
    errors.price = 'El precio debe ser un número con hasta 2 decimales'
  } else if (Number(priceText) <= 0) {
    errors.price = 'El precio debe ser mayor que 0'
  }
  const stockText = String(stock).trim()
  if (!/^\d+$/.test(stockText)) errors.stock = 'El stock debe ser un entero mayor o igual a 0'
  return errors
}

export function formatPrice(value) {
  return `${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}
