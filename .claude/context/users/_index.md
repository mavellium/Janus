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
| `signInAction` | `(prev, FormData) → { error?, redirectUrl? }` | Valida credentials; redireciona: DEVELOPER → `/dev/{id}/dashboard`; ADMIN → `/dashboard-admin`; DEFAULT roteado por **empresas vinculadas** (UserCompany): 0 → `/no-company`; 1 → `/{slug}/dashboard`; 2+ → `/select-company`. `companyId` primário é fallback só quando não há nenhum vínculo |
| `registerUser` | `(prev, FormData) → { ok, error? }` | Cria user DEFAULT com bcrypt hash; valida email único |
| `updateProfile` | `(prev, FormData) → { ok, error? }` | Atualiza name, email, phone |
| `updateAvatar` | `(url: string) → { ok }` | Persiste URL do avatar (BunnyCDN) |
| `changePassword` | `(prev, FormData) → { ok, error? }` | Valida senha atual; hash nova senha; suporta `requiresPasswordReset` |
| `resetPasswordFirstAccess` | `(prev, FormData) → { ok, error?, redirectUrl? }` | Primeira senha obrigatória pós-criação |
| `updatePreferences` | `(prefs: Partial<Json>) → { ok, error? }` | Merge parcial no campo `preferences`; **impersonation-aware** (grava no usuário efetivo) |
| `restartOnboarding` | `({ companySlug }) → void \| { ok:false, error }` | Reseta `preferences.onboarding` para `pending/step:0` e redireciona; grava no usuário impersonado quando há impersonation |
| `getUserPreferences` | `() → Json` | Lê preferences do user logado |

## Queries (`src/modules/users/queries/`)

| Query | Retorno | Uso |
|-------|---------|-----|
| `getUserByEmail(email)` | User com company, preferences, image | Login / session |
| `getUserCompanies(userId)` | `{ companyId, name, slug, permissions }[]` | Sidebar switcher; deriva de **empresas vinculadas** (UserCompany), com `companyId` primário como fallback só quando não há vínculo (dedup por id, ignora `deletedAt`) |

## Fluxo de Login (DEFAULT)

```
signInAction → Auth.js (credentials) → busca user com companies (vínculos ativos)
  ├─ requiresPasswordReset? → /first-access
  ├─ 0 vínculos (e sem companyId primário) → /no-company (bloqueio)
  ├─ 1 empresa vinculada → /{slug}/dashboard (direto)
  └─ 2+ empresas vinculadas → /select-company (grid de escolha)
```

> **Contagem de empresas = vínculos `UserCompany`.** O `companyId` primário (legacy) NÃO é somado ao total — entra apenas como fallback quando o usuário não tem nenhum vínculo. Isso evita que o switcher/`/select-company` apareça para quem tem só 1 empresa vinculada mas um `companyId` primário divergente. `getUserCompanies`, `signInAction` e `/select-company` seguem a mesma regra.

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
- [ ] Preferências incluem: `sidebar_collapsed`, `theme`/`darkMode`, `notifications_last_seen_at`, `onboarding` (`{ status, step }`)
- [ ] `updatePreferences`/`restartOnboarding` gravam no **usuário efetivo** (impersonado quando há impersonation) — necessário para o tour funcionar ao inspecionar um usuário
