# Auth — Server Actions

## startImpersonation

```typescript
async (targetUserId: string, companySlug: string, returnTo?: string)
  => Promise<{ ok: true } | { ok: false, error: string }>
```

- **Validação:** Requer role ADMIN ou DEVELOPER
- **Fluxo:**
  1. Busca targetUser no banco (deletedAt: null)
  2. Seta 3 cookies HTTP-Only (user_id, user_name, return_url)
  3. `revalidatePath('/${companySlug}/dashboard', 'layout')`
- **Erro comum:** targetUser não existe → retorna "Usuário não encontrado"

## stopImpersonation

```typescript
async (redirectTo?: string | false)
  => Promise<{ ok: true } | { ok: false, error: string }>
```

- **Validação:** Requer role ADMIN ou DEVELOPER
- **Fluxo:**
  1. Lê cookie `return_url` (fallback se redirectTo não passado)
  2. Se `redirectTo === false`, ignora qualquer redirect (modo privilegiado)
  3. Deleta os 3 cookies de impersonation
  4. `revalidatePath('/', 'layout')`
  5. Se targetUrl existir, faz `redirect(targetUrl)`
- **Comportamentos:**
  - `stopImpersonation()` → redireciona para `returnUrl` do cookie
  - `stopImpersonation('/dashboard-admin')` → redireciona para URL explícita
  - `stopImpersonation(false)` → limpa cookies, **não redireciona**, caller faz refresh

## checkIpStatus

```typescript
async () => Promise<{ blocked, remainingSeconds, reason }>
```

- Conta tentativas de login falhas por IP nas últimas 1h
- Se >= 3 tentativas: retorna `blocked=true` com tempo restante
- Silencia erros de tabela inexistente (P2021)

## Copy-Paste Pattern

```typescript
// Iniciar impersonation (client)
const result = await startImpersonation(userId, companySlug, window.location.href)
if (result.ok) {
  window.open(`/${companySlug}/dashboard`, '_self')
}

// Parar impersonation — modo privilegiado (fica na mesma página)
await stopImpersonation(false)
window.location.reload()

// Parar impersonation — voltar ao painel original
await stopImpersonation() // redirect automático pelo cookie return_url
```
