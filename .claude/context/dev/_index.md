# Dev — Sumário Executivo

Painel do desenvolvedor (`/dev/{devId}/dashboard`). CRUD de empresas e usuários vinculados ao dev. Cada DEVELOPER gerencia apenas os recursos que criou.

## Responsabilidades

| Aspecto | Responsável |
|---------|-------------|
| CRUD Empresas | `createCompany`, `editCompany`, `deleteCompany` |
| CRUD Usuários | `createUser`, `deleteUser` |
| Dashboard | `getDevStats`, `getRecentCompanies`, `getRecentProjects`, `getRecentUsers` |
| Queries | `getCompanies`, `getUsers`, `getCompanyProjects` |

## Actions (`src/modules/dev/actions/`)

| Action | Guard | Descrição |
|--------|-------|-----------|
| `createCompany` | DEVELOPER/ADMIN | Nome + slug (regex: a-z0-9-) + description?; seta `createdById` |
| `editCompany` | DEVELOPER/ADMIN | Atualiza name, slug, description; valida slug único |
| `deleteCompany` | DEVELOPER/ADMIN | Hard delete (cascade) |
| `createUser` | DEVELOPER | Nome + email + password + companyId; role=DEFAULT; `requiresPasswordReset=true` |
| `deleteUser` | DEVELOPER | Hard delete; valida que user pertence a empresa do dev |

## Queries (`src/modules/dev/queries/`)

| Query | Retorno |
|-------|---------|
| `getCompanies()` | Companies criadas pelo dev (createdById = session.user.id) |
| `getUsers()` | Users das empresas do dev |
| `getCompanyProjects(companyId)` | Projects de uma empresa específica |
| `getDevStats()` | totalCompanies, totalUsers, totalProjects |
| `getRecentCompanies()` | Últimas 5 empresas |
| `getRecentProjects()` | Últimos 5 projetos |
| `getRecentUsers()` | Últimos 5 usuários |

## Páginas (`src/app/dev/{devId}/dashboard/`)

| Rota | Descrição |
|------|-----------|
| `/` | Centro de Comando: 4 cards + grid 3 colunas (projetos, empresas, usuários recentes) |
| `/companies` | CompaniesClient — CRUD via Dialog/useActionState |
| `/users` | UsersClient — tabela + modal de criação com Select de empresa |
| `/settings` | DevSettingsClient — perfil + segurança + preferências |

## Para usar este módulo, você deve saber

- [ ] Guard no layout: valida `role=DEVELOPER` e `devId === session.user.id`
- [ ] Queries filtram por `createdById` — dev só vê o que criou
- [ ] `deleteCompany` é hard delete CASCADE (apaga tudo)
- [ ] Dev pode usar `startImpersonation` para simular usuários de suas empresas
- [ ] Dev NÃO tem acesso ao painel admin (`/dashboard-admin`)
- [ ] Sidebar: `DevSidebar` com 4 itens (Dashboard, Empresas, Usuários, Configurações)
