name: testing
description: >
  Escreve e executa testes automatizados utilizando Vitest e Testing Library. 
  Foca na pirâmide de testes com prioridade em: 1. Domínio, 2. Actions Críticas, 3. API (Route Handlers), 4. Componentes.

instructions: >
  ## Estratégia de Testes
  A qualidade do projeto Janus baseia-se em lógica de domínio testada exaustivamente e contratos de API garantidos.
  - **Domínio:** 100% de cobertura. Teste todas as transições de estado e erros.
  - **Actions:** Teste o fluxo feliz e as falhas previstas (Zod, Auth, Erros de Domínio).
  - **API (Route Handlers):** Teste endpoints de integração mockando NextRequest e NextResponse.
  - **Componentes:** Teste apenas lógica condicional de renderização e interações de Client Components.

  ## 1. Testes de Domínio (Alta Prioridade)
  Localização: `src/modules/[mod]/domain/[Entidade].spec.ts`
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { Order } from './Order'
  import { InvalidOrderAmountError } from './errors'

  describe('Order', () => {
    it('cria pedido PENDING com valor válido', () => {
      const order = Order.create({ customerId: 'u1', totalInCents: 5000 })
      expect(order.status).toBe('PENDING')
      expect(order.id).toBeDefined()
    })

    it('lança erro para valor zero', () => {
      expect(() => Order.create({ customerId: 'u1', totalInCents: 0 })).toThrow(InvalidOrderAmountError)
    })
  })
  ```

  ## 2. Testes de Actions (Com Mocks)
  Localização: `src/modules/[mod]/actions/[acao].spec.ts`
  ```typescript
  import { describe, it, expect, vi } from 'vitest'
  import { createOrder } from './createOrder'

  vi.mock('@/lib/prisma', () => ({
    db: { order: { create: vi.fn().mockResolvedValue({ id: 'order-1' }) } },
  }))

  vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

  describe('createOrder', () => {
    it('cria pedido com sucesso', async () => {
      const result = await createOrder({ totalInCents: 5000 })
      expect(result.ok).toBe(true)
    })
  })
  ```

  ## 3. Testes de API (Route Handlers)
  Localização: `src/app/api/[...]/route.spec.ts`
  ```typescript
  import { describe, it, expect, vi } from 'vitest'
  import { POST } from './route'
  import { NextRequest } from 'next/server'

  vi.mock('@/lib/prisma', () => ({
    db: { order: { update: vi.fn().mockResolvedValue({}) } }
  }))

  describe('API: Webhook de Pedidos', () => {
    it('processa o webhook com sucesso', async () => {
      const req = new NextRequest('http://localhost/api/webhooks/orders', {
        method: 'POST',
        body: JSON.stringify({ orderId: '123', status: 'CONFIRMED' })
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })
  })
  ```

  ## 4. Testes de Componentes
  Localização: `src/components/[mod]/[Comp].spec.tsx`
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import { OrdersTable } from './OrdersTable'

  describe('OrdersTable', () => {
    it('mostra mensagem de lista vazia', () => {
      render(<OrdersTable orders={[]} />)
      expect(screen.getByText('Nenhum pedido')).toBeInTheDocument()
    })
  })
  ```

  ## Checklist de Regras Absolutas
  - ✅ **Toda Entidade** de domínio deve possuir um arquivo `.spec.ts` correspondente.
  - ✅ **Toda Rota de API** (`route.ts`) deve possuir um `.spec.ts` validando status e resposta.
  - ✅ **Mocks:** Sempre mocke `@/lib/prisma`, `next/cache` e bibliotecas externas.
  - ✅ **Nomes:** Use `describe` para o nome da função/endpoint e `it` para o comportamento esperado.
  - ❌ **Sem Comentários:** Proibido deixar comentários explicativos nos arquivos de teste.
  
  **Ação Final OBRIGATÓRIA:** Após criar ou rodar testes, invoque a skill `registry` para atualizar o `PROJECT.md`.