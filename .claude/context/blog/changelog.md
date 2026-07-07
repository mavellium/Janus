# Blog — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

---

### [2026-07-06] — Fix: banner de API não some durante impersonação de usuário comum

**Arquivos:**
- `src/lib/auth/permissions.ts`: novos helpers `getEffectiveRole()` (resolve o role do usuário impersonado via cookie; senão o real) e `isEffectivePrivilegedRole()`
- 6 páginas de blog (posts/tags/categories × sites/LP) + 2 edit pages: `isDeveloperOrAdmin` agora usa `await isEffectivePrivilegedRole(session.user.role)` em vez de `isPrivilegedRole(session.user.role)`

**Razão:** ADMIN/DEVELOPER impersonando um usuário comum continuava vendo o `ApiEndpointBanner` (conteúdo dev-only), pois a checagem usava o role real da sessão e ignorava o cookie de impersonação.

**Impacto:** Durante impersonação, a visibilidade do banner segue o role do usuário impersonado (some para usuário comum; permanece se o alvo for DEVELOPER). Sem impersonação, comportamento inalterado — banner segue visível para ADMIN/DEVELOPER independente de viewMode.

---

### [2026-06-27] — Editor Fase 5 (final): biblioteca de mídia + comentários editoriais

**Arquivos:**
- `prisma/schema.prisma` + `migrations/20260627020000_add_media_and_comments`: models `MediaAsset` (url/type/fileName/projectId) e `BlogComment` (body/authorName/resolved)
- `src/modules/blog/queries/getProjectMedia.ts`, `getBlogComments.ts` (novos)
- `src/modules/blog/actions/uploadBlogMedia.ts` (upload BunnyCDN + registra MediaAsset por projeto), `listProjectMedia.ts`, `createBlogComment.ts`, `toggleResolveBlogComment.ts`, `deleteBlogComment.ts` (novos)
- `src/components/blog/MediaLibrarySheet.tsx`, `BlogCommentsSheet.tsx` (novos)
- `src/components/blog/RichEditor.tsx`: prop `projectId`; uploads (botão/colar/arrastar) passam por `uploadBlogMedia`; botão Biblioteca abre a galeria e insere
- `src/components/blog/PostEditorClient.tsx`: passa `projectId` ao editor; botão Comentários no header (badge de abertos)
- 2 edit pages: buscam `getBlogComments` e passam `comments`

**Razão:** Fase 5 (final) do plano — galeria reutilizável por projeto e fluxo editorial de comentários (resolver/excluir).

**Impacto:** Toda imagem enviada no editor passa a ser registrada como `MediaAsset` (escopo por `projectId`) e fica reutilizável. Comentários com router.refresh após mutações. Migration aplicada via `migrate deploy`. No teste de render, `uploadBlogMedia`/`listProjectMedia` são mockados (puxavam next-auth).

---

### [2026-06-27] — Editor Fase 4: histórico de versões, autosave, preview e checklist SEO

**Arquivos:**
- `prisma/schema.prisma` + `migrations/20260627010000_add_blog_post_versions`: model `BlogPostVersion` (snapshot de title/subtitle/body/cover/seo/readingTime + createdBy)
- `src/modules/blog/actions/updateBlogPost.ts`: ao salvar manualmente, snapshota o estado ANTERIOR como versão (só se body/title mudaram) + poda p/ últimas 30
- `src/modules/blog/actions/restoreBlogPostVersion.ts` (novo): snapshota o estado atual (reversível) e restaura a versão
- `src/modules/blog/queries/getBlogPostVersions.ts` (novo): lista versões
- `src/modules/blog/actions/autosaveBlogPost.ts` (novo): salva conteúdo silenciosamente (sem versão, sem revalidate)
- `src/lib/seo-checklist.ts` (novo) + `.spec.ts`: `analyzeSeo`/`seoScore` (título, meta, 300+ palavras, H2, alt de imagens, keyword)
- `src/components/blog/BlogVersionsSheet.tsx`, `BlogPreviewSheet.tsx`, `BlogSeoChecklist.tsx` (novos)
- `src/components/blog/PostEditorClient.tsx`: campos title/subtitle/seo* controlados; botões Visualizar + Histórico; indicador de autosave; checklist SEO na sidebar; effect de autosave (debounce 2.5s, só posts existentes)
- 2 páginas de edição (sites + LP): buscam `getBlogPostVersions` e passam `versions`

