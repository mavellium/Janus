# Backup — Sumário Executivo

Scripts CLI para backup e restauração do PostgreSQL via `pg_dump`/`psql`/`pg_restore`. Sem integração Next.js — executados diretamente via `tsx`.

## Responsabilidades

| Aspecto | Responsável |
|---------|-------------|
| Execução de backup | `runBackup(type)` em `backup.ts` |
| Agendamento + rotação | `backup-daemon.ts` (node-cron) |
| Restauração | `restore.ts` (CLI argv) |
| Configuração | `DATABASE_URL` via `.env` |

## Scripts `package.json`

| Comando | Arquivo |
|---------|---------|
| `pnpm backup:daemon` | `backup-daemon.ts` |
| `pnpm backup:now` | `backup.ts` (manual) |
| `pnpm db:restore <arquivo>` | `restore.ts` |

## Próximas Leituras

- Lógica de backup e credenciais → `domain.md`
- Agendamentos e retenção → `actions.md`
- Restauração e formatos → `queries.md`
- Snippets prontos → `patterns.md`

## Para usar este módulo, você deve saber

- [ ] Binários `pg_dump`, `psql`, `pg_restore` devem estar no PATH do servidor
- [ ] `DATABASE_URL` deve estar disponível no ambiente de execução
- [ ] `PGPASSWORD` é injetado **só no env do processo filho** — nunca impresso
- [ ] Arquivos gerados ficam em `<raiz>/backups/` (criado automaticamente)
- [ ] O daemon nunca encerra — rode com pm2/systemd em produção
