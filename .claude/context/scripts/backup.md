# Backup & Restore PostgreSQL — Sumário Executivo

Sistema de backup e restauração do banco de dados PostgreSQL via `pg_dump` / `psql` / `pg_restore`, com agendamento automático via `node-cron`.

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `src/scripts/backup.ts` | Executa um backup imediato; exporta `runBackup(type)` |
| `src/scripts/backup-daemon.ts` | Daemon com cron: backup inicial + agendamentos periódicos + limpeza |
| `src/scripts/restore.ts` | CLI para restaurar a partir de um arquivo de backup |

## Scripts `package.json`

| Comando | O que faz |
|---------|-----------|
| `pnpm backup:daemon` | Inicia o daemon (backup imediato + cron rodando) |
| `pnpm backup:now` | Executa um backup manual pontual |
| `pnpm db:restore <arquivo>` | Restaura o banco a partir de um `.sql` ou `.dump` |

## Tipos de Backup e Retenção

| Tipo | Horário (cron) | Arquivos mantidos |
|------|----------------|-------------------|
| `manual` | Sob demanda | 10 últimos |
| `daily` | `0 2 * * *` (02:00) | 7 últimos |
| `weekly` | `0 3 * * 0` (dom 03:00) | 4 últimos |
| `monthly` | `0 4 1 * *` (dia 1, 04:00) | 3 últimos |

## Formato e Local dos Arquivos

- Diretório: `<raiz-do-projeto>/backups/`
- Nomenclatura: `janus-{type}-{timestamp-ISO}.sql`
- Formato padrão: `plain` SQL (`.sql`); se `.dump`, usa `pg_restore` na restauração

## Segurança

- **`PGPASSWORD` é passado apenas no `env` do processo filho** — nunca impresso em logs ou no console
- Credenciais lidas de `DATABASE_URL` (via `dotenv`)
- Erros de execução exibem apenas a mensagem, nunca credenciais

## Dependências

- `node-cron ^4.2.1` — agendamento
- `@types/node-cron ^3.0.11` (dev)
- `dotenv` — já incluso no projeto
- Binários nativos do PostgreSQL: `pg_dump`, `psql`, `pg_restore` devem estar no PATH do servidor

## Para usar este módulo, você deve saber

- [ ] O daemon nunca encerra por conta própria — rode em processo persistente (systemd, pm2, etc.)
- [ ] A rotação remove arquivos mais antigos após cada backup bem-sucedido
- [ ] Na restauração `.sql` usa `psql`, `.dump` usa `pg_restore --clean --if-exists`
- [ ] `DATABASE_URL` deve estar disponível no ambiente de execução
