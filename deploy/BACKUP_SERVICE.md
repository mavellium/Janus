# Backup como systemd service (teto duro de CPU/RAM)

Garante que o backup **nunca** passe de 50% de 1 vCPU nem de 512 MB de RAM,
independente de carga. O limite é no cgroup do serviço → cobre `node` + `gzip`.
(`pg_dump` roda no container do Postgres via `docker exec`, limitado por
`nice`/`ionice` já embutidos — ver nota no fim.)

> **Importante:** na VPS o Node é instalado via **nvm** e não há `node_modules`
> no host. Os passos abaixo resolvem isso. Faça **uma vez**.

## 1. Pré-requisitos no host (uma vez)

```bash
cd /var/www/janus/Janus
git pull origin main

# pnpm via corepack (node 24 ja tem corepack)
corepack enable

# instala node_modules no HOST (necessario p/ rodar o daemon fora do container)
pnpm install --frozen-lockfile

# symlinks ESTAVEIS p/ o systemd nao depender do caminho do nvm
# (descobre o node atual do nvm e linka em /usr/local/bin)
ln -sf "$(command -v node)" /usr/local/bin/node
ln -sf "$(command -v node)" /usr/local/bin/nodejs
```

> Se atualizar a versão do node no nvm depois, rode de novo só os dois `ln -sf`.

## 2. Confirmar que NÃO há outro backup rodando

```bash
systemctl list-units --all | grep -i janus
pm2 list 2>/dev/null
crontab -l 2>/dev/null; sudo crontab -l 2>/dev/null
```

(`dpkg-db-backup` é do Ubuntu, ignore.) Se achar algo do Janus, desative antes:
- pm2: `pm2 delete <nome> && pm2 save`
- cron: `crontab -e` e remova a linha

## 3. Instalar o service

```bash
sudo cp /var/www/janus/Janus/deploy/janus-backup.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now janus-backup.service
```

## 4. Verificar

```bash
systemctl status janus-backup.service
systemctl show janus-backup.service -p CPUQuotaPerSecUSec -p MemoryMax
journalctl -u janus-backup.service -n 30 --no-pager
```

- `CPUQuotaPerSecUSec` deve ser `500ms` (= 50%).
- Logs devem mostrar:
  `Agendamentos registrados: diário 02:00 (mantém 3), mensal dia 1 04:00 (mantém 3)`
- `status` deve estar `active (running)`.

## 5. Testar um backup AGORA (sem esperar 02:00) sob o mesmo teto

```bash
sudo systemd-run --scope \
  -p CPUQuota=50% -p MemoryMax=512M -p Nice=19 \
  --working-directory=/var/www/janus/Janus \
  /usr/local/bin/node node_modules/tsx/dist/cli.mjs src/scripts/backup.ts manual

ls -lh backups/        # deve aparecer um janus-manual-*.sql.gz
```

Em paralelo, em outro terminal, confirme que o teto segura:
```bash
top -b -n1 | grep -E 'node|gzip'   # %CPU do node nao passa de ~50
```

## Ajustar o teto

Edite `CPUQuota` no `.service` (`100%` = 1 core; `50%` = meio core), depois:
```bash
sudo systemctl daemon-reload && sudo systemctl restart janus-backup.service
```

## Notas

- `BACKUP_ON_BOOT=false`: não dispara dump pesado a cada restart/reboot do
  service. Remova a linha se quiser backup no boot.
- **`pg_dump` x teto duro:** o dump roda dentro do container `janus-db-prod`
  (`docker exec`), fora do cgroup do service. Ele é limitado por `nice -19` +
  `ionice -c3 idle` já embutidos no comando → cede CPU/IO sob disputa, mas
  **não tem teto duro**. Dar teto duro exigiria `cpus:` no `janus-db` do
  docker-compose, o que limitaria o Postgres de **produção** 24/7 — não
  recomendado. O que travava a VPS antes (dump inteiro em RAM → swap) já foi
  eliminado pelo streaming; isso não volta.
```
