# Low-Code Editor - Arquitetura e Documentação

## Visão Geral

O Low-Code Editor é um sistema de construção visual de páginas integrado ao Janus CMS Multi-Tenant. Permite criar e editar páginas web arrastando componentes, configurando propriedades visualmente e exportando para JSON que é persistido no banco de dados via Prisma.

### Integração com o Sistema

- **Dashboard Route**: `/[companySlug]/dashboard/sites/[siteId]/pages/[pageId]/builder`
- **Landing Pages Route**: `/[companySlug]/dashboard/landing-pages/[lpId]/pages/[pageId]/builder`
- **Preview Route**: `/[companySlug]/preview/[pageId]`
- **Persistência**: Prisma ORM com campo `content` do tipo JSON

## Arquitetura de Estado

### Árvore de Nós (JSON)

A estrutura fundamental do editor é baseada em uma árvore de nós recursiva:

```typescript
interface EditorNode {
  id: string                    // UUID gerado via uuidv4()
  type: string                  // 'Section' | 'Container' | 'Heading' | 'Text' | 'Image' | 'Button' | 'Hero' | 'Divider' | 'Video'
  props: Record<string, unknown> // Propriedades tipadas como unknown para type-safety
  children: EditorNode[]        // Recursão para aninhamento
}
```

### Formato de Persistência

O conteúdo é salvo no formato:

```typescript
interface PageContent {
  nodes: EditorNode[]
  globalSettings: GlobalSettings
}

interface GlobalSettings {
  backgroundColor?: string
  textColor?: string
  fontFamily?: string
}
```

### Ausência de localStorage

Diferente de editores tradicionais, não utilizamos localStorage para persistência. O estado é mantido em memória durante a edição e salvo explicitamente no banco via action `updatePageContent`. Isso garante:

- Consistência entre múltiplos dispositivos
- Colaboração multiusuário futura
- Backup automático no servidor

### Motor de Histórico (Undo/Redo)

Implementado via padrão History Stack com estado imutável:

```typescript
interface HistoryState {
  past: EditorNode[][]      // Estados anteriores
  present: EditorNode[]     // Estado atual
  future: EditorNode[][]    // Estados desfeitos
}

interface BuilderState extends HistoryState {
  selectedNodeId: string | null
}
```

#### Ações que Salvam no Histórico:

- `addNode` - Adicionar novo componente
- `updateNode` - Atualizar propriedades
- `deleteNode` - Remover componente
- `moveNode` - Reordenar ou mover entre containers

#### Funções do Histórico:

- `undo()` - Restaura estado do `past`, empurra `present` para `future`
- `redo()` - Restaura estado do `future`, empurra `present` para `past`
- `canUndo` - Boolean, true se `past.length > 0`
- `canRedo` - Boolean, true se `future.length > 0`

## Drag and Drop (@dnd-kit)

### Estrutura de Integração

O sistema utiliza `@dnd-kit/core` e `@dnd-kit/sortable` para drag-and-drop:

```typescript
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
```

### Fluxos de Drag

#### 1. Componentes para Canvas

- **Draggable**: `ComponentsPanel` com `useDraggable({ id: 'draggable-{type}', data: { type } })`
- **Droppable**: `Canvas` com `useDroppable({ id: 'canvas-root', data: { parentId: null } })`
- **Handler**: `handleDragEnd` verifica `over.id === 'canvas-root'` e chama `builder.addNode(null, draggedType)`

#### 2. Reordenação (Sortable)

- **Container**: `SortableContext` com `verticalListSortingStrategy`
- **Items**: `LayerItem` usa `useSortable({ id: node.id })`
- **Handler**: Extrai `active.id` e `over.id`, calcula índices e chama `builder.moveNode`

#### 3. Aninhamento

- **Section** e **Container** implementam `useDroppable` individual
- Aceitam componentes soltos dentro deles
- Atualizam `parentId` no `handleDragEnd`

### Type Safety em Eventos

