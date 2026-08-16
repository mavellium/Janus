import { describe, it, expect, vi, beforeEach } from 'vitest'

const store = new Map<string, string>()

const cookieStore = {
  get: (name: string) => {
    const value = store.get(name)
    return value === undefined ? undefined : { name, value }
  },
  set: (name: string, value: string, options?: { maxAge?: number }) => {
    if (options?.maxAge === 0) {
      store.delete(name)
      return
    }
    store.set(name, value)
  },
}

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))

const {
  REMEMBER_SESSION_COOKIE,
  REMEMBERED_EMAIL_COOKIE,
  REMEMBERED_SESSION_MAX_AGE,
  SHORT_SESSION_MAX_AGE,
  resolveSessionMaxAge,
  saveSessionPreference,
  readSessionPreference,
} = await import('./session')

describe('preferência de sessão', () => {
  beforeEach(() => {
    store.clear()
  })

  it('usa a sessão longa quando nenhuma preferência foi gravada', async () => {
    expect(await resolveSessionMaxAge()).toBe(REMEMBERED_SESSION_MAX_AGE)
  })

  it('guarda o e-mail e mantém a sessão longa quando o usuário marca "lembrar"', async () => {
    await saveSessionPreference(true, 'pessoa@empresa.com')

    expect(store.get(REMEMBER_SESSION_COOKIE)).toBe('1')
    expect(await resolveSessionMaxAge()).toBe(REMEMBERED_SESSION_MAX_AGE)
    expect(await readSessionPreference()).toEqual({
      remember: true,
      email: 'pessoa@empresa.com',
    })
  })

  it('encurta a sessão e apaga o e-mail quando o usuário desmarca', async () => {
    await saveSessionPreference(true, 'pessoa@empresa.com')
    await saveSessionPreference(false, 'pessoa@empresa.com')

    expect(store.get(REMEMBER_SESSION_COOKIE)).toBe('0')
    expect(store.has(REMEMBERED_EMAIL_COOKIE)).toBe(false)
    expect(await resolveSessionMaxAge()).toBe(SHORT_SESSION_MAX_AGE)
    expect(await readSessionPreference()).toEqual({ remember: false, email: '' })
  })
})