**Razão:** Fase 4 do plano — fluxo editorial (versões/restaurar, rascunho automático, preview, SEO ao vivo).

**Impacto:** Migration aplicada via `migrate deploy` (migrate dev falha no shadow DB por histórico antigo de `guest_posts` — problema pré-existente). Body restaurado já vem sanitizado da gravação original. Autosave não cria versões nem revalida sites.

---

### [2026-06-27] — Editor Fase 3: UX avançada (slash, bubble/floating menu, drag, TOC, imagem, paste/drop)

**Arquivos:**
- `src/components/blog/extensions/SlashCommand.tsx` (novo): menu de blocos via `/` (@tiptap/suggestion + ReactRenderer; navegação por teclado, filtro por query)
- `src/components/blog/ResizableImage.tsx`: + alinhamento (left/center/right), edição de `alt` e `caption`; output como `<figure data-align><img><figcaption>`; toolbar flutuante ao selecionar
- `src/components/blog/RichEditor.tsx`: BubbleMenu (toolbar na seleção), FloatingMenu (linha vazia), DragHandle (reordenar blocos), Sumário/TOC (lista de headings navegável), upload de imagem por **colar e arrastar-soltar** (`handlePaste`/`handleDrop` → BunnyCDN)
- `src/lib/sanitize-html.ts`: + `figure[data-align][class]` no allowlist
- deps: `@tiptap/suggestion`, `@tiptap/extension-drag-handle-react`

**Razão:** Usabilidade estilo Notion/WordPress (Fase 3 do plano "implementar tudo").

**Impacto:** Atalhos Markdown já vinham ativos no StarterKit. Slash menu insere qualquer bloco. Imagem ganha alinhamento/legenda/alt (SEO+a11y) preservados no output. Testes: render monta todas as extensões; sanitizer preserva figure/caption.

---

### [2026-06-27] — Editor Fase 2: blocos (código, tabela, checklist, YouTube, callout, divisor)

**Arquivos:**
- `src/components/blog/RichEditor.tsx`: + CodeBlockLowlight (lowlight), TableKit (resizable + controles contextuais), TaskList/TaskItem (checklist), Youtube (popover de URL), Callout, divisor (HorizontalRule); StarterKit com `codeBlock: false` (substituído pelo lowlight); CSS dos novos blocos
- `src/components/blog/extensions/Callout.ts` (novo): node custom `callout` (variant info/warning) + comando `toggleCallout` (wrapIn/lift) com augmentation tipada
- `src/lib/sanitize-html.ts`: allowlist estendida p/ preservar os blocos no output público — `data-callout`/`data-variant`, `data-youtube-video`, classes `hljs-*`/`language-*`, `colgroup/col`; iframe restrito a YouTube/Vimeo
- deps: alinhei TODO o TipTap em 3.27.1 (havia skew 3.23 vs 3.27 → risco de dois `@tiptap/core`); add `@tiptap/extension-table`, `@tiptap/extension-code-block-lowlight`, `@tiptap/extension-youtube`, `@tiptap/extension-list`, `@tiptap/core`, `lowlight`

**Razão:** Enriquecer o editor com blocos de conteúdo (Word/WordPress) mantendo a saída HTML segura.

**Impacto:** `toggleCodeBlock`, `insertTable` (+ add/remover linha/coluna), `toggleTaskList`, `setYoutubeVideo`, `toggleCallout`, `setHorizontalRule`. Testes: render do editor monta todas as extensões; sanitizer preserva os blocos e bloqueia iframe de host não-permitido.