```typescript
const handleDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event

  if (!over) return  // Guarda essencial

  const draggedType = (active.data.current as { type?: string })?.type
  if (!draggedType) return

  // Reordenar
  if (active.id !== over.id) {
    const oldIndex = builder.nodes.findIndex((n) => n.id === active.id)
    const newIndex = builder.nodes.findIndex((n) => n.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      builder.moveNode(active.id as string, null, newIndex)
    }
  }
}, [builder])
```

## Componentes Core

### CoreRenderer

Motor central que transforma JSON em React elements:

```typescript
interface CoreRendererProps {
  node: EditorNode
  renderChild?: (node: EditorNode) => React.ReactNode  // Wrapper opcional para edição
}
```

#### Responsabilidades:

- Switch por `node.type` renderizando elemento HTML apropriado
- Aplicação de `style` com valores do `node.props.style`
- Renderização recursiva de `children`
- Suporte a Video (YouTube/Vimeo embeds e HTML5 video)

#### Renderização Recursiva:

```typescript
const renderChildren = () => {
  if (renderChild) {
    return node.children.map((child) => (
      <span key={child.id}>{renderChild(child)}</span>
    ))
  }
  return node.children.map((child) => (
    <CoreRenderer key={child.id} node={child} />
  ))
}
```

### useBuilder Hook

Hook central de gerenciamento de estado:

```typescript
export function useBuilder(initialContent: EditorNode[]) {
  return {
    nodes: EditorNode[],                    // Árvore atual
    selectedNodeId: string | null,           // ID do nó selecionado
    addNode: (parentId, type) => void,      // Criar nó
    updateNode: (id, props) => void,       // Atualizar props
    deleteNode: (id) => void,               // Remover nó
    moveNode: (id, targetParent, index) => void,  // Mover/reordenar
    selectNode: (id) => void,               // Selecionar nó
    undo: () => void,                        // Desfazer
    redo: () => void,                        // Refazer
    canUndo: boolean,                        // Pode desfazer?
    canRedo: boolean,                        // Pode refazer?
    findNodeById: (id) => EditorNode | null // Busca recursiva
  }
}
```

## Painéis (UI)

### Top Bar

Container de ações com layout flexível:

```typescript
<div className="flex justify-between items-center w-full px-6 py-4">
  {/* Esquerda: Voltar */}
  <Link href={...}>← Voltar</Link>

  {/* Direita: Ações */}
  <div className="flex items-center gap-2">
    <button onClick={builder.undo} disabled={!builder.canUndo}>
      <Undo2 />
    </button>
    <button onClick={builder.redo} disabled={!builder.canRedo}>
      <Redo2 />
    </button>
    <button onClick={handleSave}>
      <Save /> Salvar
    </button>
    <button onClick={handlePublish}>
      <Send /> Publicar
    </button>
    <Link href={previewUrl} target="_blank">
      <Eye /> Preview
    </Link>
  </div>
</div>
```

### Left Sidebar

Duas abas alternáveis:

#### Aba Componentes (Grid)

```typescript
const COMPONENT_CONFIG = [
  { type: 'Section', icon: Square, label: 'Seção' },
  { type: 'Container', icon: Box, label: 'Container' },
  { type: 'Heading', icon: Type, label: 'Título' },
  { type: 'Text', icon: AlignLeft, label: 'Texto' },
  { type: 'Image', icon: Image, label: 'Imagem' },
  { type: 'Button', icon: MousePointerClick, label: 'Botão' },
  { type: 'Divider', icon: Minus, label: 'Divisor' },
  { type: 'Video', icon: Video, label: 'Vídeo' },
]
```

Cada componente é draggable com ícone e label.

#### Aba Camadas (Sanfona)

Componente `LayerItem` recursivo:

```typescript
interface LayerItemProps {
  node: EditorNode
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
  onDeleteNode: (nodeId: string) => void
  level?: number  // Indentação visual
}
```

Features:
- Chevron para expandir/colapsar
- Indentação com `marginLeft: level * 16px`
- Border-left para indicar hierarquia
- Drag handle (GripVertical)
- Delete com confirmação

