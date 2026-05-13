name: ui-design
description: >
  Traduz especificações de design (Figma, Screenshots ou Style Guides) para código React 19/Tailwind 4.
  Focado em fidelidade visual, espaçamento rigoroso e acessibilidade.

instructions: >
  ## DIRETRIZ DE CORES E DARK MODE (PRIORIDADE MÁXIMA)
  É TERMINANTEMENTE PROIBIDO o uso de cores hexadecimais arbitrárias (ex: `bg-[#FFF]`, `style={{ color: '#161718' }}`) ou cores literais do Tailwind (ex: `bg-white`, `bg-gray-100`, `text-black`, `bg-slate-900`, `text-blue-500`) na construção de interfaces.
  Você DEVE usar exclusivamente as variáveis semânticas configuradas no projeto:

  - **Fundo da página:** `bg-brand-bg`
  - **Texto principal:** `text-brand-text`
  - **Texto secundário/ícones:** `text-brand-muted`
  - **Cor de marca/destaque:** `bg-brand-primary`, `text-brand-primary`, `hover:bg-brand-hover`
  - **Botões CTA (call-to-action primário):** `bg-brand-cta text-white hover:bg-brand-cta-hover` — cor #E35336. Use para o botão de ação principal de cada tela (submit, criar, salvar). O componente `<Button>` (variant default) já aplica isso automaticamente.
  - **Botões dark/light:** `bg-brand-btn-dark`, `bg-brand-btn-light`
  - **Cards/painéis elevados:** `bg-card` (mapeia para `--sidebar-bg`)
  - **Bordas/divisores:** `border-brand-btn-light`, `divide-brand-btn-light`
  - **Sidebar:** `bg-sidebar-bg`, `text-sidebar-icon`, `bg-sidebar-hover-bg`, `text-sidebar-hover-text`
  - **Estados destrutivos (excluir/erro):** `bg-destructive`, `text-destructive`, `bg-destructive/10`, `border-destructive/30`

  Todo componente DEVE ser testado mentalmente para garantir que não se tornará invisível ou ilegível quando a classe `.dark` for ativada no `<html>`. Se precisar de transparência sobre cor de marca, use modificadores como `/40`, `/10`, `/20`.

  ## Regras de Tradução de Design
  1. **Tokens de Design:** SEMPRE utilize variáveis semânticas (`brand-*`, `sidebar-*`, `card`, `destructive`, etc.). Se o design pedir uma cor não mapeada, primeiro adicione-a a `globals.css` com versão light E dark, depois mapeie em `tailwind.config.ts`. NUNCA inline hex.
  2. **Componentização:** Se um elemento se repete no Figma, ele DEVE virar um componente em `src/components/`.
  3. **Responsividade (OBRIGATÓRIA):** Mobile-first sempre. Toda interface DEVE ser usável em mobile (<640px), tablet (640–1024px) e desktop (>1024px). Use os breakpoints `sm:` (640), `md:` (768), `lg:` (1024) e `xl:` (1280). Aplique as regras da seção "Padrões de Responsividade" abaixo.
  4. **Imagens/Ícones:** Use `lucide-react` para ícones. Para imagens, use o componente `Next/Image` com as dimensões exatas do Figma.
  5. **Dark Mode obrigatório:** Toda interface deve ser pensada e testada nos dois temas. Nunca use `bg-white`, `bg-black`, `text-gray-X`, `bg-gray-X` — eles quebram o tema escuro.

  ## Como interpretar inputs do Figma
  - **Espaçamento:** Converta pixels para `rem` ou utilize as escalas do Tailwind (ex: 16px = `p-4`).
  - **Tipografia:** Mapeie os estilos de texto do Figma (H1, Body, Caption) para componentes de texto consistentes ou classes globais.
  - **Cores do Figma:** Compare a cor do design com a paleta semântica e use o token mais próximo. Se for cor de destaque única, adicione ao `globals.css` em ambos `:root` e `.dark`.
  - **Estado:** Pergunte ou implemente estados de `hover`, `focus`, `active` e `disabled` mesmo que não estejam explícitos no design.

  ## Padrões de Responsividade (TODOS os componentes)
  - **Sidebars fixas:** Ocultar abaixo de `md` (`hidden md:flex`). Em mobile, expor via drawer `MobileNav` (`src/components/dashboard/MobileNav.tsx`) que envolve a sidebar com prop `embedded`.
  - **Topbar mobile:** Topbar `flex md:hidden` com altura `h-14`, contendo logo + botão hambúrguer (`min-h-10 min-w-10`).
  - **`<main>`:** `pt-14 md:pt-0 md:ml-[var(--sidebar-width,220px)] overflow-x-hidden`.
  - **Headers internos:** Sempre `flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4`.
  - **Padding de páginas:** `p-4 sm:p-6 lg:p-8` (nunca `p-8` puro).
  - **Grids progressivos:** Cards/listagens — `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6`. Métricas — `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
  - **Modais (`DialogContent` ou custom):** `w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-4 sm:p-6` (o `DialogContent` base já aplica). Para modais custom (`fixed inset-0`), use o mesmo conjunto.
  - **Data tables:** SEMPRE envolver `<table>` em `<div className="w-full overflow-x-auto">` + `<table className="w-full min-w-[600px]">` (ou `720px`/`920px` conforme nº de colunas).
  - **Split-panes (Construir/Editar):** `flex flex-col lg:flex-row`. Painéis laterais: `w-full lg:w-72 / lg:w-1/3 / lg:w-[360px]` com `border-b lg:border-b-0 lg:border-r/l`. Áreas centrais com `min-h-[400px] lg:min-h-0`.
  - **Touch targets:** Botões interativos `h-10` ou `p-2` mínimo. Ícone-só usar `w-10 h-10` com `inline-flex items-center justify-center`.
  - **Texto responsivo:** Títulos `text-xl sm:text-2xl`. Subtítulos `text-sm sm:text-base`.
  - **Tipografia em tabela:** Aplicar `whitespace-nowrap` em células que não devem quebrar (datas, slugs, IDs).

  ## Checklist antes de finalizar componente
  - [ ] Nenhum `style={{ color/backgroundColor: '#...' }}` inline?
  - [ ] Nenhuma classe `bg-white`, `bg-black`, `bg-gray-*`, `text-gray-*`, `text-black`, `bg-slate-*`?
  - [ ] Nenhuma classe `bg-[#...]` ou `text-[#...]`?
  - [ ] Componente legível em light mode E dark mode?
  - [ ] Bordas e divisores usam `border-brand-btn-light`?
  - [ ] Cards/modais usam `bg-card` e não `bg-white`?
  - [ ] Botão CTA principal usa `<Button>` (variant default) ou `bg-brand-cta hover:bg-brand-cta-hover text-white`?
  - [ ] Layout testado em 360px / 768px / 1280px (mobile / tablet / desktop)?
  - [ ] Sidebar oculta em `<md` e exposta via `MobileNav` drawer?
  - [ ] Grids progressivos com `sm:`, `lg:`, `xl:` (nunca `grid-cols-3` ou `grid-cols-4` puros)?
  - [ ] Modais com `w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto`?
  - [ ] Tabelas envolvidas em `overflow-x-auto` e com `min-w-[Npx]`?
  - [ ] Split-pane usa `flex-col lg:flex-row`?
  - [ ] Botões interativos com touch target ≥ 40px?

  **Ação Final OBRIGATÓRIA:** Após criar a interface, invoque a skill `registry` para documentar os novos componentes de UI no `PROJECT.md`.