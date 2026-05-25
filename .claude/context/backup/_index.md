# Backup — Sumário Executivo

Sistema de backup e restauração do banco de dados PostgreSQL do Janus CMS. Executa `pg_dump` via processo filho com `PGPASSWORD` (credenciais nunca impressas em log), salva arquivos localmente em `/backups/` e oferece agendamento automático via `node-cron`.

---

## Arquitetura

| Arquivo | Papel |
|---------|-------|
| `src/scripts/backup.ts` | Núcleo: parseia `DATABASE_URL`, executa `pg_dump`, retorna caminho do arquivo gerado. Exporta `runBackup(type)` para uso pelo daemon |
| `src/scripts/backup-daemon.ts` | Processo longo: executa backup imediato ao iniciar, registra 3 crons (diário, semanal, mensal), faz rotação automática de arquivos antigos |
| `src/scripts/restore.ts` | CLI: recebe caminho do arquivo como argumento, usa `psql` para `.sql` ou `pg_restore` para `.dump` |

---

## Scripts `package.json`

| Comando | Uso |
|---------|-----|
| `pnpm backup:daemon` | Inicia o daemon (manter rodando em produção via pm2 / systemd) |
| `pnpm backup:now` | Dispara um backup manual imediato (tipo `manual`) |
| `pnpm db:restore <arquivo>` | Restaura o banco a partir de um arquivo de backup |

---

## Tipos, Horários e Retenção

| Tipo | Cron | Horário | Arquivos mantidos |
|------|------|---------|-------------------|
| `manual` | sob demanda | — | 10 últimos |
| `daily` | `0 2 * * *` | 02:00 todo dia | 7 últimos |
| `weekly` | `0 3 * * 0` | Domingo 03:00 | 4 últimos |
| `monthly` | `0 4 1 * *` | Dia 1 às 04:00 | 3 últimos |

---

## Nomenclatura e Formato dos Arquivos

- **Diretório:** `<raiz>/backups/` (criado automaticamente se não existir)
- **Nome:** `janus-{type}-{timestamp-ISO}.sql`
  - Exemplo: `janus-daily-2026-05-25T02-00-00-000Z.sql`
- **Formato padrão:** `plain` SQL via `pg_dump --format=plain`
- **Formato custom (`.dump`):** restauração usa `pg_restore --clean --if-exists`

---

## Segurança

| Regra | Como implementado |
|-------|------------------|
| Senha nunca em log | `PGPASSWORD` injetado somente no `env` do processo filho (`exec`) |
| Sem impressão de credenciais | Erros exibem apenas `err.message`, nunca a URL de conexão |
| Credenciais via env | Lidas de `DATABASE_URL` com `dotenv`; nunca hardcoded |

---

## Dependências

| Pacote | Versão | Papel |
|--------|--------|-------|
| `node-cron` | `^4.2.1` | Agendamento de tarefas |
| `@types/node-cron` | `^3.0.11` | Tipos TypeScript (devDep) |
| `dotenv` | já incluso | Leitura do `.env` |

> Binários nativos do PostgreSQL (`pg_dump`, `psql`, `pg_restore`) devem estar no `PATH` do servidor de produção.

---

## Fluxo de Backup

```
pnpm backup:daemon
  └─ executeBackup('manual')          ← backup imediato ao iniciar
       ├─ runBackup('manual')
       │    ├─ parseConnectionUrl(DATABASE_URL)
       │    ├─ mkdir backups/ (se necessário)
       │    ├─ exec pg_dump ... (PGPASSWORD no env)
       │    └─ retorna caminho do arquivo
       └─ cleanOldBackups('manual')   ← mantém últimos 10

  ├─ cron: 0 2 * * *  → executeBackup('daily')
  ├─ cron: 0 3 * * 0  → executeBackup('weekly')
  └─ cron: 0 4 1 * *  → executeBackup('monthly')
```

## Fluxo de Restauração

```
pnpm db:restore backups/janus-daily-2026-05-25T02-00.sql
  └─ parseConnectionUrl(DATABASE_URL)
  └─ extensão .sql?  → psql --file=<arquivo>
     extensão .dump? → pg_restore --clean --if-exists <arquivo>
```

---

## Para usar este módulo, você deve saber

- [ ] O daemon não encerra por conta própria — rode com `pm2 start "pnpm backup:daemon"` ou via systemd em produção
- [ ] A rotação ocorre **após** cada backup bem-sucedido, por tipo independente
- [ ] `DATABASE_URL` deve estar disponível no ambiente de execução do script (`.env` ou variável do sistema)
- [ ] Restaurar em produção apaga e recria dados — confirme antes de rodar `db:restore`
- [ ] Para testar o daemon localmente basta `pnpm backup:daemon`; ele cria o diretório `backups/` automaticamente
