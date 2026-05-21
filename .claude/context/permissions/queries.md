# Auth — Queries

## getCompanyUsers

```typescript
async (companyId: string)
  => Promise<{ id, name, email, role }[]>
```

- **Filtros:** `deletedAt: null`, `company.id === companyId`
- **Select:** `id`, `name`, `email`, `role`
- **Ordem:** `name: 'asc'`
- **Uso:** Popula `ImpersonationSelector` e `ImpersonationBanner` com lista de usuários simuláveis

## getEffectivePermissions

```typescript
async (realUserId: string)
  => Promise<permissions | null>
```

- Se `janus_impersonated_user_id` cookie existe: busca permissões do alvo
- Senão: retorna permissões do `realUserId`
- Usado internamente por `checkPermission()`

## getImpersonatedUserId / getImpersonatedUserName / getImpersonationReturnUrl

- Leem cookies HTTP-Only respectivos
- Retornam `string | null`
- Chamadas idempotentes, usadas no server layout e em actions
