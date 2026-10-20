import { describe, expect, it } from 'vitest'
import { formatPrice, validatePassword, validateProductForm } from './validation.js'

describe('validatePassword', () => {
  it.each([
    ['Ab1!', 'al menos 8'],
    ['sinmayuscula1!', 'mayúscula'],
    ['SINMINUSCULA1!', 'minúscula'],
    ['SinDigito!!', 'dígito'],
    ['SinSimbolo123', 'símbolo'],
  ])('rechaza %s', (password, fragment) => {
    expect(validatePassword(password)).toContain(fragment)
  })

  it('acepta una contraseña fuerte', () => {
    expect(validatePassword('Valida123!')).toBeNull()
  })
})

describe('validateProductForm', () => {
  const valid = { name: 'Lámpara', price: '19.90', stock: '5' }

  it('acepta datos válidos', () => {
    expect(validateProductForm(valid)).toEqual({})
  })

  it.each(['0', '-1', '10.999', 'abc', ''])('rechaza el precio %s', (price) => {
    expect(validateProductForm({ ...valid, price }).price).toBeDefined()
  })

  it.each(['-1', '1.5', 'x', ''])('rechaza el stock %s', (stock) => {
    expect(validateProductForm({ ...valid, stock }).stock).toBeDefined()
  })

  it('exige nombre', () => {
    expect(validateProductForm({ ...valid, name: '  ' }).name).toBeDefined()
  })

  it('acepta stock 0', () => {
    expect(validateProductForm({ ...valid, stock: '0' })).toEqual({})
  })
})

describe('formatPrice', () => {
  it('muestra dos decimales', () => {
    expect(formatPrice('29.9')).toContain('29,90')
  })
})
