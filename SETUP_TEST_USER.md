# Criando Usuário de Teste — Multi-Tenant

## 📋 Sumário

Este documento explica como criar e usar um usuário de teste completo no Janus com empresa, projeto e página de teste.

---

## ✅ Testes Unitários (Sem Banco de Dados)

Os testes unitários **não requerem banco de dados** e podem ser rodados a qualquer momento:

```bash
npm run test -- src/test/create-test-user.spec.ts
```

**Saída esperada:**
```
✓ Test Files  1 passed (1)
✓ Tests      6 passed (6)
```

---

## 🔧 Criar Ambiente de Teste Completo

### Pré-requisitos

1. **PostgreSQL rodando** em `localhost:5433`:
   ```
   Host: localhost
   Port: 5433
   Database: meubanco
   User: postgres
   Password: postgres
   ```

2. **Variáveis de ambiente** em `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/meubanco"
   AUTH_SECRET="sua-chave-aqui"
   ```

3. **Schema sincronizado**:
   ```bash
   npm run db:migrate
   ```

### Via Script Seed (Recomendado)

```bash
npm run db:seed-test
```

**Saída esperada:**
```
✓ Cleaned up existing user
✓ Created test company: "Test Company"
✓ Test user created successfully!
✓ Created test project: "Test Project"
✓ Created test page: "Home"

📋 TEST ENVIRONMENT SUMMARY
👤 User Credentials:
  📧 Email: teste2@gmail.com
  🔐 Password: 123456
  🆔 ID: [uuid]
  👥 Role: DEFAULT

🏢 Company:
  🏷️ Slug: test-company
  📝 Name: Test Company
  🆔 ID: [uuid]

📁 Project:
  📝 Name: Test Project
  🎯 Type: LANDING_PAGE
  🆔 ID: [uuid]

📄 Page:
  📝 Name: Home
  🔗 Slug: home
  🆔 ID: [uuid]
```

---

## 🔐 Credenciais de Teste

| Campo | Valor |
|-------|-------|
| **Email** | `teste2@gmail.com` |
| **Senha** | `123456` |
| **Role** | `DEFAULT` |
| **Empresa** | `test-company` |
| **Empresa Nome** | `Test Company` |

---

## 🌐 Validação do Usuário

### Via Web (Recomendado)

1. **Inicie o servidor dev:**
   ```bash
   npm run dev
   ```

2. **Acesse a página de login:**
   ```
   http://localhost:3000/login
   ```

3. **Entre com as credenciais:**
   - Email: `teste2@gmail.com`
   - Senha: `123456`

4. **Será redirecionado para:**
   ```
   http://localhost:3000/test-company/dashboard
   ```

5. **Verifique:**
   - Header mostra email e avatar
   - Sidebar está funcional
   - Dashboard carrega corretamente

### Via Prisma Studio

```bash
npm run db:studio
```

Procure pelas seguintes tabelas:
- **User**: Email `teste2@gmail.com` com `companyId` = Test Company
- **Company**: Slug `test-company` com nome "Test Company"
- **Project**: Nome "Test Project" relacionado à Test Company
- **Page**: Slug "home" relacionada ao Test Project

---

## 📊 Estrutura de Dados de Teste

```
Test Company (test-company)
├── User: teste2@gmail.com
│   ├── Role: DEFAULT
│   ├── Preferences: { sidebar_collapsed: false }
│   └── Email: teste2@gmail.com
├── Project: Test Project (LANDING_PAGE)
│   └── Page: Home (slug: home)
│       └── Content: JSON com hero section
└── LoginAttempts: (vazio, nenhuma tentativa falha)
```

---

## 🔄 Fluxo de Autenticação Multi-Tenant

1. Usuário acessa `/login`
2. Submete credenciais
3. `authorize()` valida email/senha
4. `authorize()` busca `user.company`
5. JWT recebe `companySlug` = "test-company"
6. Redireciona para `/test-company/dashboard`
7. Middleware valida se `companySlug` na sessão = parâmetro da rota
8. Dashboard carrega com dados da empresa

---

## 🚨 Troubleshooting

| Erro | Solução |
|------|---------|
| "Database connection failed" | PostgreSQL não está rodando em `localhost:5433` |
| "Default company not found" | Execute `npm run db:migrate` primeiro |
| "Table does not exist" | Sincronize schema: `npm run db:migrate` |
| Login falha / redirect infinito | Verifique email/senha no Prisma Studio |
| "Invalid companySlug" | Verifique que o usuário está associado à empresa correta |
| SASL error | Verifique credenciais PostgreSQL em `.env` |

---

## 🧪 Casos de Teste Comuns

### 1. Teste de Login Bem-Sucedido
```
1. Acesse http://localhost:3000/login
2. Entre com teste2@gmail.com / 123456
3. ✓ Redirecionado para /test-company/dashboard
4. ✓ Email visible no header da sidebar
```

### 2. Teste de Proteção de Rota
```
1. Logout
2. Tente acessar /test-company/dashboard
3. ✓ Redirecionado para /login
4. ✓ Login novamente
5. ✓ Dashboard acessível
```

### 3. Teste de IP Blocking (Brute Force)
```
1. Tente login 3x com senha errada
2. ✓ IP é bloqueado por 1 hora
3. ✓ Tentativa de login 4ª vez mostra overlay de bloqueio
4. ✓ Countdown regressivo (MM:SS) aparece
```

### 4. Teste de Multi-Tenant
```
1. Login com teste2@gmail.com na empresa "test-company"
2. ✓ Dashboard carrega em /test-company/dashboard
3. ✓ URL mostra companySlug correto
4. Se tentar /outra-empresa/dashboard:
   ✓ Redireciona para /test-company/dashboard
```

---

## 📝 Arquivos Relacionados

- `scripts/seed-test-user.ts` — Script seed (cria user, company, project, page)
- `SETUP_TEST_USER.md` — Este arquivo (documentação)
- `.env` — Variáveis de ambiente
- `src/test/create-test-user.spec.ts` — Testes unitários
- `package.json` — Script npm `db:seed-test`
- `PROJECT.md` — Documentação geral do projeto
