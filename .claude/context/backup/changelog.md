# Backup — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

---

### [2026-05-25] — Implementação inicial

**Arquivos:**
- `src/scripts/backup.ts`: criado — núcleo runBackup + parseConnectionUrl
- `src/scripts/backup-daemon.ts`: criado — daemon com node-cron + rotação
- `src/scripts/restore.ts`: criado — CLI de restauração .sql/.dump
- `package.json`: adicionados scripts backup:daemon, backup:now, db:restore

**Razão:** Sistema de backup automatizado para proteção dos dados de produção do Janus CMS

**Impacto:** Nenhum impacto no Next.js ou nas rotas — scripts totalmente isolados