### Right Sidebar

Duas abas:

#### Aba Elemento (Contextual)

Renderização condicional por tipo:

```typescript
switch (node?.type) {
  case 'Text':
  case 'Heading':
    return renderTypographySection()  // Conteúdo, tamanho, peso, cor

  case 'Button':
    return renderAppearanceSection()  // Texto, bgColor, borderRadius

  case 'Section':
  case 'Container':
    return renderLayoutSection()      // Margin, padding, bgColor, dimensions

  case 'Video':
    return <VideoPlayer />            // URL, autoplay, mute, loop, dimensions
}
```

#### Aba Global

Configurações da página inteira:

```typescript
interface PageSettings {
  backgroundColor?: string
  textColor?: string
  fontFamily?: string
}
```

- ColorPicker para cores
- Select para fontes (Inter, Roboto, Playfair Display, Merriweather)

## Tipos e Type Safety

### Regras de Tipagem

1. **Nunca usar `any`**: Todas as propriedades são `Record<string, unknown>`
2. **Type Assertions**: Converter via `as string`, `as boolean`, `as number` quando necessário
3. **Null Checks**: Sempre verificar `if (!node)` antes de acessar propriedades
4. **Guardas de Tipo**: Usar `switch (node?.type)` para narrowing

### Exemplos de Type Safety

```typescript
// Props como unknown
interface EditorNode {
  props: Record<string, unknown>
}

// Conversão segura
const content = (node.props.content as string) || ''
const isLoop = (node.props.loop as boolean) || false
const style = (node.props.style as Record<string, string>) || {}

// Guarda de null
const renderTypographySection = () => {
  if (!node || (node.type !== 'Text' && node.type !== 'Heading')) return null
  // ...
}
```

## Funções Utilitárias de Árvore

```typescript
// Atualizar nó recursivamente
function updateNodeInTree(
  nodes: EditorNode[],
  nodeId: string,
  props: Record<string, unknown>
): EditorNode[]

// Deletar nó recursivamente
function deleteNodeFromTree(
  nodes: EditorNode[],
  nodeId: string
): EditorNode[]

// Buscar nó por ID (recursivo)
function findNodeByIdRecursive(
  nodes: EditorNode[],
  id: string
): EditorNode | null

// Buscar pai de nó (recursivo)
function findParentNodeRecursive(
  nodes: EditorNode[],
  id: string
): EditorNode | null
```

## Persistência

### Action: updatePageContent

```typescript
async function updatePageContent({
  pageId: string,
  content: { nodes: EditorNode[], globalSettings: GlobalSettings },
  isPublished?: boolean
}): Promise<{ ok: boolean; error?: string }>
```

- Salva no Prisma via `prisma.page.update()`
- Revalida cache Next.js via `revalidatePath()`
- Retorna objeto de resultado para toast feedback

## Componentes Suportados

| Componente | Props Principais | Filhos Permitidos |
|------------|------------------|-------------------|
| Section | backgroundColor, minHeight, padding, margin | Sim |
| Container | backgroundColor, width, height, padding, margin | Sim |
| Heading | content, fontSize, fontWeight, textAlign, color | Não |
| Text | content, fontSize, fontWeight, textAlign, color | Não |
| Image | src, alt, width, height | Não |
| Button | text, bgColor, borderRadius | Não |
| Hero | title, subtitle, bgColor, textColor | Sim |
| Divider | borderColor | Não |
| Video | src, width, height, autoplay, loop, muted | Não |

## Considerações de UX

- **Toasts**: Feedback visual para Save/Publish usando `useTransition`
- **Loading States**: Spinners em botões durante operações async
- **Seleção Visual**: Ring azul em componentes selecionados
- **Drag Preview**: Opacity reduzida durante drag
- **Confirmação**: Dialog de confirmação antes de deletar
- **Disabled States**: Botões Undo/Redo desabilitados quando não aplicáveis
