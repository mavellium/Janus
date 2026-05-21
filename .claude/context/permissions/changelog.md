# Auth — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

### 2026-05-20 — Refactor completo: Impersonation por usuário específico

**Arquivos:**
- `src/lib/auth/permissions.ts`: removido VIEW_MODE genérico; adicionado `isImpersonating`, `getEffectivePermissions`, `checkPermission`
- `src/modules/auth/actions/startImpersonation.ts`: criado; cookies HTTP-Only + `returnTo`
- `src/modules/auth/actions/stopImpersonation.ts`: criado; suporta `redirectTo?: string | false`
- `src/modules/auth/queries/getCompanyUsers.ts`: criado; lista usuários ativos da empresa
- `src/components/dashboard/ImpersonationBanner.tsx`: reescrito; banner vermelho, Shield (modo privilegiado), KeyRound (permissões), Voltar ao Painel
- `src/components/dashboard/ImpersonationSelector.tsx`: criado; modal de busca de usuários
- `src/app/dashboard-admin/companies/AdminCompaniesClient.tsx`: Eye abre modal de seleção de usuário
- `src/app/dashboard-admin/users/AdminUsersClient.tsx`: Eye chama `startImpersonation`
- `src/app/dashboard-admin/developers/AdminDevelopersClient.tsx`: Eye → escolhe empresa → escolhe usuário → impersona
- `src/app/[companySlug]/dashboard/layout.tsx`: passa email/name do impersonated para Sidebar
- `src/app/[companySlug]/dashboard/settings/page.tsx`: busca dados do impersonated

**Razão:** Abolir VIEW_MODE genérico; impersonation deve ser por usuário específico com cookies seguros

**Impacto:** Admin e Dev podem visualizar como qualquer usuário; banner indica simulação; pode editar permissões durante a visualização; "Voltar ao Painel" redireciona exatamente à origem

### 2026-05-20 — Documentação inicial

- Criada pasta `.claude/context/auth/` com _index, domain, actions, queries, patterns, changelog
