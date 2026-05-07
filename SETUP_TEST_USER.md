# Criando Usuário de Teste

## Pré-requisitos

1. **PostgreSQL rodando** em `localhost:5433`
   - Host: `localhost`
   - Port: `5433`
   - Database: `meubanco`
   - User: `postgres`
   - Password: `postgres`

2. **Variáveis de ambiente configuradas** em `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/meubanco"
   AUTH_SECRET="sua-chave-aqui"
   ```

## Opção 1: Via Teste (Recomendado)

```bash
npm run test -- src/test/create-test-user.spec.ts
```

Isso vai:
1. Conectar ao banco de dados
2. Remover usuário existente com email `teste2@gmail.com`
3. Criar novo usuário de teste
4. Validar a criação
5. Verificar autenticação

## Opção 2: Via Script Seed

```bash
npm run db:seed-test
```

Isso vai:
1. Conectar ao banco de dados
2. Remover usuário existente
3. Criar usuário com email `teste2@gmail.com` e senha `123456`
4. Exibir detalhes do usuário criado

## Detalhes do Usuário de Teste

```
📧 Email: teste2@gmail.com
🔐 Senha: 123456
👤 Role: DEFAULT
```

## Validação

Após criar o usuário, faça login em `http://localhost:3000/login` com:
- Email: `teste2@gmail.com`
- Senha: `123456`

Você será redirecionado para `/dashboard` se o login for bem-sucedido.

## Troubleshooting

### Erro: "client password must be a string"
- Verifique se PostgreSQL está rodando em `localhost:5433`
- Verifique as credenciais em `.env`
- Verifique se o banco `meubanco` foi criado

### Erro: "Table does not exist"
- Execute: `npm run db:migrate` para sincronizar o schema
- Ou execute: `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="sim, autorizo o reset do banco de dados" npx prisma migrate reset --force`

### Erro de Autenticação no Login
- Verifique se o usuário foi criado: `npm run db:studio` (abre GUI do Prisma)
- Teste com o email exato: `teste2@gmail.com`
- Teste com a senha exata: `123456`
