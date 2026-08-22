# Billing — Histórico

**Instrução:** atualize aqui cada vez que mexer em planos, limites ou enforcement.

### [2026-08-22] — Selects nativos trocados por Radix + campo de data próprio

**Arquivos:**
- `src/components/ui/form-select.tsx` (novo) — `Select` do Radix embrulhado para formulário
  (altura `h-9` igual aos `Input`, largura total, submissão por `name`)
- `src/components/ui/date-field.tsx` (novo) — `input[type=date]` com ícone de calendário próprio,
  botão de limpar e indicador nativo escondido
- `CompanyPlanModal.tsx`, `CompanyLimitsModal.tsx`, `AdminGeoClient.tsx`: passaram a usar os dois

**Razão:** o `<select>` nativo tem o dropdown desenhado pelo sistema operacional — no tema dark as
opções ficavam cinza sobre cinza, praticamente ilegíveis. O indicador de data do WebKit é uma
imagem escura fixa, invisível no fundo escuro.

**Detalhes que importam:**
- Radix `Select` só submete em formulário: ele renderiza um `<select>` nativo oculto quando o
  trigger tem um `<form>` ancestral (`isFormControl`). Ambos os modais têm — verificado no bundle
- **Radix proíbe `value=""`** em `SelectItem` (string vazia é reservada para limpar). O "sem
  empresa" do Raio-X virou o sentinela `'none'`, traduzido para `null` em `companyIdSchema`
- `showPicker()` abre o calendário nativo pelo ícone, com `focus()` como fallback
- O botão de limpar existe porque as datas são opcionais (fim de teste, fim de desconto) e limpar
  um `input[type=date]` no teclado é pouco óbvio

### [2026-08-22] — Planos fundidos na tela de Empresas (tela separada removida)

**Arquivos:**
- **Removidos:** `src/app/dashboard-admin/plans/**` e `queries/getAdminSubscriptions.ts` (órfã),
  item "Planos" da `AdminSidebar`
- `src/modules/admin/queries/getAdminCompanies.ts`: passou a devolver `subscription` resolvida +
  `usage` por empresa, com tipo explícito `AdminCompanyRow`
- `src/components/billing/{planDisplay.ts,CompanyPlanModal.tsx,CompanyLimitsModal.tsx}` (novos):
  modais extraídos para não inchar o `AdminCompaniesClient`
- `src/app/dashboard-admin/companies/AdminCompaniesClient.tsx`: coluna Plano (fixa) + colunas
  opcionais Raio-X/Teste/Desconto/Ajustes, filtros de plano/situação/ajustes e 4 ações de plano

**Razão:** duas telas para a mesma entidade. Plano é atributo de empresa — separar obrigava o
admin a pular de tela para responder "quanto essa empresa usa e o que ela pode".

**Correções de UI no mesmo passe** (a tela anterior fugia do padrão admin estabelecido):
- Faltava o wrapper `p-8` + header `mb-6` que todas as telas admin usam
- Usava tokens shadcn (`text-muted-foreground`, `bg-card`) em vez dos `brand-*` do projeto
- Ações de linha eram `<Button variant="ghost">` em vez do `<button className="p-1.5 rounded...">`
  com ícone `w-3.5` usado em Usuários/Empresas
- Filtros sem a opção `{ value: '', label: 'Todos' }` — não dava para limpar o filtro
- **"4/Ilimitado" era confuso**: `QuotaValue` agora mostra `4/10` quando há teto e só `4` quando
  não há, com vermelho ao estourar e o limite no `title`
- Colunas "Usuários"/"Projetos" já existiam com contagem crua; viraram uso/limite em vez de
  ganharem uma coluna "Uso" duplicada ao lado
- Coluna "Teste / desconto" vinha vazia em toda linha; virou duas colunas opcionais com `—`

### [2026-08-22] — Criação do módulo: planos aplicados no sistema inteiro

**Arquivos:**
- `prisma/schema.prisma` + `migrations/20260821120000_billing_plans_and_geo_company`: enums
  `PlanTier`/`SubscriptionStatus`, model `Subscription` (1:1 Company), `GeoTargetProfile.companyId`,
  backfill de empresas existentes como ENTERPRISE
- `src/modules/billing/**`: catálogo, resolução de limites, guards, queries, action admin, 11 testes
- Enforcement em 8 actions (ver `enforcement.md`)
- `src/app/dashboard-admin/plans/**` + item "Planos" na `AdminSidebar`
- `src/components/billing/PlanUsageCard.tsx` no dashboard da empresa
- `src/app/page.tsx`: landing passou a importar `PUBLIC_PLANS` — preço deixou de ser duplicado

**Razão:** os 4 planos existiam só como texto na landing. O pedido foi torná-los reais: limitar o
produto por plano e dar ao admin controle manual sobre cada empresa.

**Decisões tomadas com o usuário:**
- Raio-X ganhou vínculo com empresa (`GeoTargetProfile.companyId`) para a cota mensal ser aplicável
- Excedente de plano **não é destruído**: bloqueia criação, mantém o que existe
- Desconto pós-teste: 20% por 3 meses (`adminConvertTrial` aplica de uma vez)
- Todos os limites aplicados, com override manual do admin para aumentar ou reduzir

**Decisões técnicas próprias:**
- Empresas pré-existentes entraram como ENTERPRISE (grandfathered) — rebaixar automaticamente
  quebraria cliente em produção
- Trial vencido é computado na leitura, não gravado por job (evita estado velho liberando acesso)
- ADMIN não é barrado por cota — é a válvula de escape manual pedida no item 3
- Limite de site scan virou por empresa (era por projeto): cota de plano é comercial, logo da conta

**Bug corrigido no caminho:** o wizard do Raio-X salva contexto chamando `updateGeoTargetProfile`
sem o campo `companyId`; como o schema transforma `undefined → null`, isso desvincularia a empresa
silenciosamente a cada execução. Resolvido com `formData.has('companyId')`.

**Pendências conhecidas:**
- Sem gateway de pagamento: `discountPercent`/`currentPeriodEnd` são registro comercial, nada cobra
- `historyDays` está no catálogo mas ainda não corta a query de auditoria
- Sem fluxo self-service de upgrade — o cliente vê o limite, mas quem troca o plano é o admin
- `POST_TRIAL_DISCOUNT` não é aplicado automaticamente quando o trial vence: depende do admin
  clicar em "converter teste" no painel
