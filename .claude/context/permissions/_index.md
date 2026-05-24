# Auth/Permissions — Sumário Executivo

Gerenciamento de permissões RBAC, impersonation por usuário específico e controle de acesso via cookies HTTP-Only.

## Responsabilidades

| Aspecto | Responsável |
|--------|-------------|
| Entidade | `User` (role, permissions, company) |
| Permissões | `src/lib/auth/permissions.ts` — normalize, checkPermission, effective permissions |
| Impersonation | `startImpersonation`, `stopImpersonation` — cookies HTTP-Only |
| Queries | `getCompanyUsers` — lista usuários ativos de uma empresa |
| UI | `ImpersonationBanner`, `ImpersonationSelector`, `UserPermissionsModal` |
| Segurança | `checkIpStatus` — rate limit por IP no login |

## Checklist: Para usar este módulo você deve saber...

- [ ] `checkPermission()` lê `janus_impersonated_user_id` cookie e aplica permissões do alvo
- [ ] `startImpersonation(userId, companySlug, returnTo?)` seta cookies + salva URL de origem; bloqueia ADMIN como alvo
- [ ] `stopImpersonation(redirectTo?)` limpa cookies; se `false`, não redireciona (modo privilegiado)
- [ ] `enterPrivilegedMode(returnTo)` limpa impersonation + salva returnUrl; usado ao entrar em empresa como admin sem simular usuário
- [ ] `getCompanyUsers(companyId)` busca usuários via `OR [companyId, userCompany.some]`; exclui ADMIN
- [ ] Banner cinza = modo privilegiado (sem simulação); banner vermelho = simulando usuário específico
- [ ] Fluxo login DEFAULT: sem empresa → `/no-company`; 1 empresa → direto; múltiplas → `/select-company`

## Links

- [domain.md](domain.md) — Permissões, cookies, roles
- [actions.md](actions.md) — start/stop impersonation, checkIpStatus
- [queries.md](queries.md) — getCompanyUsers
- [patterns.md](patterns.md) — Copy-paste snippets
