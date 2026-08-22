# Landing — Histórico

**Instrução:** atualize aqui cada vez que mexer na landing.

### [2026-08-22] — Planos deixaram de ser texto: landing lê o catálogo

**Arquivos:**
- `src/app/page.tsx`: o array local `PLANS` foi **removido**; a seção `#precos` agora mapeia
  `PUBLIC_PLANS` de `@/modules/billing/domain/plans` e o "7 dias" vem de `TRIAL_DAYS`

**Razão:** os mesmos preços e limites passaram a governar o produto (cotas por plano). Manter uma
segunda cópia na landing garantiria divergência entre o que é vendido e o que o sistema aplica.

**Impacto:** mudar preço, feature-list ou nome de plano é edição em `domain/plans.ts` — a landing
acompanha sozinha. **Não redeclarar plano aqui.** Ver `.claude/context/billing/`.

### [2026-08-21] — Logo real do cliente + polish dos cards de plano

**Arquivos:**
- `src/app/page.tsx`: `CLIENTS` virou `{ name, logo }[]` com a logo real da Tegbe (SVG hospedado na CDN deles, `next/image` com `unoptimized` — é wordmark branco, por isso vai dentro de um chip `bg-neutral-900` fixo, funciona em ambos os temas); cards de planos ganharam slot de altura fixa (`h-6`) para os selos "Mais popular"/"7 dias grátis" (antes só existiam quando aplicável e desalinhavam o título entre colunas), descrição com `min-h-12` e um divisor (`border-t`) antes do preço — título/preço/lista agora começam na mesma altura nas 4 colunas; `Reveal` recebeu `className="h-full"` pra não quebrar o stretch do grid
- `PLANS`: item "Tudo do X" (herda do plano anterior) movido pra primeiro da lista em Médio/Pro/Enterprise; contagem de sites passou a citar landing pages também ("1 site ou landing page", "Até 3/10 sites ou landing pages", "Sites e landing pages ilimitados") — front tem os dois tipos de projeto (`INSTITUTIONAL`/`LANDING_PAGE`) e o texto antigo só falava de "sites"

**Razão:** pedidos diretos do usuário — logo real em vez de texto, cards mais alinhados, destacar herança do plano anterior primeiro, e cobrir landing page (não só site) nos limites de cada plano.

**Impacto:** só visual/copy. Baixei o SVG pra inspecionar as cores antes de decidir o fundo do chip (`grep fill=` no arquivo) — wordmark é 100% branco, ícone é dourado (#EBAF56/#EEC45B/#F1D95D); sem esse cuidado o logo ficaria invisível num card claro.

### [2026-08-21] — Teste grátis restrito ao plano Inicial

**Arquivos:**
- `src/app/page.tsx`: array `PLANS` ganhou o campo `trial` (só `true` no Inicial); CTA de Médio/Pro trocou de "Começar teste grátis" para "Assinar agora" (só Inicial mantém o CTA de teste); badge "7 dias grátis" agora aparece só no card Inicial (mesmo padrão visual do badge "Mais popular" do Pro, cor `brand-primary` em vez de `brand-cta` pra não competir); pill do cabeçalho da seção corrigida de "em qualquer plano" para "no plano Inicial"

**Razão:** usuário pediu para o teste grátis valer só no primeiro plano — a versão anterior anunciava o trial pros 4 planos, o que não era a intenção.

**Impacto:** nenhum, só copy/condicional de render — sem mudança de schema/billing (ainda não existe cobrança real, é conteúdo estático).

### [2026-08-21] — Seção de Clientes + Seção de Planos

**Arquivos:**
- `src/app/page.tsx`: novo array `CLIENTS` (faixa de confiança logo após o hero, hoje só "Tegbe") e novo array `PLANS` (seção `#precos`, index 08 — Inicial R$97, Médio R$197, Pro R$397 com badge "Mais popular", Enterprise "Consulta"); FAQ recuou para index 09
- `src/components/landing/LandingNav.tsx`, `LandingFooter.tsx`: link "Planos" → `#precos`

**Razão:** pedido do usuário para lançar a página de vendas com prova social e tabela de preços, mantendo o contexto "empresa" (o contexto "desenvolvedor" fica para depois).

**Decisões:**
- Preço e feature-list de cada plano são placeholder de negócio, não dado real validado — combinado explicitamente com o usuário, que pediu ajuda para definir os valores considerando o custo variável do Raio-X (`src/modules/geo/`, chama API paga por execução) e a margem. Mantém a regra "zero prova social inventada" firmada em 2026-08-16: `CLIENTS` só tem "Tegbe" porque foi o único nome que o usuário confirmou — não inventar mais empresas
- CTA "Falar com vendas" do plano Enterprise aponta para `/login` (não existe rota/e-mail de contato comercial ainda — pendência)
- Cards de plano reusam `lp-card`/`lp-tint-cta`/`lp-border-cta` já existentes em `globals.css`, sem CSS novo

**Impacto:** nenhuma mudança de schema ou billing — é só conteúdo estático da home pública. Não existe model `Plan`/`Subscription` no Prisma; se um fluxo de cobrança real for implementado depois, os 4 planos aqui viram a fonte de verdade do texto, não da lógica.

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
