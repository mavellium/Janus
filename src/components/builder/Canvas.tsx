'use client'

import { useDroppable } from '@dnd-kit/core'
import { EditorNode } from '@/hooks/use-builder'
import { RenderNode } from './RenderNode'

interface CanvasProps {
  nodes: EditorNode[]
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
  backgroundColor?: string
}

export function Canvas({ nodes, selectedNodeId, onSelectNode, backgroundColor }: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: { parentId: null },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 overflow-auto p-8 bg-brand-bg ${isOver ? 'outline-2 outline-dashed outline-brand-primary' : ''}`}
    >
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-brand-muted mb-2">Canvas — Arraste componentes aqui</p>
            <p className="text-xs text-brand-muted/60">
              Selecione um componente à esquerda para começar
            </p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl border border-brand-btn-light p-8 min-h-96 bg-card"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          {nodes.map((node) => (
            <RenderNode
              key={node.id}
              node={node}
              selectedNodeId={selectedNodeId}
              onSelect={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}
