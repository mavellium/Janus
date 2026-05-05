name: registry
description: >
  Atualiza o arquivo PROJECT.md após criar, modificar ou deletar qualquer arquivo do projeto.
  SEMPRE execute esta skill ao final de qualquer tarefa que produza ou altere código.
  O PROJECT.md é a memória primária do projeto: mantê-lo atualizado e conciso reduz drasticamente o uso de tokens e evita que o Claude precise escanear diretórios inteiros no futuro.

instructions: >
  ## Objetivo
  Atualizar o arquivo `PROJECT.md` refletindo o estado atual da base de código. Seja estritamente conciso.

  ## O Que Registrar e Como Formatar

  ### 1. Módulos
  Se criou ou alterou módulos de domínio, registre sob a categoria "Módulos":
  ### [nome-do-modulo]
  - **Entidade:** `src/modules/[mod]/domain/[Entidade].ts` — [o que representa]
  - **Erros:** `src/modules/[mod]/domain/errors.ts` — [código_A, código_B]
  - **Actions:** `src/modules/[mod]/actions/[acao].ts` — [o que faz de forma super resumida]
  - **Queries:** `src/modules/[mod]/queries/[query].ts` — [o que retorna]

  ### 2. Componentes
  Se criou componentes UI, adicione à lista "Componentes":
  - `src/components/[mod]/[Componente].tsx` — [Server ou Client] — [o que renderiza]

  ### 3. Páginas
  Se criou rotas/páginas, adicione à lista "Páginas":
  - `src/app/(dashboard)/[rota]/page.tsx` — [o que exibe]

  ### 4. Schema Prisma
  Se alterou o banco de dados, adicione à lista "Schema Prisma":
  - **[Model]** (`[tabela]`) — campos principais: id, status | relações: [Model2]

  ### 5. Lib / Utilitários
  - `src/lib/[arquivo].ts` — [função ou utilidade]

  ## Regras Absolutas de Atualização
  1. **Registro Obrigatório:** Registre sempre, mesmo mudanças mínimas como um novo método exportado.
  2. **Concisão Extrema:** Uma linha por arquivo. Proibido adicionar blocos de código no PROJECT.md.
  3. **Remoção e Renomeação:** Se deletar um arquivo, remova sua linha das seções acima. Se renomear, atualize o caminho.
  4. **Log de Alterações (Tabela Final):** Sempre adicione uma linha no final da tabela "Últimas alterações" com a data de hoje. Formato obrigatório:
     | YYYY-MM-DD | `arquivo` | Breve descrição da alteração |

  ## Exemplo de PROJECT.md Ideal e Preenchido

  ## Módulos

  ### orders
  - **Entidade:** `src/modules/orders/domain/Order.ts` — pedido com ciclo de vida
  - **Erros:** `src/modules/orders/domain/errors.ts` — INVALID_AMOUNT, NOT_FOUND
  - **Actions:** `createOrder.ts` — cria | `cancelOrder.ts` — cancela PENDING
  - **Queries:** `getOrders.ts` — lista do usuário

  ### users
  - **Entidade:** — (sem entidade, CRUD simples)
  - **Actions:** `updateProfile.ts` — atualiza nome e avatar
  - **Queries:** `getProfile.ts` — dados do usuário logado

  ## Componentes
  - `src/components/orders/OrdersTable.tsx` — Server — lista com badge de status
  - `src/components/orders/OrderActions.tsx` — Client — botão de cancelar pedido
  - `src/components/orders/CreateOrderForm.tsx` — Client — form com useActionState nativo

  ## Páginas
  - `src/app/(dashboard)/orders/page.tsx` — lista de pedidos
  - `src/app/(dashboard)/orders/new/page.tsx` — criação de pedido

  ## Schema Prisma
  - **User** (`users`) — id, email, name, createdAt, deletedAt
  - **Order** (`orders`) — id, status, totalInCents, customerId | relações: User

  ## Últimas alterações
  | Data       | Arquivo             | O que foi feito                             |
  | :--------- | :------------------ | :------------------------------------------ |
  | 2026-05-05 | `Order.ts`          | Adicionado método confirm()                 |
  | 2026-05-05 | `OrdersTable.tsx`   | Criada tabela de pedidos em Server Component|
  | 2026-05-04 | `schema.prisma`     | Adicionado model Order com soft delete      |