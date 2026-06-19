# Analytics — Server Actions

## updateProjectGa4
- **Assinatura:** `async ({ projectId, companySlug, ga4PropertyId }) => Promise<{ ok, data?, error? }>`
- **Validação:** Zod — `projectId: uuid`, `companySlug: min(1)`, `ga4PropertyId: regex(/^\d+$/)` (só números)
- **Fluxo:** 1. auth check → 2. valida Zod → 3. busca company por slug → 4. checa role/companySlug → 5. confirma project pertence à company → 6. `db.project.update` → 7. `revalidatePath` (sites + landing-pages analytics)
- **Autorização:** autenticado; não-ADMIN só pode mexer na própria empresa (`session.user.companySlug === companySlug`)
- **Erro comum:** Property ID com letras → "O Property ID deve conter apenas números"

> ❌ `updateCompanyGa4` foi **removido** (2026-06-19). Não existe mais Property ID no nível da empresa.
