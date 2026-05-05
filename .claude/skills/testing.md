name: testing
description: >
  Escreve e executa testes automatizados utilizando Vitest e Testing Library. 
  Foca na pirâmide de testes com prioridade em: 1. Domínio, 2. Actions Críticas, 3. Componentes Complexos.

instructions: >
  ## Estratégia de Testes
  A qualidade do projeto Janus baseia-se em lógica de domínio testada exaustivamente.
  - **Domínio:** 100% de cobertura. Teste todas as transições de estado e erros.
  - **Actions:** Teste o fluxo feliz e as falhas previstas (Zod, Auth, Erros de Domínio).
  - **Componentes:** Teste apenas lógica condicional de renderização e interações de Client Components.

  ## 1. Testes de Domínio (Alta Prioridade)
  Localização: `src/modules/[mod]/domain/[Entidade].spec.ts`
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { Order } from './Order'
  import { InvalidOrderAmountError, OrderAlreadyCancelledError, CannotCancelConfirmedOrderError } from './errors'

  describe('Order', () => {
    describe('create()', () => {
      it('cria pedido PENDING com valor válido', () => {
        const order = Order.create({ customerId: 'u1', totalInCents: 5000 })
        expect(order.status).toBe('PENDING')
        expect(order.totalInCents).toBe(5000)
        expect(order.id).toBeDefined()
      })

      it('lança erro para valor zero ou negativo', () => {
        expect(() => Order.create({ customerId: 'u1', totalInCents: 0 })).toThrow(InvalidOrderAmountError)
        expect(() => Order.create({ customerId: 'u1', totalInCents: -1 })).toThrow(InvalidOrderAmountError)
      })
    })

    describe('cancel()', () => {
      it('cancela pedido PENDING', () => {
        const order = Order.create({ customerId: 'u1', totalInCents: 1000 })
        order.cancel()
        expect(order.status).toBe('CANCELLED')
      })

      it('lança erro ao cancelar pedido confirmado', () => {
        const order = Order.create({ customerId: 'u1', totalInCents: 1000 })
        order.confirm()
        expect(() => order.cancel()).toThrow(CannotCancelConfirmedOrderError)
      })
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
    it('cria pedido com dados válidos', async () => {
      const result = await createOrder({ totalInCents: 5000 })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.id).toBeDefined()
    })

    it('retorna erro de validação para tipo errado', async () => {
      // @ts-expect-error teste intencional
      const result = await createOrder({ totalInCents: 'abc' })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe('VALIDATION_ERROR')
    })
  })
  ```

  ## 3. Testes de Componentes
  Localização: `src/components/[mod]/[Comp].spec.tsx`
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import { OrdersTable } from './OrdersTable'

  const orders = [{
    id: 'abc-123',
    totalInCents: 5000,
    status: 'PENDING',
    createdAt: new Date(),
  }]

  describe('OrdersTable', () => {
    it('renderiza pedidos corretamente', () => {
      render(<OrdersTable orders={orders} />)
      expect(screen.getByText('PENDING')).toBeInTheDocument()
    })

    it('mostra mensagem de lista vazia', () => {
      render(<OrdersTable orders={[]} />)
      expect(screen.getByText('Nenhum pedido')).toBeInTheDocument()
    })
  })
  ```

  ## Configurações de Ambiente
  - **vitest.config.ts:** Configurado com `environment: 'jsdom'`, `globals: true` e aliases para `@/*`.
  - **src/test/setup.ts:** Importa `@testing-library/jest-dom` para matchers de UI.

  ## Checklist de Regras Absolutas
  - ✅ **Toda Entidade** de domínio deve possuir um arquivo `.spec.ts` correspondente.
  - ✅ **Mocks de Infraestrutura:** Sempre mocke `@/lib/prisma` e `next/cache` em testes de Action.
  - ✅ **Nomes Descritivos:** Use `describe` para o nome do método/componente e `it` começando com verbo.
  - ✅ **Async/Await:** Sempre utilize em testes de Actions e Queries.
  - ❌ **Sem Comentários:** Proibido deixar comentários explicativos dentro dos arquivos de teste gerados.
  - ❌ **Proibido `any`:** Testes devem ser tão tipados quanto o código de produção.

  **Ação Final OBRIGATÓRIA:** Após criar ou rodar testes, invoque a skill `registry` para atualizar o progresso no `PROJECT.md`.
```