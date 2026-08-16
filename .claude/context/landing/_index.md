# Landing — Sumário Executivo

Página pública de venda do Janus na raiz (`/`), em pt-BR, escrita para o **cliente final** (quem usa o painel), não para quem desenvolve. Sessão ativa nunca chega a vê-la: é redirecionada para o dashboard.

| Aspecto | Responsável |
| :------ | :---------- |
| Rota | `src/app/page.tsx` — Server Component: guard de sessão + composição das 9 seções |
| Componentes | `src/components/landing/*` — 10 arquivos (4 Server, 6 Client) |
| Estilo | Bloco `lp-*` no fim de `src/app/globals.css` (keyframes, tipografia, `color-mix`) |
| Actions | **Nenhuma** — a landing não muta nada |
| Queries | **Nenhuma** — o único acesso a dados é `auth()` para o redirecionamento |

> Sem `actions.md` e `queries.md` de propósito: é uma superfície de UI, sem mutação nem leitura de banco.

## Arquivos

- [domain.md](domain.md) — dados, estado da animação e tokens visuais
- [components.md](components.md) — o que cada componente renderiza
- [patterns.md](patterns.md) — snippets e as 3 armadilhas do stack
- [changelog.md](changelog.md) — histórico

## Para mexer aqui, você precisa saber

- [ ] Modificadores de opacidade do Tailwind (`bg-x/10`) **não funcionam** neste projeto — use os utilitários `lp-tint-*` / `color-mix`
- [ ] `overflow-x-hidden` em wrapper de página **quebra** a nav fixa — use `overflow-x-clip`
- [ ] Toda animação precisa de contraparte em `prefers-reduced-motion`
- [ ] O texto é para o cliente final: nada de multi-tenant, slug, CORS, req/min, SDK, AVIF
