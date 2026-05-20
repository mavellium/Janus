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
1. `pnpm format`
2. `pnpm lint`
3. `pnpm typecheck`

# Skills Obrigatórias e Recomendadas

## Documentação de Módulos (@.claude/skills/module-docs.md)
Quando implementar um **novo módulo** (domain, actions, queries), execute a skill `module-docs` para criar documentação estruturada em `.claude/context/[modulo]/`. Isso economiza 50-100KB de tokens em futuras sessões ao invés de ler código-fonte inteiro.

**Quando usar:**
- ✅ Novo módulo criado (ex: `src/modules/payments/`)
- ✅ Módulo complexo pronto para reutilização
- ✅ Módulo com muitas actions/queries para facilitar manutenção

---

# Gerenciamento de Tarefas (Registry Obrigatório)

**REGRA ABSOLUTA**: Ao final de QUALQUER tarefa que produza ou altere código, você DEVE executar a skill `@.claude/skills/registry.md` para registrar as mudanças em `PROJECT.md`.

**Por quê**: O PROJECT.md é a memória primária do projeto. Mantê-lo atualizado reduz drasticamente o uso de tokens e evita scans desnecessários de diretórios.

**Quando registrar**:
- ✅ Criou novo módulo, componente, página ou util
- ✅ Alterou arquivo de negócio (actions, queries, entidades)
- ✅ Modificou schema Prisma
- ✅ Renomeou ou deletou arquivo
- ❌ NÃO registrar: apenas mudanças de format/lint, testes isolados, ou comentários

# 🔒 Regra de Manutenção do CMS e Blog (Skill Obrigatória)

Sempre que for instruído a trabalhar no **CMS** ou no **Blog**, consulte os respectivos arquivos de arquitetura antes de propor qualquer código:
- CMS: `.claude/context/cms/` (rules.md, mode-legacy.md, mode-advanced.md)
- Blog: `.claude/context/blog/` (_index.md, domain.md, actions.md, queries.md, patterns.md)

Após alterações em qualquer um dos domínios, registre no Changelog do arquivo correspondente.

---

## CMS

**ESCOPO**: Aplicável a TODA modificação, refatoração, ou debugging de:
- Rotas de API CMS (`src/modules/projects/actions/*`)
- Builder e Editor (`src/components/schema-builder/*`, `src/app/.../builder/page.tsx`, `src/app/.../edit/page.tsx`)
- Componentes do CMS (`src/components/cms/*`)

**WORKFLOW OBRIGATÓRIO**:

1. **Antes de propor código**: Consulte `.claude/context/cms/`
   - Leia `.claude/context/cms/rules.md` para regras obrigatórias
   - Entenda o fluxo: `.claude/context/cms/mode-{legacy|advanced}.md`
   - Verifique padrões em `.claude/quick-ref/patterns.md`

2. **Durante implementação**: Siga rigorosamente as "Obrigações" (seção 8.2)
   - `structuredClone()` para deep copy
   - `setDeep()` para mutação aninhada
   - `unstable_noStore()` em pages que leem `isAdvanced`
   - Full-replace (não deep-merge) para `contentData`

3. **Após conclusão**: Obrigatoriamente atualize `.claude/context/cms/changelog.md`
   - Adicione uma entry com data, arquivos modificados, razão, e impacto
   - **Exemplo**:
     ```markdown
     ### [YYYY-MM-DD] — Descrição da Mudança
     
     **Arquivos**:
     - `path/to/file.ts`: mudança (1 linha)
     
     **Razão**: Por que foi necessário
     
     **Impacto**: Como afeta o fluxo
     ```

## Blog

**ESCOPO**: Aplicável a TODA modificação, refatoração, ou debugging de:
- Actions e queries do blog (`src/modules/blog/actions/*`, `src/modules/blog/queries/*`)
- Páginas do blog (`src/app/[companySlug]/dashboard/sites/[siteId]/blog/**`, `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/**`)
- Componentes do blog (`src/components/blog/*`)
- Endpoint público (`src/app/api/[companySlug]/[projectId]/blog/route.ts`)

**WORKFLOW OBRIGATÓRIO**:

1. **Antes de propor código**: Consulte `.claude/context/blog/`
   - Leia `_index.md` para orientação rápida
   - Leia `domain.md` — Regras Absolutas são inegociáveis
   - Valide schema Prisma em `domain.md` antes de assumir campos

2. **Durante implementação**:
   - `publishedAt <= now()` para filtrar posts publicados em contextos públicos
   - Sempre escopar queries por `projectId` ou `companyId`
   - Banner de API visível apenas para ADMIN/DEVELOPER (independe de viewMode)

3. **Após conclusão**: Atualize `.claude/context/blog/changelog.md`

**FALHA EM SEGUIR**: Código será rejeitado por violar contrato arquitetural