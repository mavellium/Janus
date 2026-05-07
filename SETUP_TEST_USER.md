# Criando Usuário de Teste

## 📋 Sumário

Este documento explica como criar e usar um usuário de teste no Janus.

**Credenciais de Teste:**
- 📧 Email: `teste2@gmail.com`
- 🔐 Senha: `123456`
- 👤 Role: `DEFAULT`

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

**O que é testado:**

| Fase | Descrição |
|------|-----------|
| Phase 1 | Hash de senha com bcryptjs |
| Phase 2 | Validação de formato de email |
| Phase 3 | Validação de requisitos de senha |
| Phase 4 | Validação de role do usuário |
| Phase 5 | Lógica de comparação de senha |
| Bonus | Documentação de credenciais |

---

## 🔧 Criar Usuário no Banco de Dados

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

### Opção 1: Via Script Seed

```bash
npm run db:seed-test
```

**Saída esperada:**
```
🌱 Starting test user creation...
✓ Test user created successfully!

📧 Email: teste2@gmail.com
🔐 Password: 123456
👤 Role: DEFAULT
🆔 ID: [uuid]
```

### Opção 2: Via Prisma Studio (GUI)

```bash
npm run db:studio
```

Então:
1. Clique em `User`
2. Clique em `+ Add record`
3. Preencha:
   - email: `teste2@gmail.com`
   - password: (gere um hash bcrypt de `123456`)
   - role: `DEFAULT`

---

## 🔐 Validação do Usuário

### 1. Via Web (Recomendado)

1. Inicie o servidor: `pnpm dev`
2. Acesse: `http://localhost:3000/login`
3. Entre com:
   - Email: `teste2@gmail.com`
   - Senha: `123456`
4. Se bem-sucedido, será redirecionado para `/dashboard`

### 2. Via Prisma Studio

```bash
npm run db:studio
```

Procure pela tabela `User` e verifique o registro com email `teste2@gmail.com`.

---

## 🚨 Troubleshooting

| Erro | Solução |
|------|---------|
| "client password must be a string" | PostgreSQL não está rodando em `localhost:5433` |
| "Table does not exist" | Execute `npm run db:migrate` para sincronizar |
| Login falha | Verifique email/senha exatos via Prisma Studio |
| SASL error | Verifique credenciais do banco em `.env` |

---

## 📝 Arquivos Relacionados

- `src/test/create-test-user.spec.ts` — Testes unitários
- `scripts/seed-test-user.ts` — Script seed para banco
- `.env` — Variáveis de ambiente (DATABASE_URL)
- `package.json` — Script npm `db:seed-test`
