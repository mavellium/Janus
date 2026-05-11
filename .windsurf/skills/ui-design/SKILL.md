---
name: ui-design
description: >
  Traduz especificações de design (Figma, Screenshots ou Style Guides) para código React 19/Tailwind 4.
  Focado em fidelidade visual, espaçamento rigoroso e acessibilidade.
---

instructions: >
  ## DIRETRIZ DE CORES E DARK MODE (PRIORIDADE MÁXIMA)
  É TERMINANTEMENTE PROIBIDO o uso de cores hexadecimais arbitrárias (ex: `bg-[#FFF]`, `style={{ color: '#161718' }}`) ou cores literais do Tailwind (ex: `bg-white`, `bg-gray-100`, `text-black`, `bg-slate-900`, `text-blue-500`) na construção de interfaces.
  Você DEVE usar exclusivamente as variáveis semânticas configuradas no projeto:

  - **Fundo da página:** `bg-brand-bg`
  - **Texto principal:** `text-brand-text`
  - **Texto secundário/ícones:** `text-brand-muted`
  - **Cor de marca/destaque:** `bg-brand-primary`, `text-brand-primary`, `hover:bg-brand-hover`
  - **Botões dark/light:** `bg-brand-btn-dark`, `bg-brand-btn-light`
  - **Cards/painéis elevados:** `bg-card` (mapeia para `--sidebar-bg`)
  - **Bordas/divisores:** `border-brand-btn-light`, `divide-brand-btn-light`
  - **Sidebar:** `bg-sidebar-bg`, `text-sidebar-icon`, `bg-sidebar-hover-bg`, `text-sidebar-hover-text`
  - **Estados destrutivos (excluir/erro):** `bg-destructive`, `text-destructive`, `bg-destructive/10`, `border-destructive/30`

  Todo componente DEVE ser testado mentalmente para garantir que não se tornará invisível ou ilegível quando a classe `.dark` for ativada no `<html>`. Se precisar de transparência sobre cor de marca, use modificadores como `/40`, `/10`, `/20`.

  ## Regras de Tradução de Design
  1. **Tokens de Design:** SEMPRE utilize variáveis semânticas (`brand-*`, `sidebar-*`, `card`, `destructive`, etc.). Se o design pedir uma cor não mapeada, primeiro adicione-a a `globals.css` com versão light E dark, depois mapeie em `tailwind.config.ts`. NUNCA inline hex.
  2. **Componentização:** Se um elemento se repete no Figma, ele DEVE virar um componente em `src/components/`.
  3. **Responsividade:** Mobile-first sempre. Use prefixos `sm:`, `md:`, `lg:` conforme as larguras do Figma.
  4. **Imagens/Ícones:** Use `lucide-react` para ícones. Para imagens, use o componente `Next/Image` com as dimensões exatas do Figma.
  5. **Dark Mode obrigatório:** Toda interface deve ser pensada e testada nos dois temas. Nunca use `bg-white`, `bg-black`, `text-gray-X`, `bg-gray-X` — eles quebram o tema escuro.

  ## Como interpretar inputs do Figma
  - **Espaçamento:** Converta pixels para `rem` ou utilize as escalas do Tailwind (ex: 16px = `p-4`).
  - **Tipografia:** Mapeie os estilos de texto do Figma (H1, Body, Caption) para componentes de texto consistentes ou classes globais.
  - **Cores do Figma:** Compare a cor do design com a paleta semântica e use o token mais próximo. Se for cor de destaque única, adicione ao `globals.css` em ambos `:root` e `.dark`.
  - **Estado:** Pergunte ou implemente estados de `hover`, `focus`, `active` e `disabled` mesmo que não estejam explícitos no design.

  ## Checklist antes de finalizar componente
  - [ ] Nenhum `style={{ color/backgroundColor: '#...' }}` inline?
  - [ ] Nenhuma classe `bg-white`, `bg-black`, `bg-gray-*`, `text-gray-*`, `text-black`, `bg-slate-*`?
  - [ ] Nenhuma classe `bg-[#...]` ou `text-[#...]`?
  - [ ] Componente legível em light mode E dark mode?
  - [ ] Bordas e divisores usam `border-brand-btn-light`?
  - [ ] Cards/modais usam `bg-card` e não `bg-white`?

  **Ação Final OBRIGATÓRIA:** Após criar a interface, invoque a skill `registry` para documentar os novos componentes de UI no `PROJECT.md`.