name: domain
description: >
  Cria ou modifica entidades de domínio, erros tipados e value objects.
  Utilizada para centralizar regras de negócio, validações de estado e lógica de transição.
  Garante que a lógica de negócio seja independente de frameworks e bancos de dados.

instructions: >
  ## Regra de Ouro
  Arquivos de domínio devem ser TypeScript PURO. É estritamente proibido importar Prisma, Next.js, 
  bibliotecas de UI ou qualquer dependência de infraestrutura nestes arquivos.
  Código gerado deve ser limpo e SEM comentários.

  ## 1. Estrutura da Entidade
  Localização: `src/modules/[modulo]/domain/[Entidade].ts`.
  Deve conter um construtor privado, métodos estáticos `create` e `reconstitute`, e métodos de comportamento.

  ```typescript
  import { randomUUID } from 'crypto'
  import {
    InvalidOrderAmountError,
    OrderAlreadyCancelledError,
    CannotCancelConfirmedOrderError,
    OrderAlreadyProcessedError,
  } from './errors'

  export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

  export interface OrderProps {
    id: string
    customerId: string
    totalInCents: number
    status: OrderStatus
    createdAt: Date
  }

  export class Order {
    private constructor(private props: OrderProps) {}

    get id() { return this.props.id }
    get status() { return this.props.status }
    get totalInCents() { return this.props.totalInCents }
    get customerId() { return this.props.customerId }
    get createdAt() { return this.props.createdAt }

    static create(input: { customerId: string; totalInCents: number }): Order {
      if (input.totalInCents <= 0) throw new InvalidOrderAmountError(input.totalInCents)
      return new Order({
        id: randomUUID(),
        customerId: input.customerId,
        totalInCents: input.totalInCents,
        status: 'PENDING',
        createdAt: new Date(),
      })
    }

    static reconstitute(props: OrderProps): Order {
      return new Order(props)
    }

    confirm(): void {
      if (this.props.status !== 'PENDING') throw new OrderAlreadyProcessedError(this.props.id)
      this.props.status = 'CONFIRMED'
    }

    cancel(): void {
      if (this.props.status === 'CANCELLED') throw new OrderAlreadyCancelledError(this.props.id)
      if (this.props.status === 'CONFIRMED') throw new CannotCancelConfirmedOrderError(this.props.id)
      this.props.status = 'CANCELLED'
    }

    toObject(): OrderProps {
      return { ...this.props }
    }
  }
  ```

  ## 2. Erros de Domínio Tipados
  Localização: `src/modules/[modulo]/domain/errors.ts`.
  Todos os erros devem herdar de uma classe base `DomainError`.

  ```typescript
  export class DomainError extends Error {
    constructor(message: string, public readonly code: string) {
      super(message)
      this.name = this.constructor.name
    }
  }

  export class InvalidOrderAmountError extends DomainError {
    constructor(amount: number) {
      super(`Valor inválido: ${amount}`, 'INVALID_ORDER_AMOUNT')
    }
  }

  export class OrderNotFoundError extends DomainError {
    constructor(id: string) {
      super(`Pedido ${id} não encontrado`, 'ORDER_NOT_FOUND')
    }
  }

  export class OrderAlreadyCancelledError extends DomainError {
    constructor(id: string) {
      super(`Pedido ${id} já foi cancelado`, 'ORDER_ALREADY_CANCELLED')
    }
  }

  export class CannotCancelConfirmedOrderError extends DomainError {
    constructor(id: string) {
      super(`Pedido ${id} confirmado não pode ser cancelado`, 'CANNOT_CANCEL_CONFIRMED')
    }
  }
  ```

  ## Diretrizes de Implementação
  - ✅ **Encapsulamento:** Use `private constructor` para forçar o uso de `create()` ou `reconstitute()`.
  - ✅ **Validação no Create:** O método `create()` deve validar regras de negócio iniciais e lançar exceções se violadas.
  - ✅ **Pureza do Reconstitute:** O método `reconstitute()` nunca deve validar dados, pois assume-se que os dados vindos do banco já foram validados anteriormente.
  - ✅ **Lógica na Entidade:** Transições de estado (ex: de `PENDING` para `CANCELLED`) devem ser métodos da entidade, não lógica solta na Action.
  - ❌ **CRUD Simples:** Se o módulo for apenas salvar e ler dados sem regras (ex: um log simples), NÃO crie uma entidade de domínio. Use o Prisma diretamente na Action.

  **Ação Final OBRIGATÓRIA:** Após criar ou modificar qualquer arquivo de domínio, invoque a skill `registry` para atualizar o `PROJECT.md`.