---

### [2026-06-27] — Editor Fase 1: sanitização (XSS), tempo de leitura e contador de palavras

**Arquivos:**
- `src/lib/sanitize-html.ts` (novo) + `.spec.ts`: allowlist com `sanitize-html` (tags/atributos/estilos do editor: text-align, color, background-color, width); links externos recebem `target=_blank rel="noopener noreferrer nofollow"`; remove `<script>`, handlers `on*`, `javascript:` e tags desconhecidas
- `src/lib/reading-time.ts` (novo) + `.spec.ts`: `countWords`, `readingMinutes` (200 wpm, mín. 1), `readingTimeFromHtml`
- `src/modules/blog/actions/createBlogPost.ts`, `updateBlogPost.ts`: sanitiza `body` no servidor (autoritativo) antes de salvar e calcula `readingTime` a partir do HTML limpo
- `src/components/blog/RichEditor.tsx`: rodapé com contagem de palavras + tempo de leitura ao vivo
- deps: `sanitize-html` + `@types/sanitize-html`

**Razão:** `body` era salvo cru (HTML servido publicamente pela API → risco de XSS) e `readingTime` nunca era preenchido apesar de existir no schema.

**Impacto:** Conteúdo é higienizado no write (protege o output público). `BlogPost.readingTime` agora é autoritativo (servidor). Allowlist já cobre tabela/iframe(YouTube/Vimeo) para as próximas fases. Posts antigos só são re-higienizados ao serem re-salvos.

---

### [2026-06-27] — FIX: corpo do artigo não renderizava (RichEditor retornava null)

**Arquivos:**
- `src/components/blog/RichEditor.tsx`: removido o gate `if (!editor || !state) return null`
- `src/components/blog/RichEditor.spec.tsx`: NOVO — teste de regressão (monta o editor e garante que toolbar + `.ProseMirror` aparecem)

**Razão:** `useEditor` (TipTap React v3) não re-renderiza por transação por padrão (`shouldRerenderOnTransaction` default false), e o `useEditorState` separado inicia com `editor: null` e só atualiza o snapshot quando há transação. Num editor recém-montado e vazio não há transação → `state` ficava `null` para sempre → o componente retornava `null` e nada aparecia abaixo de "Corpo do Artigo".

**Impacto:** Agora o gate é só `if (!editor) return null`; a UI da toolbar usa `const ui = state ?? selectEditorUi(editor)` (mesmo seletor extraído, com fallback de leitura direta no 1º frame). `useEditorState` continua dando a reatividade de seleção; o editor sempre renderiza.

---

### [2026-06-27] — RichEditor v2: reatividade de seleção, cores, H1–H6 e imagem redimensionável

**Arquivos:**
- `src/components/blog/RichEditor.tsx`: `useEditorState` (toolbar sensível ao contexto — botões acendem conforme a formatação no cursor/seleção); hierarquia ampliada p/ H1–H6; dois `ColorControl` (popover com swatches + `<input type=color>` + remover) p/ **cor da fonte** (`setColor`/`unsetColor`) e **cor de fundo** (`setBackgroundColor`/`unsetBackgroundColor`); extensões `TextStyle` + `Color` + `BackgroundColor`
- `src/components/blog/ResizableImage.tsx`: NOVO — extensão que estende `@tiptap/extension-image` com atributo `width` + `ReactNodeViewRenderer`; NodeView com alças nos 4 cantos p/ redimensionar via mouse (estilo WordPress), mantendo proporção

**Razão:** Pedido de UX avançada (Word/WordPress): toolbar reativa, cores de fonte/fundo e imagem com resize por arraste.

