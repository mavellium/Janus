# Raio-X GEO — Estimativa de Custos por IA

> Baseado nos modelos e preços configurados em `.env.example`. Cada execução roda até **25 perguntas × 3 provedores × 2 modos de busca**.

- **25** perguntas — teto por execução (`MAX_QUESTIONS_PER_RUN`)
- **3** provedores — OpenAI, Gemini, Perplexity
- **2** modos — memória do modelo (`MODEL_MEMORY`) + busca ao vivo (`LIVE_SEARCH`)
- **1h** de cooldown entre execuções por empresa (`RUN_COOLDOWN_MS`)

## Resumo por execução completa

| | |
| :--- | ---: |
| Chamadas de IA | 150 (25 perguntas × 3 IAs × 2 modos) |
| Custo estimado (baixo) | US$ 0,42 (≈ R$ 2,35) |
| Custo estimado (alto) | US$ 0,71 (≈ R$ 3,95, com buscas mais caras na Perplexity) |
| Maior fatia do custo | OpenAI — ~78% do total (gpt-5.5 é 8× mais caro em output) |

## Custo por provedor, por execução (25 perguntas × 2 modos = 50 chamadas)

| Provedor | Modelo | Input / 1M tok. | Output / 1M tok. | Tokens médios / chamada | Custo / chamada | Custo / execução (50 chamadas) |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| OpenAI | `gpt-5.5` | US$ 1,25 | US$ 10,00 | ~200 in / ~500 out | US$ 0,0053 | **US$ 0,265** |
| Gemini | `gemini-2.5-flash` | US$ 0,30 | US$ 2,50 | ~200 in / ~500 out | US$ 0,0013 | **US$ 0,065** |
| Perplexity | `sonar` | ~US$ 1,00* | ~US$ 1,00* | ~200 in / ~500 out | US$ 0,0012 + busca | **US$ 0,085 – 0,38** |

\* A Perplexity não tem preço fixo estimado no código — `costUsdCents` vem do valor real devolvido pela API a cada chamada (`usage.cost.total_cost`). Além do token, o modelo `sonar` cobra US$ 5–12 por 1.000 buscas web, o que domina o custo no modo `LIVE_SEARCH`.

## Cenários de uso

| Cenário | Custo |
| :--- | ---: |
| 1 empresa, 1 execução (teto de 25 perguntas) | US$ 0,55 (≈ R$ 3,10) |
| 1 empresa, mensal (1 execução/mês) | US$ 0,55/mês (≈ R$ 3,10/mês) |
| 10 empresas, mensal (1 execução/mês cada) | US$ 5,50/mês (≈ R$ 31,00/mês) |

## Projeção por volume de carteira

| Carteira | Execuções/mês | Chamadas de IA | Custo/mês |
| :--- | ---: | ---: | ---: |
| 10 empresas (1×/mês cada) | 10 | 1.500 | US$ 5,50 · R$ 31 |
| 50 empresas (1×/mês cada) | 50 | 7.500 | US$ 27,50 · R$ 154 |
| 100 empresas (1×/mês cada) | 100 | 15.000 | US$ 55,00 · R$ 308 |
| 100 empresas (2×/mês, quinzenal) | 200 | 30.000 | US$ 110,00 · R$ 616 |

> Câmbio de referência: US$ 1,00 ≈ R$ 5,60. Ajuste conforme a cotação do dia.

## O gargalo é a OpenAI, não o volume de empresas

Sozinho, o `gpt-5.5` responde por ~78% do custo de cada execução — o output dele custa 4× mais que o da Perplexity e 40× mais que o da Gemini por token. Se o orçamento apertar, a alavanca mais eficaz é rodar a OpenAI só no modo `LIVE_SEARCH` (mais informativo) e usar Gemini para o modo `MODEL_MEMORY`, cortando ~35% do custo por execução sem perder provedor nenhum.

## Guardrails já ativos no código

O teto de 25 perguntas (`MAX_QUESTIONS_PER_RUN`) e o cooldown de 1h entre execuções por empresa (`RUN_COOLDOWN_MS`) já existem em `runRaioX.ts` especificamente para conter esse custo — **não remova sem decisão explícita de produto**.

---

**Fontes**: `GEO_OPENAI_INPUT_COST_CENTS`, `GEO_OPENAI_OUTPUT_COST_CENTS`, `GEO_GEMINI_INPUT_COST_CENTS`, `GEO_GEMINI_OUTPUT_COST_CENTS` (`.env.example`) e preço público do modelo `sonar` da Perplexity. Tokens médios por chamada (~200 entrada / ~500 saída) são uma aproximação — o custo real varia com o tamanho do contexto de negócio preenchido no perfil e o tamanho da resposta de cada IA. Custo real da Perplexity é sempre lido de `usage.cost.total_cost` na resposta da API, não estimado.
