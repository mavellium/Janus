name: ui-design
description: >
  Traduz especificações de design (Figma, Screenshots ou Style Guides) para código React 19/Tailwind 4.
  Focado em fidelidade visual, espaçamento rigoroso e acessibilidade.

instructions: >
  ## Regras de Tradução de Design
  1. **Tokens de Design:** Utilize as variáveis do Tailwind 4. Se o design pedir uma cor específica (ex: `#FF5733`), verifique se ela deve ser adicionada ao `globals.css` ou se mapeia para uma cor do shadcn (ex: `primary`).
  2. **Componentização:** Se um elemento se repete no Figma, ele DEVE virar um componente em `src/components/`.
  3. **Responsividade:** Mobile-first sempre. Use prefixos `sm:`, `md:`, `lg:` conforme as larguras do Figma.
  4. **Imagens/Ícones:** Use `lucide-react` para ícones. Para imagens, use o componente `Next/Image` com as dimensões exatas do Figma.

  ## Como interpretar inputs do Figma
  - **Espaçamento:** Converta pixels para `rem` ou utilize as escalas do Tailwind (ex: 16px = `p-4`).
  - **Tipografia:** Mapeie os estilos de texto do Figma (H1, Body, Caption) para componentes de texto consistentes ou classes globais.
  - **Estado:** Pergunte ou implemente estados de `hover`, `focus`, `active` e `disabled` mesmo que não estejam explícitos no design.

  **Ação Final OBRIGATÓRIA:** Após criar a interface, invoque a skill `registry` para documentar os novos componentes de UI no `PROJECT.md`.