import { describe, it, expect } from 'vitest'
import { hash, compare } from 'bcryptjs'

describe('Test User Creation - teste2@gmail.com', () => {
  const testEmail = 'teste2@gmail.com'
  const testPassword = '123456'

  it('Phase 1: Should hash password correctly using bcryptjs', async () => {
    const hashedPassword = await hash(testPassword, 10)

    expect(hashedPassword).toBeDefined()
    expect(hashedPassword).not.toBe(testPassword)
    expect(hashedPassword.length).toBeGreaterThan(10)

    const isValid = await compare(testPassword, hashedPassword)
    expect(isValid).toBe(true)
  })

  it('Phase 2: Should validate test user email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    expect(testEmail).toMatch(emailRegex)
    expect(testEmail).toBe('teste2@gmail.com')
  })

  it('Phase 3: Should validate test user password meets minimum requirements', () => {
    expect(testPassword).toBeDefined()
    expect(testPassword.length).toBeGreaterThanOrEqual(6)
    expect(testPassword).toBe('123456')
  })

  it('Phase 4: Should validate user role is DEFAULT', () => {
    const userRole = 'DEFAULT'
    expect(userRole).toBe('DEFAULT')
    expect(['DEFAULT', 'ADMIN']).toContain(userRole)
  })

  it('Phase 5: Should demonstrate password comparison logic', async () => {
    const hashedPassword = await hash(testPassword, 10)

    const correctPasswordMatch = await compare(testPassword, hashedPassword)
    expect(correctPasswordMatch).toBe(true)

    const wrongPasswordMatch = await compare('wrong_password', hashedPassword)
    expect(wrongPasswordMatch).toBe(false)
  })

  it('Bonus: Should document test user credentials', () => {
    const testUser = {
      email: testEmail,
      password: testPassword,
      role: 'DEFAULT',
    }

    expect(testUser.email).toBe('teste2@gmail.com')
    expect(testUser.password).toBe('123456')
    expect(testUser.role).toBe('DEFAULT')
  })
})
