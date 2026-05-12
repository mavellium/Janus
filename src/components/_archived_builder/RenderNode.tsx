'use client'

import { EditorNode } from '@/hooks/use-builder'
import { CoreRenderer } from './CoreRenderer'

interface RenderNodeProps {
  node: EditorNode
  selectedNodeId: string | null
  onSelect: (nodeId: string) => void
}

export function RenderNode({ node, selectedNodeId, onSelect }: RenderNodeProps) {
  const isSelected = node.id === selectedNodeId

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(node.id)
  }

  return (
    <div className="relative cursor-pointer" onClick={handleClick}>
      {isSelected && (
        <>
          <span className="absolute top-0 left-0 z-10 text-xs bg-brand-primary text-white px-2 py-0.5 rounded-br">
            {node.type}
          </span>
          <div className="absolute inset-0 ring-2 ring-brand-primary ring-inset pointer-events-none" />
        </>
      )}
      <CoreRenderer
        node={node}
        renderChild={(child) => (
          <RenderNode
            node={child}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          />
        )}
      />
    </div>
  )
}
