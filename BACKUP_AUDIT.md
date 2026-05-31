# Auditoria do Sistema de Backup — Janus

> Data: 2026-05-31
> Escopo auditado: código versionado no repositório (`src/scripts/*`, `docker-compose.yml`, `Dockerfile`, `deploy.sh`, `.github/workflows/deploy.yml`).
> **Limitação:** a VPS não foi inspecionada ao vivo (sem acesso SSH a partir desta máquina). `crontab -l`, `systemctl list-timers`, `docker ps` e medições reais de CPU/RAM/IO **não** puderam ser executados. As estimativas de consumo são analíticas, não medidas.

---

## 0. Correção de premissas

O prompt original (e a doc do módulo em `.claude/context/backup/`) assumem coisas que **não existem no código atual**:

| Premissa | Realidade no código |
|----------|---------------------|
| `gzip -9` / compressão pesada | **Nenhuma compressão.** Dump sai `.sql` puro. |
| `tar` de arquivos | Não há. Só dump de banco. |
| Upload S3/B2/Backblaze | Não implementado (docs marcam como "a fazer"). |
| Lockfile / execução concorrente | Não há lock. |
| Backup roda como serviço Docker | **Não está no `docker-compose.yml`.** |

Portanto o "100% de CPU no backup semanal" **não vem de `gzip -9`**. Vem de outro lugar (seção 2).

---

## 1. Fluxo atual (real)

**Componentes:**
- `src/scripts/backup.ts` → `runBackup(type)`: roda `pg_dump --format=plain` e grava `backups/janus-{type}-{timestamp}.sql`.
- `src/scripts/backup-daemon.ts`: daemon `node-cron`. No boot roda `executeBackup('manual')` **bloqueante**, depois agenda diário 02:00 / semanal dom 03:00 / mensal dia 1 04:00. Após cada backup, `cleanOldBackups(type)` (retenção: manual 10, daily 7, weekly 4, monthly 3).
- `src/scripts/restore.ts` → `runRestore(file)`: `psql --file` para `.sql`, `pg_restore` para `.dump`.
- `src/scripts/pg-bin.ts`: resolve onde rodar os binários pg. Em produção detecta o container do banco pela porta e usa **`docker exec janus-db-prod pg_dump ...`**.

**Como o dump é capturado (modo docker — o caso da VPS):**
```ts
const { stdout } = await execAsync(cmd, { env, maxBuffer: 512 * 1024 * 1024 })
fs.writeFileSync(filepath, stdout, 'utf8')
```
→ O dump inteiro é jogado para a **stdout do `docker exec`**, **bufferizado em memória pelo Node (até 512 MB)** como string, e só então escrito em disco.

**Scripts npm:** `backup:daemon`, `backup:now`, `db:restore`.
**Onde roda na VPS:** indeterminado (não está no compose). Provável host cron/pm2/systemd chamando `pnpm backup:*`. **Precisa confirmação.**

---

## 2. Gargalos (causa real do pico)

Em ordem de impacto:

### 2.1 Buffer de até 512 MB em memória (RAM → swap → "trava tudo") — PRINCIPAL
O dump é carregado **inteiro na RAM do processo Node** antes de ir pro disco (`stdout` + `maxBuffer: 512MB` + `writeFileSync` da string inteira). Numa VPS de 2 vCPU (tipicamente 2–4 GB RAM), um dump grande:
- estoura RAM → **swap** → I/O de disco dispara → **todos os serviços ficam lentos / não respondem**;
- gera **pressão de GC** no Node → consumo de CPU em pico (parece "100% CPU", mas a origem é memória).

Este é o sintoma clássico de "serviços param de responder durante o backup".

### 2.2 `pg_dump` concorrendo com o Postgres de produção, sem prioridade
`docker exec janus-db pg_dump` faz o backend do Postgres ler o banco inteiro (COPY) e serializar. Sem `nice`/`ionice`, compete em pé de igualdade com as queries da aplicação pelos **2 vCPUs** e pelo I/O de disco.

### 2.3 Sem limite de recurso em nenhum container
Nem `janus-app`, nem `janus-db` têm `cpus`/`mem_limit`/`cpu_shares`. Qualquer pico de um afeta o outro.

### 2.4 Sem compressão → I/O e disco altos
`.sql` puro é volumoso. Escrever e (futuramente) transferir arquivos grandes aumenta I/O e uso de disco. Compressão **leve** (gzip -1) reduz I/O/disco com custo de CPU baixo.

### 2.5 Backup no boot do daemon
Todo restart do daemon dispara um `manual` completo e bloqueante. Se o container reinicia em horário de pico, gera backup em horário ruim.

---

## 3. Consumo estimado

> Analítico (DB exemplo de ~200 MB de dump plano). Ajustar ao tamanho real.

