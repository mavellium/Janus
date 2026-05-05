name: api
description: >
  Cria Server Actions e Queries para o Next.js. Exige o uso de Server Actions padronizadas
  para mutações e Queries diretas do Prisma para leitura. Limita Route Handlers estritamente a webhooks.

instructions: >
  ## Regra de Ouro
  Código de produção DEVE ser gerado sem comentários explicativos. O código deve ser auto-documentado.
  - **Mutações:** Server Actions com Zod, tratamento de erros e revalidação de cache.
  - **Leituras:** Prisma direto (Queries), sem passar por entidades de domínio, sempre com select mínimo e filtro de soft delete.
  - **Webhooks:** Único cenário onde Route Handlers (`route.ts`) são permitidos.

  ## 1. Server Action (Mutação com Domínio)
  O fluxo obrigatório é: Validação (Zod) -> Auth -> Instanciação do Domínio -> Persistência (Prisma) -> Revalidação de Cache.
  
  ```typescript
  // src/modules/orders/actions/createOrder.ts
  'use server'

  import { z } from 'zod'
  import { revalidatePath } from 'next/cache'
  import { db } from '@/lib/prisma'
  import { Order } from '../domain/Order'
  import { DomainError } from '../domain/errors'

  const schema = z.object({
    totalInCents: z.number().int().positive(),
  })

  export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string; code?: string }

  export async function createOrder(
    input: z.infer<typeof schema>
  ): Promise<ActionResult<{ id: string }>> {
    const parsed = schema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: 'Dados inválidos', code: 'VALIDATION_ERROR' }
    }

    try {
      const order = Order.create({
        customerId: 'user-id', 
        totalInCents: parsed.data.totalInCents,
      })

      await db.order.create({ data: order.toObject() })

      revalidatePath('/dashboard/orders')

      return { ok: true, data: { id: order.id } }
    } catch (err) {
      if (err instanceof DomainError) {
        return { ok: false, error: err.message, code: err.code }
      }
      console.error('[createOrder]', err)
      return { ok: false, error: 'Erro interno. Tente novamente.' }
    }
  }
  ```

  ## 2. Server Action (Atualização/Deleção Lógica)
  ```typescript
  // src/modules/orders/actions/cancelOrder.ts
  'use server'

  import { z } from 'zod'
  import { revalidatePath } from 'next/cache'
  import { db } from '@/lib/prisma'
  import { Order } from '../domain/Order'
  import { DomainError, OrderNotFoundError } from '../domain/errors'
  import type { ActionResult } from './createOrder'

  const schema = z.object({ orderId: z.string().uuid() })

  export async function cancelOrder(input: z.infer<typeof schema>): Promise<ActionResult> {
    const parsed = schema.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'ID inválido' }

    try {
      const raw = await db.order.findUnique({
        where: { id: parsed.data.orderId, deletedAt: null },
      })
      if (!raw) throw new OrderNotFoundError(parsed.data.orderId)

      const order = Order.reconstitute(raw)
      order.cancel()

      await db.order.update({
        where: { id: order.id },
        data: { status: order.status },
      })

      revalidatePath('/dashboard/orders')
      return { ok: true }
    } catch (err) {
      if (err instanceof DomainError) {
        return { ok: false, error: err.message, code: err.code }
      }
      console.error('[cancelOrder]', err)
      return { ok: false, error: 'Erro interno. Tente novamente.' }
    }
  }
  ```

  ## 3. Query (Leitura Otimizada)
  Sem uso de entidades. Prisma direto com projeção exata. OBRIGATÓRIO aplicar `deletedAt: null`.
  
  ```typescript
  // src/modules/orders/queries/getOrders.ts
  import { db } from '@/lib/prisma'

  export interface OrderRow {
    id: string
    totalInCents: number
    status: string
    createdAt: Date
  }

  export async function getOrders(customerId: string): Promise<OrderRow[]> {
    return db.order.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, totalInCents: true, status: true, createdAt: true },
    })
  }

  export async function getOrderById(id: string, customerId: string): Promise<OrderRow | null> {
    return db.order.findFirst({
      where: { id, customerId, deletedAt: null },
      select: { id: true, totalInCents: true, status: true, createdAt: true },
    })
  }
  ```

  ## 4. Route Handler (Exclusivo para Webhooks)
  ```typescript
  // src/app/api/webhooks/[provider]/route.ts
  import { NextRequest, NextResponse } from 'next/server'

  export async function POST(req: NextRequest) {
    return NextResponse.json({ received: true })
  }
  
```

  ## Checklist de Regras Absolutas
  - ✅ `'use server'` obrigatoriamente na primeira linha de arquivos de Action.
  - ✅ Retorno padronizado `{ ok: true/false }`. NUNCA use `throw` para devolver erros ao cliente.
  - ✅ `revalidatePath()` invocado após qualquer mutação bem-sucedida.
  - ✅ Utilizar validação rigorosa com Zod para todo input de Action.
  - ❌ Proibido colocar regras de negócio complexas soltas na Action (delegue para a Entidade).
  - ❌ Proibido usar Route Handlers (`app/api/.../route.ts`) para operações CRUD padrão.
  
  **Ação Final OBRIGATÓRIA:** Após criar ou modificar qualquer Action ou Query, invoque a skill `registry` para atualizar o `PROJECT.md`.
```