**Impacto:** Saída continua HTML limpo via `getHTML()`; imagem serializa `width`/`style` (round-trip via `parseHTML`). Cores via `<span style="color|background-color">` renderizam no editor e no HTML público. Nenhuma dependência nova (tudo já instalado: text-style traz Color/BackgroundColor; react traz useEditorState/ReactNodeViewRenderer).

---

### [2026-06-27] — RichEditor (WYSIWYG) refatorado para toolbar estilo Word

**Arquivos:**
- `src/components/blog/RichEditor.tsx`: REFATORADO — toolbar completa (dropdown de hierarquia Parágrafo/H1–H4 p/ SEO, negrito/itálico/sublinhado/tachado, 4 alinhamentos, listas, link via popover, blockquote, imagem, undo/redo); toolbar sticky no topo + área de conteúdo com scroll interno (`max-h-[60vh]`)

**Razão:** Editor anterior era básico e **re-adicionava** `Underline`/`Link` que o `StarterKit` v3 já inclui (extensões duplicadas). Faltavam tachado, justificado, blockquote, undo/redo e a hierarquia de títulos.

**Impacto:** Saída continua HTML limpo via `getHTML()` (`onChange`) — contrato `value`/`onChange`/`name` inalterado; `PostEditorClient` não muda. Extensões agora configuradas via `StarterKit.configure({ heading: { levels: [1,2,3,4] }, link: { openOnClick: false } })`; só `TextAlign`/`Image`/`Placeholder` são adicionadas à parte. Estilo WYSIWYG via CSS escopado `.janus-rich-editor .ProseMirror` (projeto não tem `@tailwindcss/typography`, então `prose` era inerte).

---

### [2026-05-21] — v3: BlogPostStatus, authorId FK, categories M:N, PostEditorClient e PostsListClient reescritos

**Arquivos:**
- `prisma/schema.prisma`: BlogPostStatus enum; BlogPost.status + publishedAt nullable + authorId FK; BlogPostCategory M:N (remove categoryId)
- `src/modules/blog/queries/getCompanyUsers.ts`: NOVO — lista usuários da empresa para select de autor
- `src/modules/blog/queries/getBlogPosts.ts`, `getBlogPost.ts`: includes atualizados (categories M:N, author); orderBy publishedAt asc nulls last
- `src/modules/blog/actions/createBlogPost.ts`, `updateBlogPost.ts`: status, authorId, categoryIds[]; publishedAt auto; categories full-replace
- 4 páginas new/edit posts (sites + LP): getCompanyUsers no Promise.all; companyUsers prop
- `src/components/blog/PostEditorClient.tsx`: REESCRITO — status toggle, select autor com avatar, cascade multi-select categorias
- `src/components/blog/PostsListClient.tsx`: REESCRITO — filtros rápidos, D&D colunas, modal bulk delete (autoFocus Cancel), lápis edit
- `src/app/api/[companySlug]/[projectId]/blog/route.ts`, `[postId]/route.ts`, `../blog/route.ts`: categories[] + status PUBLISHED filter

**Razão:** Reestruturação profunda do painel de artigos — modelo status DRAFT/PUBLISHED, autor vinculado ao User, categorias M:N com cascade seletor.

**Impacto:** API pública agora retorna `categories[]` em vez de `category`; artigos novos são DRAFT por padrão; publishedAt auto-preenchido ao publicar.

---

### [2026-05-20] — API pública + banner RBAC + documentação inicial

**Arquivos:**
- `src/app/api/[companySlug]/[projectId]/blog/route.ts`: criado — GET público com projectId no path, paginação e busca
- `src/components/blog/ApiEndpointBanner.tsx`: criado — banner client com cópia de URL
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/posts/page.tsx`: banner condicional ADMIN/DEV
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/posts/page.tsx`: idem

**Razão:** Expor API pública por projeto; facilitar descoberta para Devs/Admins.

**Impacto:** URL canônica da API: `/api/{companySlug}/{projectId}/blog`. Rota genérica sem projectId removida.
