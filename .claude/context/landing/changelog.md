# Landing — Histórico

**Instrução:** atualize aqui cada vez que mexer na landing.

### [2026-08-16] — Criação da landing pública + documentação inicial

**Arquivos:**
- `src/app/page.tsx`: raiz deixou de ser só redirecionador e virou a página de venda (guard de sessão preservado)
- `src/components/landing/*`: 10 componentes novos
- `src/app/globals.css`: bloco `lp-*` (keyframes, tipografia Geist, utilitários `color-mix`, `scroll-behavior` escopado, `prefers-reduced-motion`)

**Razão:** vender o produto para o cliente final preservando a identidade visual existente (paleta brand quente, logos, tokens semânticos), sem parecer template de IA.

**Impacto:** `/` passou a renderizar HTML para visitante anônimo. O middleware (`auth.config.ts`) segue redirecionando sessão ativa antes do render — o guard em `page.tsx` é redundância defensiva.

**Decisões que se firmaram no caminho:**
- Conteúdo 100% ancorado no código real (endpoints, labels de scoring, pesos do IAG, limites); zero prova social inventada
- Público final, não desenvolvedor: removidos multi-tenant, `/slug`, CORS, req/min, SDK, AVIF, schema/UI Schema. A seção da API ficou, rotulada "Para quem desenvolve"
- Hero: 2 colunas com botão **Ver na API** alternando preview do site ↔ JSON. Tentativa de 3 colunas fixas foi revertida — não cabia sem espremer a coluna de texto
- Digitação em ritmo humano (~55 WPM com jitter); versões anteriores a 16–38 ms pareciam máquina

**Bugs corrigidos aqui (ver `patterns.md`):**
- `overflow-x-hidden` na raiz travava `window.scrollY` em 0 e a nav fixa nunca ganhava fundo → `overflow-x-clip`
- Scroll horizontal no painel do hero (JSON com `overflow-x-auto`) → conteúdo passou a caber/quebrar
