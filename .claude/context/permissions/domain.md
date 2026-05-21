# Auth — Entidades e Domínio

## Permissões (RBAC)

```typescript
const PERMISSIONS = {
  PROJECT_CREATE: 'PROJECT_CREATE',
  PROJECT_EDIT: 'PROJECT_EDIT',
  PROJECT_DELETE: 'PROJECT_DELETE',
  PAGE_CREATE: 'PAGE_CREATE',
  PAGE_DELETE: 'PAGE_DELETE',
  PAGE_BUILD: 'PAGE_BUILD',
  BLOG_MANAGE: 'BLOG_MANAGE',
  GUEST_MANAGE: 'GUEST_MANAGE',
  TEAM_MANAGE: 'TEAM_MANAGE',
}
```

- `PermissionName` = keyof PERMISSIONS
- `ModuleType` = 'sites' | 'landingPages'
- `PermissionTier` = 'project' | 'page'

## Roles

| Role | Acesso |
|------|--------|
| DEFAULT | Usuário comum (restrito à própria empresa) |
| ADMIN | Acesso total, pode impersonar qualquer usuário |
| DEVELOPER | Cria empresas, pode impersonar usuários de empresas próprias |

## Cookies HTTP-Only

| Cookie | Propósito | TTL |
|--------|-----------|-----|
| `janus_impersonated_user_id` | ID do usuário sendo simulado | 7 dias |
| `janus_impersonated_user_name` | Nome/email para exibição no banner | 7 dias |
| `janus_impersonation_return_url` | URL de origem (para "Voltar ao Painel") | 7 dias |

## Funções Principais

- `isImpersonating()` — true se cookie `janus_impersonated_user_id` existe
- `getEffectivePermissions(realUserId)` — retorna permissões do impersonated ou do real
- `checkPermission(required, userId, companySlug?)` — valida se user (ou impersonated) tem permissão
- `isPrivilegedRole(role)` — true para ADMIN ou DEVELOPER

## Erros

- `Acesso não autorizado` — role não é ADMIN nem DEVELOPER ao start/stop
- `Usuário não encontrado` — targetUserId inexistente ou soft-deleted
