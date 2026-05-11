---
name: database
description: >
  Altera schema do Prisma, gerencia migrations e define padrões de modelo de banco de dados.
  Deve ser usada sempre que for necessário criar tabelas, colunas, relações ou índices.
---

instructions: >
  ## Regra de Ouro
  Nunca adicione comentários explicativos dentro do arquivo `schema.prisma` ou do singleton `prisma.ts`.
  O mapeamento de banco deve seguir o padrão `snake_case` e o código TypeScript deve seguir `camelCase`.

  ## 1. Padrão de Modelagem (Template)
  Todo modelo deve obrigatoriamente possuir chaves primárias como UUID, colunas de auditoria e suporte a soft delete.
  
  ```prisma
  model Order {
    id           String      @id @default(uuid()) @db.Uuid
    status       OrderStatus @default(PENDING)
    totalInCents Int         @map("total_in_cents")
    notes        String?     @db.Text
    customerId   String      @map("customer_id") @db.Uuid
    customer     User        @relation(fields: [customerId], references: [id])
    createdAt    DateTime    @default(now()) @map("created_at")
    updatedAt    DateTime    @updatedAt @map("updated_at")
    deletedAt    DateTime?   @map("deleted_at")

    @@index([customerId])
    @@index([status])
    @@index([deletedAt])
    @@map("orders")
  }

  enum OrderStatus {
    PENDING
    CONFIRMED
    CANCELLED

    @@map("order_status")
  }
  ```

  ## 2. Relações Entre Tabelas
  Relações 1:N são diretas. Relações N:M DEVEM utilizar tabela pivô explícita. Nunca utilize relações implícitas.

  ```prisma
  model User {
    id     String  @id @default(uuid()) @db.Uuid
    orders Order[]

    @@map("users")
  }

  model OrderProduct {
    orderId   String  @map("order_id") @db.Uuid
    productId String  @map("product_id") @db.Uuid
    quantity  Int
    order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
    product   Product @relation(fields: [productId], references: [id])

    @@id([orderId, productId])
    @@map("order_products")
  }
  ```

  ## 3. Singleton do Prisma (`src/lib/prisma.ts`)
  ```typescript
  import { PrismaClient } from '@prisma/client'

  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

  export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
  ```

  ## 4. Regras Absolutas de Deleção (Soft Delete)
  É estritamente proibido deletar registros fisicamente. O banco de dados e as queries só trabalham com Soft Delete.

  - **Consulta válida:**
    ```typescript
    await db.order.findMany({ where: { deletedAt: null } })
    ```
  - **Deleção válida (Soft Delete):**
    ```typescript
    await db.order.update({ where: { id }, data: { deletedAt: new Date() } })
    ```
  - **Deleção PROIBIDA:**
    ```typescript
    await db.order.delete({ where: { id } })
    ```

  ## 5. Checklist de Convenções
  - ✅ `@id @default(uuid()) @db.Uuid` → IDs sempre UUID.
  - ✅ `@map("snake_case")` → Colunas reais no banco sempre em snake_case.
  - ✅ `@@map("snake_case_plural")` → Nome de tabelas sempre em snake_case no plural.
  - ✅ `deletedAt DateTime?` → Obrigatório em TODAS as tabelas de domínio.
  - ✅ `@@index` → Sempre indexar chaves estrangeiras (FKs) e `deletedAt`.

  ## 6. Fluxo de Trabalho (Workflow)
  1. Editar `prisma/schema.prisma`.
  2. Executar no terminal: `npm run db:migrate` (fornecer nome descritivo para a migration como `add_orders_table`).
  3. A geração do Client é automática via package.json.
  4. **OBRIGATÓRIO:** Invocar a skill `registry` para atualizar o arquivo `PROJECT.md` com as alterações do schema.
```