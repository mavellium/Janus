---
name: frontend
description: >
  Cria páginas Next.js, componentes React e formulários sob rígidos padrões arquiteturais.
  Força Server Components por padrão. 'use client' é permitido apenas para estado ou eventos.
  Implementa formulários com useActionState nativo (React 19). UI com shadcn, Tailwind e lucide-react.
---

instructions: >
  ## Regra de Ouro
  Páginas e componentes SÃO Server Components por padrão. Adicione `'use client'` APENAS se houver estado (`useState`), eventos de usuário (`onClick`) ou hooks de transição. Proibido buscar dados via `useEffect`.

  ## 1. Page (Server Component)
  Sempre utilize Server Components para rotas. Busque os dados na page e repasse via props.
  ```tsx
  // src/app/(dashboard)/orders/page.tsx
  import { getOrders } from '@/modules/orders/queries/getOrders'
  import { OrdersTable } from '@/components/orders/OrdersTable'
  import { Button } from '@/components/ui/button'
  import Link from 'next/link'

  // Recebe searchParams para filtros/paginação
  export default async function OrdersPage({
    searchParams,
  }: {
    searchParams: Promise<{ page?: string }>
  }) {
    const { page } = await searchParams
    const orders = await getOrders('user-id') // substituir pela session real

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <Button asChild>
            <Link href="/dashboard/orders/new">Novo pedido</Link>
          </Button>
        </div>
        <OrdersTable orders={orders} />
      </div>
    )
  }
  ```

  ## 2. Feedbacks Visuais Obrigatórios (Loading e Error)
  ```tsx
  // src/app/(dashboard)/orders/loading.tsx
  import { Skeleton } from '@/components/ui/skeleton'

  export default function Loading() {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // src/app/(dashboard)/orders/error.tsx
  'use client'

  export default function Error({ reset }: { reset: () => void }) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">Algo deu errado.</p>
        <button onClick={reset} className="text-sm underline underline-offset-4">
          Tentar novamente
        </button>
      </div>
    )
  }
  ```

  ## 3. Listagens e Tabelas (Server Component)
  ```tsx
  // src/components/orders/OrdersTable.tsx
  import type { OrderRow } from '@/modules/orders/queries/getOrders'
  import { Badge } from '@/components/ui/badge'
  import { EmptyState } from '@/components/ui/empty-state'
  import { OrderActions } from './OrderActions'
  import { formatCurrency, formatDate } from '@/lib/utils'

  interface Props { orders: OrderRow[] }

  export function OrdersTable({ orders }: Props) {
    if (orders.length === 0) {
      return <EmptyState title="Nenhum pedido" description="Crie seu primeiro pedido." />
    }

    return (
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Data</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {order.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(order.totalInCents)}</td>
                <td className="px-4 py-3">
                  <Badge variant={order.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <OrderActions orderId={order.id} status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  ```

  ## 4. Formulários (Client Component - React 19 Nativo)
  Sem bibliotecas externas como react-hook-form.
  ```tsx
  // src/components/orders/CreateOrderForm.tsx
  'use client'

  import { useActionState } from 'react'
  import { createOrder } from '@/modules/orders/actions/createOrder'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'

  type FormState = { error?: string; success?: boolean }

  async function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
    const totalInCents = Number(formData.get('totalInCents'))
    const result = await createOrder({ totalInCents })
    if (!result.ok) return { error: result.error }
    return { success: true }
  }

  export function CreateOrderForm() {
    const [state, action, pending] = useActionState(formAction, {})

    if (state.success) {
      return <p className="text-sm text-green-600">Pedido criado com sucesso!</p>
    }

    return (
      <form action={action} className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="totalInCents">Valor (em centavos)</Label>
          <Input id="totalInCents" name="totalInCents" type="number" required min={1} />
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Criando...' : 'Criar Pedido'}
        </Button>
      </form>
    )
  }
  ```

  ## 5. Ações Pontuais em Botões (Client Component)
  ```tsx
  // src/components/orders/OrderActions.tsx
  'use client'

  import { useState, useTransition } from 'react'
  import { cancelOrder } from '@/modules/orders/actions/cancelOrder'
  import { Button } from '@/components/ui/button'

  interface Props { orderId: string; status: string }

  export function OrderActions({ orderId, status }: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleCancel() {
      startTransition(async () => {
        const result = await cancelOrder({ orderId })
        if (!result.ok) setError(result.error ?? 'Erro ao cancelar')
      })
    }

    if (status !== 'PENDING') return null

    return (
      <div className="flex flex-col items-end gap-1">
        <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending}>
          {isPending ? 'Cancelando…' : 'Cancelar'}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }
  
```

  ## Utilitários Base Requeridos (`src/lib/utils.ts`)
  Certifique-se de que o sistema possui os helpers `cn`, `formatCurrency` e `formatDate` antes de renderizar componentes complexos.

  ## Checklist de Regras Absolutas
  - ✅ `useActionState` para formulários (React 19 nativo, sem lib extra).
  - ✅ `useTransition` para ações de botão que dependem de Server Actions.
  - ✅ Componente SÓ é Client Component se precisar gerenciar estado ou interatividade.
  - ✅ Utilize `lucide-react` para ícones e `shadcn/ui` para primitivos visuais.
  - ❌ NUNCA utilize `useEffect` para buscar dados (fetching).
  - ❌ NUNCA declare `'use client'` em layouts ou pages que fazem busca de dados (Server Components).
  
  **Ação Final OBRIGATÓRIA:** Após criar ou modificar qualquer arquivo frontend, invoque imediatamente a skill `registry` para atualizar o `PROJECT.md`.
```