'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Layers,
  Grid3X3,
  Square,
  Box,
  Type,
  AlignLeft,
  Image,
  MousePointerClick,
  Minus,
  Video,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { EditorNode } from '@/hooks/use-builder'
import { LayerItem } from './LayerItem'
import type { LucideIcon } from 'lucide-react'

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

interface DraggableComponentProps {
  type: string
  icon: LucideIcon
  label: string
}

function DraggableComponent({ type, icon: Icon, label }: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-${type}`,
    data: { type },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border border-brand-btn-light cursor-move transition ${
        isDragging ? 'opacity-50 bg-brand-primary/20' : 'hover:bg-brand-btn-light/40 hover:border-brand-primary'
      }`}
    >
      <Icon className="w-8 h-8 mb-2 text-brand-primary" />
      <span className="text-xs font-medium text-brand-text">
        {label}
      </span>
    </div>
  )
}

interface ComponentsPanelProps {
  nodes?: EditorNode[]
  selectedNodeId?: string | null
  onSelectNode?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
}

export function ComponentsPanel({
  nodes = [],
  selectedNodeId,
  onSelectNode,
  onDeleteNode,
}: ComponentsPanelProps) {
  const [activeTab, setActiveTab] = useState<'components' | 'layers'>('components')

  return (
    <aside className="w-64 border-r border-brand-btn-light bg-card overflow-y-auto flex flex-col">
      <div className="flex border-b border-brand-btn-light">
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
            activeTab === 'components'
              ? 'text-brand-primary border-b-2 border-brand-primary'
              : 'text-brand-muted hover:text-brand-primary'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          Componentes
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
            activeTab === 'layers'
              ? 'text-brand-primary border-b-2 border-brand-primary'
              : 'text-brand-muted hover:text-brand-primary'
          }`}
        >
          <Layers className="w-4 h-4" />
          Camadas
        </button>
      </div>

      <div className="flex-1 p-4">
        {activeTab === 'components' ? (
          <div className="grid grid-cols-2 gap-3">
            {COMPONENT_CONFIG.map((config) => (
              <DraggableComponent
                key={config.type}
                type={config.type}
                icon={config.icon}
                label={config.label}
              />
            ))}
          </div>
        ) : (
          <SortableContext
            items={nodes.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {nodes.length === 0 ? (
                <p className="text-sm text-brand-muted text-center py-8">
                  Nenhum componente no canvas
                </p>
              ) : (
                nodes.map((node) => (
                  <LayerItem
                    key={node.id}
                    node={node}
                    selectedNodeId={selectedNodeId || null}
                    onSelectNode={onSelectNode || (() => {})}
                    onDeleteNode={onDeleteNode || (() => {})}
                    level={0}
                  />
                ))
              )}
            </div>
          </SortableContext>
        )}
      </div>
    </aside>
  )
}
