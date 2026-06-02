# Backup como systemd service (teto duro de CPU/RAM)

Garante que o backup **nunca** passe de 50% de 1 vCPU nem de 512 MB de RAM,
independente de carga. O limite é aplicado no cgroup do serviço, então cobre
`node` + `gzip` + `pg_dump` de uma vez.

## 1. Descobrir o método atual (e desativar pra não duplicar)

```bash
systemctl list-units --all | grep -i backup
pm2 list 2>/dev/null
crontab -l 2>/dev/null; sudo crontab -l 2>/dev/null
```

- Se houver **pm2**: `pm2 delete backup-daemon && pm2 save`
- Se houver linha de **cron** chamando `backup:now`/`backup:daemon`: remova com `crontab -e`
- Se já houver um `.service` antigo: `sudo systemctl disable --now <nome>.service`

## 2. Instalar o service

```bash
sudo cp /var/www/janus/Janus/deploy/janus-backup.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now janus-backup.service
```

## 3. Verificar

```bash
systemctl status janus-backup.service
systemctl show janus-backup.service -p CPUQuotaPerSecUSec -p MemoryMax
journalctl -u janus-backup.service -f
```

`CPUQuotaPerSecUSec` deve mostrar `500ms` (= 50%). Os logs mostram
`Agendamentos registrados: diário 02:00 (mantém 3), mensal dia 1 04:00`.

## 4. Testar um backup sob o teto (sem esperar 02:00)

Em outro terminal, dispare manual e observe que NÃO passa do teto:

```bash
# dispara um backup avulso DENTRO do mesmo cgroup limitado
sudo systemd-run --scope -p CPUQuota=50% -p MemoryMax=512M \
  --working-directory=/var/www/janus/Janus /bin/bash -lc 'pnpm backup:now'

# em paralelo, confirme o uso:
docker stats --no-stream
```

## Ajustar o teto

Edite `CPUQuota` no `.service` (`100%` = 1 core inteiro; `50%` = meio core),
depois `sudo systemctl daemon-reload && sudo systemctl restart janus-backup.service`.

## Notas

- `BACKUP_ON_BOOT=false` evita rodar um dump pesado toda vez que o service
  reinicia (ex.: após reboot). Remova essa linha se quiser backup no boot.
- `pg_dump` roda dentro do container do Postgres via `docker exec`; o
  `CPUQuota` do service limita o lado Node (gzip + orquestração). O `nice`
  já embutido no `pg_dump` faz ele ceder CPU dentro do container. Para limitar
  o container do banco em si, seria preciso `cpus:` no docker-compose — não
  recomendado, pois limitaria o Postgres de produção o tempo todo.
```
