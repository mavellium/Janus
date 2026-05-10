import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface EditorNode {
  id: string
  type: string
  props: Record<string, unknown>
  children: EditorNode[]
}

interface HistoryState {
  past: EditorNode[][]
  present: EditorNode[]
  future: EditorNode[][]
}

interface BuilderState extends HistoryState {
  selectedNodeId: string | null
}

function updateNodeInTree(nodes: EditorNode[], nodeId: string, props: Record<string, unknown>): EditorNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, props: { ...node.props, ...props } }
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNodeInTree(node.children, nodeId, props) }
    }
    return node
  })
}

function deleteNodeFromTree(nodes: EditorNode[], nodeId: string): EditorNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      children: deleteNodeFromTree(node.children, nodeId),
    }))
}

function findNodeByIdRecursive(nodes: EditorNode[], id: string): EditorNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNodeByIdRecursive(node.children, id)
    if (found) return found
  }
  return null
}

function findParentNodeRecursive(nodes: EditorNode[], id: string): EditorNode | null {
  for (const node of nodes) {
    if (node.children.some((child) => child.id === id)) {
      return node
    }
    const found = findParentNodeRecursive(node.children, id)
    if (found) return found
  }
  return null
}

export function useBuilder(initialContent: EditorNode[]) {
  const [state, setState] = useState<BuilderState>({
    past: [],
    present: initialContent,
    future: [],
    selectedNodeId: null,
  })

  const addNode = useCallback((parentId: string | null, nodeType: string) => {
    const newNode: EditorNode = {
      id: uuidv4(),
      type: nodeType,
      props: {},
      children: [],
    }

    setState((prev) => {
      const newPresent = [...prev.present, newNode]
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: [],
        selectedNodeId: prev.selectedNodeId,
      }
    })
  }, [])

  const updateNode = useCallback((nodeId: string, props: Record<string, unknown>) => {
    setState((prev) => {
      const newPresent = updateNodeInTree(prev.present, nodeId, props)
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: [],
        selectedNodeId: prev.selectedNodeId,
      }
    })
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    setState((prev) => {
      const newPresent = deleteNodeFromTree(prev.present, nodeId)
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: [],
        selectedNodeId: prev.selectedNodeId === nodeId ? null : prev.selectedNodeId,
      }
    })
  }, [])

  const moveNode = useCallback((nodeId: string, targetParentId: string | null, index: number) => {
    setState((prev) => {
      const clonedNodes: EditorNode[] = JSON.parse(JSON.stringify(prev.present))
      const node = findNodeByIdRecursive(clonedNodes, nodeId)
      const oldParent = findParentNodeRecursive(clonedNodes, nodeId)

      if (!node) {
        return prev
      }

      if (oldParent) {
        oldParent.children = oldParent.children.filter((n) => n.id !== nodeId)
      } else {
        const nodeIndex = clonedNodes.findIndex((n) => n.id === nodeId)
        if (nodeIndex !== -1) {
          clonedNodes.splice(nodeIndex, 1)
        }
      }

      if (!targetParentId) {
        clonedNodes.splice(index, 0, node)
      } else {
        const newParent = findNodeByIdRecursive(clonedNodes, targetParentId)
        if (newParent) {
          newParent.children.splice(index, 0, node)
        }
      }

      return {
        past: [...prev.past, prev.present],
        present: clonedNodes,
        future: [],
        selectedNodeId: prev.selectedNodeId,
      }
    })
  }, [])

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev

      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, -1)

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
        selectedNodeId: prev.selectedNodeId,
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev

      const next = prev.future[0]
      const newFuture = prev.future.slice(1)

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
        selectedNodeId: prev.selectedNodeId,
      }
    })
  }, [])

  const selectNode = useCallback((nodeId: string | null) => {
    setState((prev) => ({ ...prev, selectedNodeId: nodeId }))
  }, [])

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  return {
    nodes: state.present,
    selectedNodeId: state.selectedNodeId,
    addNode,
    updateNode,
    deleteNode,
    moveNode,
    selectNode,
    undo,
    redo,
    canUndo,
    canRedo,
    findNodeById: (id: string) => findNodeByIdRecursive(state.present, id),
  }
}
