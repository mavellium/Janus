# Auth — Queries

## getUserAuthMethods (`src/modules/auth/queries/getUserAuthMethods.ts`)

- **Retorna:** `UserAuthMethods` = `{ googleProviderAvailable, googleAuthEnabled, googleAccount: { providerEmail, linkedAt, lastLoginAt } | null }`
- **Datas:** serializadas em ISO string (atravessa a fronteira Server → Client Component)
- **`googleProviderAvailable`:** `isGoogleAuthConfigured()` — quando `false`, o painel não renderiza o card
- **Uso:** `const authMethods = await getUserAuthMethods(userId)` nas 3 pages de configurações (tenant, dev, admin)

## getPasswordResetTokenStatus (`src/modules/auth/queries/getPasswordResetTokenStatus.ts`)

- **Retorna:** `{ valid: boolean; email: string | null }`
- **Filtros:** `tokenHash` (sha256 do token da URL), `usedAt: null`, `expiresAt > now`, `user.deletedAt: null`
- **Uso:** `/reset-password/[token]/page.tsx` decide entre formulário e tela "Link inválido ou expirado" — o token em claro nunca sai da URL/servidor

## getCompanyUsers (`src/modules/auth/queries/getCompanyUsers.ts`)

- **Retorna:** usuários ativos da empresa (id, name, email, role) ordenados por name — usado por impersonação/permissões
