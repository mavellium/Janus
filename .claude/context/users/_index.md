# Users — Sumário Executivo

Gerenciamento de usuários: autenticação, multi-empresa (UserCompany), perfil, preferências e fluxo de login com roteamento inteligente.

## Responsabilidades

| Aspecto | Responsável |
|---------|-------------|
| Entidade | `User` (Prisma) — id, email, password (bcrypt), role, companyId (nullable), permissions (String[]) |
| Relação M:N | `UserCompany` — userId + companyId + permissions; @@unique([userId, companyId]) |
| Login | `signInAction` — Auth.js credentials + roteamento pós-login |
| Perfil | `updateProfile`, `updateAvatar`, `changePassword` |
| Preferências | `updatePreferences`, `getUserPreferences` |
| Multi-empresa | `getUserCompanies` — lista empresas via company + UserCompany |

## Actions (`src/modules/users/actions/`)

| Action | Assinatura | Descrição |
|--------|-----------|-----------|
| `signInAction` | `(prev, FormData) → { error?, redirectUrl? }` | Valida credentials; redireciona: DEVELOPER → `/dev/{id}/dashboard`; ADMIN → `/dashboard-admin`; DEFAULT sem empresa → `/no-company`; 1 empresa → `/{slug}/dashboard`; múltiplas → `/select-company` |
| `registerUser` | `(prev, FormData) → { ok, error? }` | Cria user DEFAULT com bcrypt hash; valida email único |
| `updateProfile` | `(prev, FormData) → { ok, error? }` | Atualiza name, email, phone |
| `updateAvatar` | `(url: string) → { ok }` | Persiste URL do avatar (BunnyCDN) |
| `changePassword` | `(prev, FormData) → { ok, error? }` | Valida senha atual; hash nova senha; suporta `requiresPasswordReset` |
| `resetPasswordFirstAccess` | `(prev, FormData) → { ok, error?, redirectUrl? }` | Primeira senha obrigatória pós-criação |
| `updatePreferences` | `(prefs: Partial<Json>) → void` | Merge parcial no campo `preferences` |
| `getUserPreferences` | `() → Json` | Lê preferences do user logado |

## Queries (`src/modules/users/queries/`)

| Query | Retorno | Uso |
|-------|---------|-----|
| `getUserByEmail(email)` | User com company, preferences, image | Login / session |
| `getUserCompanies(userId)` | `{ companyId, name, slug, permissions }[]` | Página `/select-company` e sidebar |

## Fluxo de Login (DEFAULT)

```
signInAction → Auth.js (credentials) → busca user com companies
  ├─ requiresPasswordReset? → /first-access
  ├─ 0 empresas vinculadas → /no-company (bloqueio)
  ├─ 1 empresa → /{slug}/dashboard (direto)
  └─ 2+ empresas → /select-company (grid de escolha)
```

## Páginas Relacionadas

- `/first-access` — troca de senha obrigatória (requiresPasswordReset)
- `/no-company` — tela de bloqueio elegante com signOut
- `/select-company` — grid de empresas; badge "Principal"; loading por card
- `/{slug}/dashboard/settings` — perfil, senha, webhook, preferências

## Para usar este módulo, você deve saber

- [ ] `companyId` em User é nullable — empresa primária (legacy); relação real via `UserCompany`
- [ ] `requiresPasswordReset=true` redireciona para `/first-access` no login
- [ ] `permissions` é `String[]` no formato `module:tier:PERMISSION_NAME`
- [ ] ADMINs recebem `ALL_PERMISSIONS` na criação
- [ ] `signInAction` retorna `{ redirectUrl }` que o client usa para `router.push`
- [ ] Preferências incluem: `sidebar_collapsed`, `theme` (light/dark)
