#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:-janus-app}"

echo "==> Deploy do serviço: ${SERVICE}"

echo "==> [1/3] Buildando imagem nova (site atual continua no ar)..."
docker compose build "${SERVICE}"

echo "==> [2/3] Subindo container novo e aguardando ficar saudável..."
docker compose up -d --no-deps --wait "${SERVICE}"

echo "==> [3/3] Removendo imagens órfãs..."
docker image prune -f >/dev/null 2>&1 || true

echo "==> Deploy concluído. Container saudável e no ar."
docker compose ps "${SERVICE}"
