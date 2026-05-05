# Code Style e Regras Absolutas
- Escreva código limpo, de nível de produção e SEM comentários explicativos inseridos no meio dos arquivos fonte.
- É estritamente proibido o uso de gambiarras (workarounds) ou soluções paliativas (ex: usar localStorage para controle estrutural). 
- Toda implementação deve ser precisa e 100% embasada na documentação oficial atualizada da stack. Se tiver dúvida, acesse a internet ou leia os arquivos dentro de node_modules.

# Stack e Arquitetura
- Stack: Next.js 16 (App Router), React 19, Prisma 6, PostgreSQL, TypeScript 5.
- UI: shadcn/ui, Radix UI, Tailwind CSS v4, lucide-react.
- Validação: Zod 3.24.
- Testes: Vitest 3 + Testing Library.
- Estrutura Clean Architecture:
  - `src/app/`: Server Components, rotas, páginas e layouts.
  - `src/modules/[modulo]/`: Lógica de negócio isolada por domínio.
    - `domain/`: Regras de negócio tipadas.
    - `actions/`: Server Actions.
    - `queries/`: Leitura direta no Prisma.
  - `src/components/`: Componentes visuais.
  - `src/lib/`: Configurações singleton (prisma.ts, utils.ts).

# Backend (React 19 / Next.js)
- Server Actions (`'use server'`) exclusivas para mutações e submissão de formulários.
- O fluxo obrigatório para Actions é: Validação com Zod -> Checagem de Auth -> Execução no Prisma -> `revalidatePath()`.
- O retorno padronizado de Actions deve ser: `{ ok: true, data: any }` ou `{ ok: false, error: string, code?: number }`.
- Consultas (Queries) devem ser feitas diretamente via Prisma no servidor, sempre aplicando filtro `deletedAt: null` quando a entidade suportar soft delete.
- Entidades isoladas devem ser criadas apenas se houver lógica complexa acoplada; do contrário, utilize o Prisma diretamente na Action/Query.

# Frontend
- Por padrão, os componentes devem ser Server Components.
- Utilize `'use client'` apenas quando houver dependência de estado, hooks (useState, useEffect) ou interações de navegador.
- Os formulários DEVEM obrigatoriamente utilizar o hook `useActionState` nativo do React 19.

# Comandos e Verificações Obrigatórias
Após finalizar uma implementação complexa, modificado configurações ou antes de encerrar um fluxo, você DEVE rodar e garantir que os comandos abaixo passem:
1. `npm run format`
2. `npm run lint`
3. `npm run typecheck`

# Gerenciamento de Tarefas
- Leia o arquivo `PROJECT.md` antes de tomar decisões estruturais para entender o contexto do que já foi feito.
- Atualize o `PROJECT.md` automaticamente assim que uma nova feature for concluída ou a estrutura for alterada.