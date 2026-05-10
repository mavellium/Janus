'use client'

import { useState, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, Undo2, Redo2, Save, Send, Eye, Loader2 } from 'lucide-react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useBuilder, type EditorNode } from '@/hooks/use-builder'
import { ComponentsPanel } from '@/components/builder/ComponentsPanel'
import { Canvas } from '@/components/builder/Canvas'
import { PropertiesPanel } from '@/components/builder/PropertiesPanel'
import { updatePageContent } from '@/modules/projects/actions/updatePageContent'
import { BuilderSkeleton } from './BuilderSkeleton'
import { useIsMounted } from './useIsMounted'
import { useToast } from '@/hooks/use-toast'
import { ToastContainer } from '@/components/builder/ToastContainer'

interface BuilderClientProps {
  pageId: string
  companySlug: string
  siteId: string
  initialContent: EditorNode[]
}

interface PageSettings {
  backgroundColor?: string
  textColor?: string
  fontFamily?: string
}

export function LandingPageBuilderClient({
  pageId,
  companySlug,
  siteId,
  initialContent,
}: BuilderClientProps) {
  const isMounted = useIsMounted()
  const builder = useBuilder(initialContent)
  const [isSavePending, startSaveTransition] = useTransition()
  const [isPublishPending, startPublishTransition] = useTransition()
  const { toasts, toast, removeToast } = useToast()
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    backgroundColor: '#F5F5F5',
    textColor: '#161718',
    fontFamily: 'Inter',
  })

  const selectedNode = builder.selectedNodeId
    ? builder.findNodeById(builder.selectedNodeId)
    : null

  const handleSave = useCallback(() => {
    startSaveTransition(async () => {
      const result = await updatePageContent({
        pageId,
        content: {
          nodes: builder.nodes,
          globalSettings: pageSettings,
        },
      })

      if (result.ok) {
        toast({ message: 'Página salva com sucesso!', type: 'success' })
      } else {
        toast({ message: result.error || 'Erro ao salvar página', type: 'error' })
      }
    })
  }, [builder.nodes, pageSettings, pageId, toast])

  const handlePublish = useCallback(() => {
    startPublishTransition(async () => {
      const result = await updatePageContent({
        pageId,
        content: {
          nodes: builder.nodes,
          globalSettings: pageSettings,
        },
        isPublished: true,
      })

      if (result.ok) {
        toast({ message: 'Página publicada com sucesso!', type: 'success' })
      } else {
        toast({ message: result.error || 'Erro ao publicar página', type: 'error' })
      }
    })
  }, [builder.nodes, pageSettings, pageId, toast])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    // Reordering layers
    if (active.id !== over.id && builder.nodes.some((n: EditorNode) => n.id === active.id)) {
      const oldIndex = builder.nodes.findIndex((n: EditorNode) => n.id === active.id)
      const newIndex = builder.nodes.findIndex((n: EditorNode) => n.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newNodes = [...builder.nodes]
        const [removed] = newNodes.splice(oldIndex, 1)
        newNodes.splice(newIndex, 0, removed)
        // Update nodes order via builder hook if available, otherwise use internal state
        return
      }
    }

    const draggedType = (active.data.current as { type?: string })?.type
    if (!draggedType) return

    if (over.id === 'canvas-root') {
      builder.addNode(null, draggedType)
    }
  }, [builder.nodes, pageSettings, pageId, toast])

  if (!isMounted) {
    return <BuilderSkeleton />
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="border-b border-brand-muted/40 px-6 py-4 flex items-center justify-between">
        <Link
          href={`/${companySlug}/dashboard/sites/${siteId}`}
          className="flex items-center gap-2 px-3 py-2 text-brand-primary hover:text-brand-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: '#161718' }} />
          Voltar
        </Link>
        <div className="border-r border-brand-muted/40 px-6 py-4 flex items-center gap-2">
          <button
            onClick={() => builder.undo()}
            className="p-2 hover:bg-brand-muted/20 rounded-lg transition"
            disabled
            title="Desfazer"
          >
            <Undo2 className="w-4 h-4" style={{ color: '#161718' }} />
          </button>
          <button
            onClick={() => builder.redo()}
            className="p-2 hover:bg-brand-muted/20 rounded-lg transition"
            disabled
            title="Refazer"
          >
            <Redo2 className="w-4 h-4" style={{ color: '#161718' }} />
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={isSavePending}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition disabled:opacity-50"
          style={{ backgroundColor: '#514030' }}
        >
          {isSavePending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSavePending ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          onClick={handlePublish}
          disabled={isPublishPending}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition disabled:opacity-50"
          style={{ backgroundColor: '#161718' }}
        >
          {isPublishPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isPublishPending ? 'Publicando...' : 'Publicar'}
        </button>
        <Link
          href={`/${companySlug}/preview/${pageId}`}
          target="_blank"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition"
          style={{ backgroundColor: '#514030' }}
        >
          <Eye className="w-4 h-4" />
          Preview
        </Link>
      </div>

      <DndContext id="dnd-builder" onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          <ComponentsPanel
            nodes={builder.nodes}
            selectedNodeId={builder.selectedNodeId}
            onSelectNode={builder.selectNode}
            onDeleteNode={builder.deleteNode}
          />

          <Canvas
            nodes={builder.nodes}
            selectedNodeId={builder.selectedNodeId}
            onSelectNode={builder.selectNode}
            backgroundColor={pageSettings.backgroundColor}
          />

          <PropertiesPanel
            node={selectedNode}
            onUpdate={(props) => {
              if (builder.selectedNodeId) {
                builder.updateNode(builder.selectedNodeId, props)
              }
            }}
            pageSettings={pageSettings}
            onUpdatePageSettings={setPageSettings}
          />
        </div>
      </DndContext>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
