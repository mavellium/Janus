# Landing — Dados e Domínio

## Conteúdo (arrays em `src/app/page.tsx`)

- `FACTS` — 4 números verificáveis do produto (14 checks SEO, 3 IAs, 20 páginas/varredura, 60 dias de histórico)
- `PAINS` / `GAINS` — 4 linhas cada, contraste "sem painel" × "com o Janus"
- `CMS_CARDS` — 4 cards em bento (`span: boolean` controla `lg:col-span-2`)
- `OPERATIONS` — 8 recursos com ícone lucide
- `FLOW` — 3 passos numerados

**Invariante:** todo número na página tem origem no código real (`seoScoring` = 14 checks, `analyzeSite` = teto 20 páginas, `pruneAuditLogs` = 60 dias, 3 adapters GEO). **Proibido inventar prova social** (contagem de clientes, depoimentos, logos).

## Estado da animação (`HeroPipeline.tsx`)

```ts
type StepId = 'titulo' | 'cor' | 'foto' | 'botao'
type Phase  = 'running' | 'settled'
type View   = 'site' | 'api'

interface Committed { titulo: string; cor: number | null; foto: boolean; botao: string }
```

- `STEPS[]` — 4 passos com `kind: 'text' | 'color' | 'image'` e `ms` (latência falsa exibida: 9–14 ms)
- Máquina: `running` (digita / percorre amostras / sobe upload) → commit → `settled` → próximo passo; ao fim do 4º, reseta `committed` e reinicia
- Pausa fora da viewport (`inView`) e mostra o estado final (`FILLED`) com `prefers-reduced-motion`
- `view` é do usuário (botão **Ver na API**), independente da máquina — os dois modos leem o mesmo `Committed`

### Tempos (ritmo humano, ~14 s por ciclo)

| Constante | Valor | Papel |
| :-------- | :---- | :---- |
| `TYPE_MS` | 95 ms | base por caractere (~55 WPM) |
| `typeDelay()` | +`(i*37)%5*18` e +90 ms após espaço | jitter determinístico — é o que faz parecer humano |
| `SWATCH_MS` | 420 ms | troca de amostra de cor |
| `UPLOAD_MS` | 130 ms | tique da barra (12 tiques) |
| `HOLD_MS` / `SETTLED_MS` / `LOOP_MS` | 550 / 700 / 2200 ms | pausas |

## Tokens visuais (`globals.css`, bloco `lp-*`)

- **Tipografia:** `.lp-display` (Geist Sans) e `.lp-mono` (Geist Mono) — as vars já vêm do `RootLayout`; o app continua em `system-ui`
- **Translucidez:** `.lp-tint-cta|primary|track|surface`, `.lp-border-cta|primary`, `.lp-glow-cta|primary`, `.lp-nav-blur` — todos via `color-mix`
- **Keyframes:** `lpFadeUp`, `lpCaret`, `lpDrift`, `lpPing`, `lpSweep`, `lpPop`
- **Scroll:** `scroll-behavior: smooth` escopado por `:root:has(.lp-landing)` — não vaza para o dashboard
- **Reduced motion:** bloco final neutraliza tudo, inclusive `[data-lp-reveal]`
