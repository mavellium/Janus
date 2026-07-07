# Audit — Padrões de Código

## 1. Instrumentar uma nova Server Action (CREATE)
```typescript
import { logAudit } from '@/lib/audit-logger'

const created = await db.entidade.create({ data })
await logAudit({
  userId: session.user.id,
  action: 'CREATE',
  entity: 'Entidade',
  entityId: created.id,
  newData: created,
})
```

## 2. UPDATE / DELETE — capturar o estado anterior
```typescript
import { logAudit, omitSensitive } from '@/lib/audit-logger'

const before = await db.user.findUnique({ where: { id } })
await db.user.delete({ where: { id } })
await logAudit({
  userId: session.user.id,
  action: 'DELETE',
  entity: 'User',
  entityId: id,
  oldData: omitSensitive(before), // remove password
})
```

## 3. Remover relação do oldData (quando o findUnique usa include)
```typescript
oldData: { ...page, project: undefined } // JSON.stringify descarta undefined
```

## 4. Tornar a entidade reversível (Undo)
Adicione o delegate em `src/modules/admin/actions/revertAuditAction.ts`:
```typescript
const ENTITY_DELEGATES: Record<string, RevertibleDelegate> = {
  User: db.user as unknown as RevertibleDelegate,
  Project: db.project as unknown as RevertibleDelegate,
  Page: db.page as unknown as RevertibleDelegate,
  // NovaEntidade: db.novaEntidade as unknown as RevertibleDelegate,
}
```

## Regras
- `entity` SEMPRE em PascalCase = nome do model Prisma.
- Chame `logAudit` **após** a mutação e **antes** do `revalidatePath`.
- Nunca registre senhas/segredos → use `omitSensitive`.