| Recurso | Hoje | Após otimização |
|---------|------|-----------------|
| RAM (pico do processo de backup) | ~dump inteiro em memória (centenas de MB, risco de swap) | ~constante, alguns MB (streaming) |
| CPU | pico alto por GC + pg_dump sem prioridade | pg_dump em baixa prioridade + gzip -1 (CPU baixa) |
| I/O disco | 1× escrita do .sql + risco de swap | 1× escrita do .sql.gz (menor) sem swap |
| Tamanho em disco | 100% (.sql) | ~15–30% (.sql.gz nível 1) |

Ganho principal: **eliminar o swap** (estabilidade) e tirar o dump de cima do caminho crítico de CPU/IO.

---

## 4. Otimização proposta (alinhada às respostas: gzip nível 1 + bugs)

### 4.1 `backup.ts` — streaming + gzip -1 (substitui o buffer de 512 MB)
Trocar `execAsync`(buffer) + `writeFileSync` por um **pipeline em streaming**:
`pg_dump (stdout) → zlib.createGzip({ level: 1 }) → createWriteStream('....sql.gz')`.

- **RAM:** cai de "dump inteiro" para constante (chunks). Resolve 2.1.
- **Compressão:** nível 1 → CPU baixa, arquivo ~70–85% menor. Resolve 2.4.
- **Postgres:** `--format=plain` mantido (menor CPU **no servidor**; a compressão fica no lado Node, que é limitável).
- **Prioridade:** envolver o `pg_dump` com `nice -n 19` (e `ionice -c3` quando disponível) para ceder CPU/IO ao app. Resolve 2.2.
- **Formato:** arquivo passa a `.sql.gz`. `restore.ts` e `cleanOldBackups` atualizados para reconhecer `.sql.gz` (mantendo compatibilidade com `.sql` e `.dump` já existentes).

### 4.2 Limite de recurso (sua escolha: docker-compose)
**Ressalva técnica importante:** o trabalho pesado de `pg_dump` roda **dentro do `janus-db`** (via `docker exec`). Um limite de CPU posto num *container de backup separado* **não** limitaria esse trabalho. Opções reais:
- (a) Adicionar `mem_limit` + `cpus`/`cpu_shares` ao **`janus-db`** — porém isso também limita o banco em produção o tempo todo (efeito colateral).
- (b) Manter o limite via `nice/ionice` no próprio `pg_dump` (4.1) — é o que realmente atinge o processo culpado.
- (c) Promover o backup a serviço gerenciado no compose com limites — **requer montar `docker.sock`** (sensível a segurança) e definir como a VPS agenda. Não recomendo sem decisão explícita.

→ Decisão pendente na seção 6.

### 4.3 Correções de robustez (escopo "bugs")
- Não disparar backup completo e bloqueante no boot em horário de pico (tornar opcional via env, ex. `BACKUP_ON_BOOT=false`).
- Logs com duração e tamanho do arquivo gerado.
- `cleanOldBackups` e `restore` cientes de `.sql.gz`.

### Itens do prompt avaliados e **descartados** (com justificativa)
- **pigz**: exige instalar binário na imagem; ganho marginal num DB pequeno. Não compensa a complexidade.
- **Backup incremental / rsync --link-dest / snapshots**: `pg_dump` é sempre full por natureza; incremental real exigiria WAL archiving (mudança grande de arquitetura). Não justificado para o tamanho atual.
- **Mudar para `pg_dump -Fc -Z`**: jogaria a compressão para dentro do Postgres (mais CPU **no servidor** de produção). Preferível comprimir no lado Node com gzip -1.

---

## 5. Riscos e plano de rollback

| Mudança | Risco | Mitigação / Rollback |
|---------|-------|----------------------|
| Streaming + `.sql.gz` | Restore precisa descomprimir | `restore.ts` passa a aceitar `.sql`, `.sql.gz` e `.dump`. Backups `.sql` antigos continuam restauráveis. |
| `nice/ionice` no `pg_dump` | `ionice` pode não existir no `postgres:15-alpine` | Aplicar `nice` (existe no busybox) e usar `ionice` só se presente; nunca falhar por isso. |
| Limite no `janus-db` | Pode lentificar o banco em produção | Não aplicar sem teste; preferir nice/ionice. |
| Backup no boot desligado | Esquecer de rodar 1º backup | Default mantém comportamento atual; só muda se setar env. |

**Rollback geral:** todas as mudanças são em arquivos versionados → `git revert` do commit. Nenhuma alteração destrutiva em dados ou em backups existentes.

---

## 6. Decisões pendentes (preciso de você)

1. **Como o backup roda na VPS hoje?** host `crontab`, `pm2`, `systemd` ou serviço Docker? (Define onde aplicar limite/agendamento.)
2. **Limite de recurso:** aceita `nice/ionice` no `pg_dump` (4.1/b — recomendado) **ou** quer mesmo limite via compose no `janus-db` (4.2/a, com efeito colateral no banco)?
3. **Confirma a troca de formato para `.sql.gz`** (com restore retrocompatível)?
