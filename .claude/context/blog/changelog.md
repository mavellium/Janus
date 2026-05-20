# Blog — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

---

### [2026-05-20] — API pública + banner RBAC + documentação inicial

**Arquivos:**
- `src/app/api/[companySlug]/[projectId]/blog/route.ts`: criado — GET público com projectId no path, paginação e busca
- `src/components/blog/ApiEndpointBanner.tsx`: criado — banner client com cópia de URL
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/posts/page.tsx`: banner condicional ADMIN/DEV
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/posts/page.tsx`: idem

**Razão:** Expor API pública por projeto; facilitar descoberta para Devs/Admins.

**Impacto:** URL canônica da API: `/api/{companySlug}/{projectId}/blog`. Rota genérica sem projectId removida.
