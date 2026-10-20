export const ADMIN = { email: 'admin@quickshop.com', password: 'Admin1234!' }
export const CUSTOMER = { email: 'cliente1@quickshop.com', password: 'Cliente1234!' }

export async function login(page, { email, password }, { expectSuccess = true } = {}) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  if (expectSuccess) await page.waitForURL((url) => !url.pathname.endsWith('/login'))
}

export const uniqueId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`
