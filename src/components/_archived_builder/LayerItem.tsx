'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, ChevronDown, Trash2, GripVertical } from 'lucide-react'
import { EditorNode } from '@/hooks/use-builder'

interface LayerItemProps {
  node: EditorNode
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
  onDeleteNode: (nodeId: string) => void
  level?: number
}

export function LayerItem({ 
  node, 
  selectedNodeId, 
  onSelectNode, 
  onDeleteNode, 
  level = 0 
}: LayerItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = node.id === selectedNodeId

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleSelect = () => {
    onSelectNode(node.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Tem certeza que deseja excluir "${node.type}"?`)) {
      onDeleteNode(node.id)
    }
  }

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
          ${isSelected ? 'bg-brand-primary/10 border border-brand-primary/30' : 'hover:bg-brand-btn-light/40'}
          ${isDragging ? 'opacity-50' : ''}
        `}
        onClick={handleSelect}
        {...attributes}
      >
        <div {...listeners} className="cursor-grab">
          <GripVertical className="w-3 h-3 text-brand-muted/40" />
        </div>

        {hasChildren && (
          <button
            onClick={handleToggleExpand}
            className="p-0.5 hover:bg-brand-muted/20 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-brand-muted" />
            ) : (
              <ChevronRight className="w-3 h-3 text-brand-muted" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-4" />}

        <div className="flex-1 flex items-center justify-between">
          <span className="text-sm font-medium text-brand-text">
            {node.type}
          </span>
          
          <button
            onClick={handleDelete}
            className="p-0.5 hover:bg-destructive/15 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-8 border-l border-brand-btn-light">
          {node.children.map((child) => (
            <LayerItem
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onDeleteNode={onDeleteNode}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
