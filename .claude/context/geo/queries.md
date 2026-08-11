# GEO — Queries

Leitura direta via Prisma no servidor. `GeoTargetProfile` usa soft delete por `archivedAt` (não `deletedAt`, para não colidir semanticamente com o padrão do resto do projeto); as demais entidades GEO não têm soft delete próprio — perguntas usam `status: ARCHIVED`.

## getGeoTargetProfiles()

- **Retorna:** perfis com `archivedAt: null` — id, name, description, industry, location, website, aliases, targetAudience, differentiators, createdAt
- **Ordenação:** createdAt desc (mais recente primeiro)
- Usada pela página para popular o seletor de "empresa analisada"

## getGeoTargetProfileById(id)

- **Retorna:** perfil completo (todos os campos) | null, filtrado por `archivedAt: null`

## getGeoTargetQuestions(profileId)

- **Retorna:** perguntas `status: ACTIVE` — id, text, layer, priority, status, createdAt
- **Ordenação:** priority desc → createdAt asc

## getActiveGeoQuestionsForProbe(profileId)

- **Retorna:** mesmo filtro, select mínimo (id, text, layer) para o loop de execução

## getGeoCompetitors(profileId)

- **Retorna:** id, name, aliases, website, createdAt — ordenado por nome

## getLatestGeoSnapshot(profileId)

- **Retorna:** snapshot mais recente | null — id, score, breakdown, competitorComparison, totalCostUsdCents, createdAt

## getGeoSnapshotHistory(profileId, limit = 12)

- **Retorna:** id, score, createdAt, totalCostUsdCents — createdAt desc, para a série histórica do IAG Score

## getGeoProbeRunsBySnapshot(snapshotId, profileId)

- **Retorna:** probe runs com `targetQuestion` e `mentionedCompetitor` incluídos — a evidência bruta (texto da resposta da IA) por trás do score
- **Escopo:** sempre filtra por `profileId` além do `snapshotId`
