# Backup — Queries (Leitura / Restauração)

> Não há queries Prisma neste módulo. "Queries" aqui cobre a leitura do sistema de arquivos e a lógica de restauração do banco.

---

## runRestore (`restore.ts`)

- **Assinatura:** `async (filePath: string): Promise<void>`
- **Entrada:** caminho relativo ou absoluto do arquivo de backup
- **Fluxo:**
  1. Lê `DATABASE_URL` → lança erro se ausente
  2. `path.resolve(filePath)` → caminho absoluto
  3. `fs.existsSync` → lança erro descritivo se não encontrar
  4. `parseConnectionUrl` → `DBConfig`
  5. Detecta formato: `resolved.endsWith('.dump')` → `pg_restore`, senão → `psql`
  6. Executa com `PGPASSWORD` no env do filho

**Flags por formato:**

| Formato | Binário | Flags extras |
|---------|---------|--------------|
| `.sql` | `psql` | `--file="{resolved}"` |
| `.dump` | `pg_restore` | `--clean --if-exists` |

Ambos usam: `--host --port --username --dbname --no-password`

- `--clean` → DROP objetos antes de recriar
- `--if-exists` → não falha se o objeto não existir no banco destino

---

## parseConnectionUrl (compartilhado entre backup.ts e restore.ts)

- **Assinatura:** `(url: string): DBConfig`
- Usa `new URL(url)` nativo do Node
- `port`: `parsed.port || '5432'`
- `password`: `decodeURIComponent(parsed.password)` — necessário para senhas com caracteres especiais
- `database`: `parsed.pathname.replace(/^\//, '')` — remove a `/` inicial

---

## Leitura de Arquivos para Rotação (`cleanOldBackups`)

```typescript
fs.readdirSync(BACKUPS_DIR)
  .filter(f => f.startsWith(`janus-${type}-`) && f.endsWith('.sql'))
  .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUPS_DIR, f)).mtime }))
  .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
```

Critério de seleção para delete: `files.slice(RETENTION[type])` — os mais antigos.
