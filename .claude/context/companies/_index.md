# Companies — Sumário Executivo

Empresa é a unidade de tenant no Janus. Cada Company tem slug único, projetos, usuários e configurações (webhook, guestMode).

## Entidade (`Company` Prisma)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| slug | String (unique, indexed) | Identificador na URL (`/{slug}/dashboard`) |
| name | String | Nome de exibição |
| description | String? | Descrição opcional |
| logo | String? | URL do logo |
| webhookUrl | String? | URL para notificações de conteúdo |
| webhookToken | String? | Token de autenticação do webhook |
| guestModeEnabled | Boolean (default false) | Habilita modo convidado |
| createdById | UUID? | ID do criador (DEV ou ADMIN) |
| createdAt, updatedAt, deletedAt | DateTime | Timestamps + soft delete |

## Relações

- `User[]` — usuários com `companyId` direto (legacy)
- `UserCompany[]` — vínculo M:N moderno
- `Project[]` — projetos (Sites + Landing Pages)
- `GuestEntry[]` — convidados registrados

## Actions

| Action | Módulo | Descrição |
|--------|--------|-----------|
| `updateCompanyWebhook` | `companies` | Atualiza webhookUrl + webhookToken; valida slug match |
| `adminCreateCompany` | `admin` | CRUD completo pelo admin |
| `adminEditCompany` | `admin` | Atualiza name, slug, description |
| `adminDeleteCompany` | `admin` | Hard delete CASCADE |
| `adminQuickCreateCompany` | `admin` | Criação rápida (só nome, slug auto) |
| `createCompany` | `dev` | CRUD pelo developer |
| `toggleGuestMode` | `admin` | Liga/desliga guestModeEnabled |

## Queries

| Query | Retorno | Uso |
|-------|---------|-----|
| `getRecentCompanyActivity(companyId, limit?, userId?)` | `CompanyActivityEntry[]` | Feed "Atividade recente" no dashboard. Filtra `AuditLog` por `companyId` + `impersonatedId: null` + entidades relevantes (Project/Page/BlogPost/BlogCategory/BlogTag) dentro da janela de retenção. Passando `userId`, escopa só à atividade daquele usuário |

> **Escopo por usuário:** o dashboard passa `ownerId` = usuário **efetivo** — impersonado quando há impersonation; `undefined` (empresa toda) só para ADMIN/DEVELOPER sem impersonation; usuário normal vê apenas a própria atividade. Mesmo padrão nas telas de SEO (`getRecentSeoAnalyses`/`getSeoAnalysis`).

## Webhook

Configurado em `/{slug}/dashboard/settings` (aba Webhook). Quando conteúdo muda, o sistema pode enviar POST para `webhookUrl` com header `Authorization: Bearer {webhookToken}`.

## Acesso por Rota

- `/{slug}/dashboard/*` — layout valida que user tem acesso à empresa (via companyId ou UserCompany)
- Admin pode acessar qualquer empresa via `enterPrivilegedMode`
- Developer pode acessar empresas que criou

## Para usar este módulo, você deve saber

- [ ] Slug é unique e indexed — usado em todas as rotas de tenant
- [ ] Soft delete: `deletedAt: null` em queries; admin pode hard delete
- [ ] `guestModeEnabled` gateia todo o módulo de guests
- [ ] Cascade: deletar Company apaga Users (SET NULL no companyId), Projects, GuestEntries
- [ ] Acesso: verificado no layout via `companyId` direto ou `UserCompany.some`
