# Workflow Padrão — Desenvolvimento de Nova Feature
Siga esta ordem estritamente linear. Não avance para o próximo passo sem concluir e validar o atual.

`Branch` → `Banco` → `Domínio` → `Actions/Queries` → `Frontend` → `Testes` → `Postman/Docs` → `DevOpsSec` → `Registry` → `PR`

---

## 1. Controle de Versão (Branch)
Inicie isolando o ambiente de trabalho.
```bash
git checkout main
git pull origin main
git checkout -b feat/nome-da-feature
```

## 2. Banco de Dados (Schema & Prisma)
Skill associada: `database`
- Edite o arquivo `prisma/schema.prisma`.
- Sempre adicione `deletedAt DateTime?` se a tabela suportar soft-delete.
- Execute a migration e gere o client atualizado:
```bash
npm run db:migrate
npm run db:generate
```

## 3. Domínio (Regras de Negócio)
Skill associada: `domain`
- **Condicional:** Crie `src/modules/[mod]/domain/[Entidade].ts` APENAS se houver regras de estado complexas, cálculos ou validações específicas.
- Se for um CRUD simples, **Pule esta etapa** e utilize o Prisma diretamente nas Actions/Queries.
- Crie `src/modules/[mod]/domain/errors.ts` para mapear erros.

## 4. API (Actions e Queries)
Skill associada: `api`
- Crie as mutações (`actions`) e leituras (`queries`):
  - `src/modules/[mod]/actions/create[Entidade].ts`
  - `src/modules/[mod]/actions/update[Entidade].ts`
  - `src/modules/[mod]/actions/delete[Entidade].ts` (Sempre via Soft Delete)
  - `src/modules/[mod]/queries/get[Entidade]s.ts`
  - `src/modules/[mod]/queries/get[Entidade]ById.ts`
- **Regras de Action:** `use server` no topo -> Validar via Zod -> Checar Auth -> Executar -> `revalidatePath()` -> Retornar `{ ok, data }` ou `{ ok, error }`.
- **Regras de Query:** Filtre sempre com `deletedAt: null`.

## 5. Frontend (UI e Componentes)
Skill associada: `frontend`
- Crie as páginas e feedbacks visuais obrigatórios (Server Components por padrão):
  - `src/app/(dashboard)/[mod]/page.tsx`
  - `src/app/(dashboard)/[mod]/loading.tsx`
  - `src/app/(dashboard)/[mod]/error.tsx`
- Crie os componentes na pasta designada:
  - `src/components/[mod]/[Entidade]Table.tsx`
  - `src/components/[mod]/[Entidade]Form.tsx` (Obrigatório usar `useActionState` do React 19).

## 6. Qualidade (Testes)
Skill associada: `testing`
- Escreva testes garantindo a cobertura da lógica crítica e execute-os:
```bash
npm run test
```

## 7. Documentação de API Externa
Skill associada: `postman-docs`
- **Condicional:** Se a feature incluir novos Route Handlers (`app/api/...`) para integrações externas ou webhooks, crie ou atualize o arquivo JSON da coleção em `docs/postman/`.
- Se não houver endpoints externos, **pule esta etapa**.

## 8. Auditoria de Infraestrutura e Segurança
Skill associada: `devops-sec`
- Verifique se a nova feature exige alteração em variáveis de ambiente (`.env.example`).
- Valide se novos pacotes adicionados introduzem vulnerabilidades (`npm audit`).
- Garanta que o build standalone do Docker passará sem quebras.

## 9. Memória (Registro)
Skill associada: `registry`
- **OBRIGATÓRIO:** Atualize o `PROJECT.md` detalhando concisamente os módulos, entidades, queries, actions, componentes, rotas, coleções do Postman e variáveis de ambiente criadas/alteradas.
- Adicione a linha de log na tabela final de `PROJECT.md`.

## 10. Verificação Final e PR (Checklist)
Antes de abrir o Pull Request, execute o combo de verificação final:
```bash
npm run format && npm run lint && npm run typecheck && npm run test && npm run build
```

### Checklist Interno
- [ ] Migration commitada junto com o código.
- [ ] `deletedAt: null` aplicado em todas as queries.
- [ ] `revalidatePath()` executado após todas as mutations.
- [ ] Formulários utilizam `useActionState` com feedback de erro/sucesso.
- [ ] Coleção do Postman atualizada (se aplicável).
- [ ] Variáveis de ambiente seguras (sem dados sensíveis hardcoded).
- [ ] Zero tipagens genéricas (`any`) e zero `console.log()` perdidos.
- [ ] `PROJECT.md` devidamente atualizado.

### Template de PR
```markdown
## O que faz
[Breve descrição da feature]

## Como testar
1. [Passo 1]
2. [Passo 2]
3. [Link ou instrução para testar via Postman, se aplicável]

## Migration
- [ ] Não há
- [ ] Incluída: `add_[descricao]`

## Checklist de Qualidade
- [ ] `typecheck`, `lint`, `test` e `build` passando perfeitamente.
- [ ] Sem dívida técnica ou vulnerabilidades introduzidas.
```

```