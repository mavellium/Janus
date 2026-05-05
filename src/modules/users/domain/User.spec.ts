import { describe, it, expect } from 'vitest'
import { User } from './User'
import { InvalidEmailError, InvalidPasswordError } from './errors'

describe('User', () => {
  describe('create()', () => {
    it('cria usuário DEFAULT com email e senha válidos', () => {
      const user = User.create({ email: 'test@email.com', hashedPassword: '$2b$12$hash' })
      expect(user.email).toBe('test@email.com')
      expect(user.role).toBe('DEFAULT')
      expect(user.id).toBeDefined()
      expect(user.password).toBe('$2b$12$hash')
    })

    it('normaliza o email para lowercase', () => {
      const user = User.create({ email: 'TEST@EMAIL.COM', hashedPassword: '$2b$12$hash' })
      expect(user.email).toBe('test@email.com')
    })

    it('lança InvalidEmailError para email sem @', () => {
      expect(() =>
        User.create({ email: 'invalidemail', hashedPassword: '$2b$12$hash' })
      ).toThrow(InvalidEmailError)
    })

    it('lança InvalidPasswordError para senha vazia', () => {
      expect(() =>
        User.create({ email: 'test@email.com', hashedPassword: '' })
      ).toThrow(InvalidPasswordError)
    })
  })

  describe('reconstitute()', () => {
    it('reconstitui usuário sem validação', () => {
      const now = new Date()
      const user = User.reconstitute({
        id: 'uuid-123',
        email: 'admin@email.com',
        password: '$2b$12$hash',
        role: 'ADMIN',
        createdAt: now,
      })
      expect(user.id).toBe('uuid-123')
      expect(user.role).toBe('ADMIN')
    })
  })

  describe('toObject()', () => {
    it('retorna os props completos', () => {
      const user = User.create({ email: 'test@email.com', hashedPassword: '$2b$12$hash' })
      const obj = user.toObject()
      expect(obj).toMatchObject({
        email: 'test@email.com',
        role: 'DEFAULT',
        password: '$2b$12$hash',
      })
    })
  })
})
