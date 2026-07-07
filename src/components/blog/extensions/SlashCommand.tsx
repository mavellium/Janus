'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type ComponentType,
} from 'react'
import { Extension, type Range } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer, type Editor } from '@tiptap/react'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Table as TableIcon,
  Minus,
  Info,
  type LucideProps,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlashItem {
  title: string
  icon: ComponentType<LucideProps>
  run: (editor: Editor, range: Range) => void
}

const SLASH_ITEMS: SlashItem[] = [
  {
    title: 'Título 1',
    icon: Heading1,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run(),
  },
  {
    title: 'Título 2',
    icon: Heading2,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run(),
  },
  {
    title: 'Título 3',
    icon: Heading3,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run(),
  },
  {
    title: 'Lista com marcadores',
    icon: List,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    title: 'Lista numerada',
    icon: ListOrdered,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    title: 'Checklist',
    icon: ListChecks,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run(),
  },
  {
    title: 'Citação',
    icon: Quote,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    title: 'Bloco de código',
    icon: Code,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run(),
  },
  {
    title: 'Aviso (callout)',
    icon: Info,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleCallout('info').run(),
  },
  {
    title: 'Tabela',
    icon: TableIcon,
    run: (e, r) =>
      e
        .chain()
        .focus()
        .deleteRange(r)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: 'Divisor',
    icon: Minus,
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
]

interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface SlashMenuProps {
  items: SlashItem[]
  command: (item: SlashItem) => void
}

const SlashMenuList = forwardRef<SlashMenuRef, SlashMenuProps>(
  function SlashMenuList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) command(item)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="janus-slash-menu">
          <div className="px-3 py-2 text-xs text-brand-muted">
            Nenhum bloco encontrado
          </div>
        </div>
      )
    }

    return (
      <div className="janus-slash-menu">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command(item)}
              className={cn(
                'janus-slash-item',
                index === selectedIndex && 'is-active',
              )}
            >
              <Icon size={15} className="shrink-0" />
              {item.title}
            </button>
          )
        })}
      </div>
    )
  },
)

function positionPopup(
  popup: HTMLDivElement | null,
  clientRect: (() => DOMRect | null) | null | undefined,
) {
  if (!popup || !clientRect) return
  const rect = clientRect()
  if (!rect) return
  popup.style.top = `${rect.bottom + window.scrollY + 6}px`
  popup.style.left = `${rect.left + window.scrollX}px`
}

const suggestion: Omit<SuggestionOptions<SlashItem>, 'editor'> = {
  char: '/',
  startOfLine: false,
  command: ({ editor, range, props }) => {
    props.run(editor, range)
  },
  items: ({ query }) =>
    SLASH_ITEMS.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()),
    ).slice(0, 10),
  render: () => {
    let component: ReactRenderer<SlashMenuRef, SlashMenuProps> | null = null
    let popup: HTMLDivElement | null = null

    return {
      onStart: (props) => {
        component = new ReactRenderer(SlashMenuList, {
          props: { items: props.items, command: props.command },
          editor: props.editor,
        })
        popup = document.createElement('div')
        popup.style.position = 'absolute'
        popup.style.zIndex = '60'
        popup.appendChild(component.element)
        document.body.appendChild(popup)
        positionPopup(popup, props.clientRect)
      },
      onUpdate: (props) => {
        component?.updateProps({ items: props.items, command: props.command })
        positionPopup(popup, props.clientRect)
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          popup?.remove()
          return true
        }
        return component?.ref?.onKeyDown(props) ?? false
      },
      onExit: () => {
        popup?.remove()
        popup = null
        component?.destroy()
        component = null
      },
    }
  },
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...suggestion,
      }),
    ]
  },
})
