import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { hash, compare } from 'bcryptjs'
import { db } from '@/lib/prisma'

describe('Test User Creation - teste2@gmail.com', () => {
  const testEmail = 'teste2@gmail.com'
  const testPassword = '123456'

  beforeAll(async () => {
    try {
      await db.user.deleteMany({
        where: { email: testEmail },
      })
    } catch {
      console.log('ℹ No existing test user to remove')
    }
  })

  afterAll(async () => {
    await db.$disconnect()
  })

  it('Phase 1: Should hash password correctly', async () => {
    const hashedPassword = await hash(testPassword, 10)

    expect(hashedPassword).toBeDefined()
    expect(hashedPassword).not.toBe(testPassword)
    expect(hashedPassword.length).toBeGreaterThan(10)

    const isValid = await compare(testPassword, hashedPassword)
    expect(isValid).toBe(true)
  })

  it('Phase 2: Should create test user in database', async () => {
    const hashedPassword = await hash(testPassword, 10)

    const user = await db.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        role: 'DEFAULT',
      },
    })

    expect(user).toBeDefined()
    expect(user.id).toBeDefined()
    expect(user.email).toBe(testEmail)
    expect(user.role).toBe('DEFAULT')
    expect(user.deletedAt).toBeNull()
    expect(user.createdAt).toBeDefined()
  })

  it('Phase 3: Should retrieve test user from database', async () => {
    const user = await db.user.findUnique({
      where: { email: testEmail },
    })

    expect(user).toBeDefined()
    expect(user?.email).toBe(testEmail)
    expect(user?.role).toBe('DEFAULT')
  })

  it('Phase 4: Should authenticate with test user credentials', async () => {
    const user = await db.user.findUnique({
      where: { email: testEmail },
    })

    expect(user).toBeDefined()

    if (user) {
      const isPasswordValid = await compare(testPassword, user.password)
      expect(isPasswordValid).toBe(true)
    }
  })

  it('Phase 5: Should reject wrong password for test user', async () => {
    const user = await db.user.findUnique({
      where: { email: testEmail },
    })

    expect(user).toBeDefined()

    if (user) {
      const isPasswordValid = await compare('wrong_password', user.password)
      expect(isPasswordValid).toBe(false)
    }
  })
})
