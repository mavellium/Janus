# Billing — Domínio

## Schema Prisma

```prisma
enum PlanTier { TRIAL INICIAL MEDIO PRO ENTERPRISE }
enum SubscriptionStatus { TRIALING ACTIVE PAST_DUE CANCELED EXPIRED }

model Subscription {
  companyId        String   @unique   // 1:1 com Company, onDelete: Cascade
  tier             PlanTier           @default(TRIAL)
  status           SubscriptionStatus @default(TRIALING)
  trialEndsAt      DateTime?
  currentPeriodEnd DateTime?
  discountPercent  Int?
  discountEndsAt   DateTime?
  limitOverrides   Json     @default("{}")  // Partial<PlanLimits>
  notes            String?
}
```

`GeoTargetProfile.companyId` (nullable) liga um perfil do Raio-X a uma empresa — é o que faz a
execução descontar da cota mensal do plano. Perfil sem empresa = análise interna, sem cota.

## Catálogo (`domain/plans.ts`)

| Plano      | Preço  | Sites | Usuários | SEO/dia | Scan/dia | Raio-X/mês | Histórico | Agendar | Pixels |
|------------|--------|-------|----------|---------|----------|------------|-----------|---------|--------|
| TRIAL      | —      | 1     | 3        | 20      | 10       | 0          | 7d        | não     | não    |
| INICIAL    | R$97   | 1     | 3        | 20      | 10       | 0          | 7d        | não     | não    |
| MEDIO      | R$197  | 3     | 10       | 40      | 20       | 1          | 60d       | sim     | não    |
| PRO        | R$397  | 10    | ∞        | 100     | 50       | 4          | 60d       | sim     | sim    |
| ENTERPRISE | Consulta | ∞   | ∞        | ∞       | ∞        | ∞          | 60d       | sim     | sim    |

`TRIAL` reusa exatamente `INICIAL_LIMITS` — o teste grátis é do plano Inicial, não um plano à parte.

**`null` = ilimitado** em todo limite numérico. Use `isUnlimited()` / `formatLimitValue()`, nunca
compare com `-1` ou `Infinity`.

## Regras Absolutas

1. **Preço e limite vivem só em `domain/plans.ts`.** A landing (`src/app/page.tsx`) importa
   `PUBLIC_PLANS`; nenhum outro lugar redeclara valor de plano.
2. **Trial vencido é calculado, não gravado.** `resolveEffectiveStatus()` compara `trialEndsAt`
   com o relógio a cada leitura — não existe job de expiração e não pode existir estado velho
   liberando acesso indevido.
3. **Excedente nunca é destruído.** Empresa que cai para um plano menor mantém tudo que já existe;
   só a *criação* de novos itens é bloqueada (`lockLimits()` zera cotas de criação, não apaga dado).
4. **Override manual vence o plano** (`{ ...planLimits, ...overrides }`). É o mecanismo de exceção
   comercial do admin — aumentar **ou** reduzir qualquer limite de uma empresa específica.
5. **ADMIN não é barrado por cota.** `adminCreateUser` e afins não chamam o guard de propósito: o
   admin é a válvula de escape manual. O guard fica nos fluxos de cliente e de DEVELOPER.
6. **Empresa sempre nasce com assinatura.** As 3 actions de criação de empresa usam
   `subscription: { create: initialSubscriptionData() }`. O fallback em `getCompanySubscription`
   (piso INICIAL + `console.warn`) é rede de segurança, não caminho normal.

## Estados

| Status efetivo | Origem                                   | Efeito |
|----------------|------------------------------------------|--------|
| TRIALING       | `trialEndsAt` no futuro                  | limites do Inicial |
| ACTIVE         | assinatura paga                          | limites do tier |
| PAST_DUE       | cobrança atrasada                        | limites do tier (não trava) |
| EXPIRED        | trial vencido **ou** gravado como tal    | cotas de criação zeradas |
| CANCELED       | cancelamento                             | cotas de criação zeradas |

## Desconto pós-teste

`POST_TRIAL_DISCOUNT_PERCENT = 20` por `POST_TRIAL_DISCOUNT_MONTHS = 3`.
`adminConvertTrial()` encerra o trial, move para INICIAL/ACTIVE e grava o desconto com validade.
`discountActive` só é `true` enquanto `discountEndsAt` não passou.

**Não há cobrança real** — não existe gateway integrado. `discountPercent` e `currentPeriodEnd`
são registro comercial para o admin, consumidos pela UI, não por um processador de pagamento.

## Migração

`20260821120000_billing_plans_and_geo_company` cria as tabelas e faz backfill: **toda empresa que
já existia entra como ENTERPRISE/ACTIVE** (grandfathered). Elas foram vendidas sem limite
contratado; rebaixar automaticamente bloquearia uso legítimo. O admin define o plano real de cada
uma em `/dashboard-admin/companies` (ação "Plano e cobrança" na linha da empresa).
