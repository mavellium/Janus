# Admin — Sumário Executivo

Painel administrativo global (`/dashboard-admin`). CRUD de empresas, usuários, desenvolvedores, convidados, logs de segurança e gerenciamento de permissões.

## Responsabilidades

| Aspecto | Responsável |
|---------|-------------|
| CRUD Empresas | `adminCreateCompany`, `adminEditCompany`, `adminDeleteCompany`, `adminQuickCreateCompany` |
| CRUD Usuários | `adminCreateUser`, `adminEditUser`, `adminDeleteUser` |
| CRUD Developers | `createDeveloper`, `adminDeleteUser` (role DEVELOPER) |
| Multi-empresa | `linkUserCompany`, `unlinkUserCompany` — vínculos UserCompany |
| Permissões | `updateUserPermissions` — persiste array de permissions no User |
| Guests Admin | `deleteGuestAsAdmin`, `updateGuestAsAdmin`, `deleteGuestPostAsAdmin`, `updateGuestPostAsAdmin`, `toggleGuestMode` |
| Segurança | `unblockIp` — desbloqueia IP manualmente |
| Queries | `getAdminUsers`, `getAdminCompanies`, `getAdminDevelopers`, `getAdminStats`, `getBlockedIps`, `getLoginLogs` |

## Actions (`src/modules/admin/actions/`)

| Action | Guard | Descrição |
|--------|-------|-----------|
| `adminCreateUser` | ADMIN | FormData com `linkedCompanyIds[]`; cria user + UserCompany em transação; `requiresPasswordReset=true` |
| `adminEditUser` | ADMIN | Atualiza name/email/password?/companyId; deleteMany+createMany UserCompany |
| `adminDeleteUser` | ADMIN | Hard delete (cascade automático) |
| `adminCreateCompany` | ADMIN | Nome + slug + description |
| `adminEditCompany` | ADMIN | Atualiza name, slug, description; valida slug único |
| `adminDeleteCompany` | ADMIN | Hard delete CASCADE (users, projects, pages, etc.) |
| `adminQuickCreateCompany` | ADMIN/DEV | Só nome; auto-gera slug via `toSlug()`; sufixo timestamp se colisão |
| `createDeveloper` | ADMIN | Cria user role=DEVELOPER com bcrypt |
| `linkUserCompany` | ADMIN/DEV | Upsert vínculo UserCompany |
| `unlinkUserCompany` | ADMIN/DEV | deleteMany safe; zera companyId se era primária |
| `updateUserPermissions` | ADMIN/DEV | Recebe `{ userId, permissions: string[] }`; persiste no User.permissions |
| `toggleGuestMode` | ADMIN | Liga/desliga `guestModeEnabled` na Company |
| `unblockIp` | ADMIN | Deleta LoginAttempts do IP |

## Queries (`src/modules/admin/queries/`)

| Query | Retorno |
|-------|---------|
| `getAdminUsers()` | Users DEFAULT/ADMIN com company, linkedCompanyIds |
| `getAdminCompanies()` | Companies com users e projects count |
| `getAdminDevelopers()` | Users role=DEVELOPER |
| `getAdminStats()` | totalUsers, totalCompanies, totalProjects, recentActivity |
| `getBlockedIps()` | IPs com 3+ tentativas na última hora |
| `getLoginLogs()` | Últimas 100 tentativas de login |

## Páginas (`src/app/dashboard-admin/`)

| Rota | Componente Client |
|------|-------------------|
| `/dashboard-admin` | Dashboard com 4 cards + listas |
| `/dashboard-admin/companies` | `AdminCompaniesClient` — CRUD + "Acessar Painel" (enterPrivilegedMode) |
| `/dashboard-admin/users` | `AdminUsersClient` — tabela + CompanyMultiSelect + PasswordField + PermissionsModal |
| `/dashboard-admin/developers` | `AdminDevelopersClient` — tabela + PermissionsModal |
| `/dashboard-admin/guests` | `AdminGuestsClient` — tabela de GuestEntry com posts |
| `/dashboard-admin/logs` | `AdminLogsClient` — Tabs: IPs Bloqueados + Tentativas |
| `/dashboard-admin/settings` | Reutiliza DevSettingsClient |

## Componentes Compartilhados

- `PermissionsModuleSelector` — Dialog step 1: escolhe Sites ou Landing Pages
- `PermissionsModal` — Dialog step 2: toggles por tier (project/page); botão ← volta ao selector
- `CompanyMultiSelect` — Combobox com busca + criação rápida de empresa + badges

## Para usar este módulo, você deve saber

- [ ] Todas as actions validam `session.user.role === 'ADMIN'` (ou DEVELOPER onde indicado)
- [ ] `adminCreateUser` seta `requiresPasswordReset=true` — user deve trocar senha no 1º login
- [ ] `adminDeleteCompany` faz hard delete CASCADE — apaga TUDO (users, projects, pages)
- [ ] `adminQuickCreateCompany` gera slug automático sem formulário completo
- [ ] `updateUserPermissions` salva como `String[]` no formato `module:tier:PERM`
- [ ] "Acessar Painel" no admin chama `enterPrivilegedMode` (não impersona user)
