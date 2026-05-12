'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useHistory } from '@/hooks/useHistory'
import Canvas from './Canvas'
import BoardHeader from './BoardHeader'
import TopNavbar from '@/components/ui/TopNavbar'
import LeftSidebar from '@/components/ui/LeftSidebar'
import RightSidebar from '@/components/ui/RightSidebar'
import BottomToolbar from '@/components/ui/BottomToolbar'
import CollaborationPanel from '@/components/ui/CollaborationPanel'
import StickyNotesLayer from '@/components/sticky/StickyNotesLayer'
import ChatPanel from '@/components/chat/ChatPanel'
import CommentsPanel from '@/components/comments/CommentsPanel'
import { useCanvasStore } from '@/stores/canvasStore'
import type { Board } from '@/types/board'
import type { fabric } from 'fabric'
import type { ToolType } from '@/types/canvas'

interface BoardContentProps {
  board: Board
  canEdit: boolean
}

export default function BoardContent({ board, canEdit }: BoardContentProps) {
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const { saveSnapshot, undo, redo } = useHistory(fabricRef)
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)

  // Stable callback — empty deps, writes into ref directly (no setState)
  const handleCanvasReady = useCallback(
    (ref: React.MutableRefObject<fabric.Canvas | null>) => {
      fabricRef.current = ref.current
    },
    [] // no setState called here, so no re-render triggered
  )

  const handleDeleteSelected = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return
    saveSnapshot()
    canvas.discardActiveObject()
    activeObjects.forEach((obj) => canvas.remove(obj))
    canvas.renderAll()
  }, [saveSnapshot])

  const handleClear = useCallback(() => {
    if (confirm('Clear the canvas?')) {
      saveSnapshot()
      fabricRef.current?.clear()
      fabricRef.current?.renderAll()
    }
  }, [saveSnapshot])

  const handleUndo = useCallback(() => undo(), [undo])
  const handleRedo = useCallback(() => redo(), [redo])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        undo()
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        redo()
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputElement(e.target)) {
        e.preventDefault()
        handleDeleteSelected()
      }
      if (!e.ctrlKey && !e.metaKey && !isInputElement(e.target)) {
        const tool = getShortcutTool(e.key)
        if (tool) useCanvasStore.getState().setActiveTool(tool)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, handleDeleteSelected])

  return (
    <div className="h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-[#2a2a2a] bg-[#0f0f0f]/95 shadow-sm backdrop-blur">
        <TopNavbar boardName={board.title || 'Board'} />
        <BoardHeader board={board} canEdit={canEdit} fabricRef={fabricRef} />
      </div>

      <div className="flex h-full min-h-0 pt-24">
        <LeftSidebar
          canEdit={canEdit}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onDeleteSelected={handleDeleteSelected}
        />

        <main className="relative min-w-0 flex-1 overflow-hidden bg-[#0f0f0f] p-3">
          <div className="relative h-full overflow-hidden rounded-xl border border-[#2a2a2a] bg-white shadow-2xl">
            <Canvas
              boardId={board.id}
              initialData={board.canvas_data}
              canEdit={canEdit}
              onCanvasReady={handleCanvasReady}
            />
            <StickyNotesLayer />
          </div>
          <BottomToolbar fabricRef={fabricRef} onUndo={handleUndo} onRedo={handleRedo} />
          <CollaborationPanel />
          <ChatPanel />
          <CommentsPanel />
        </main>

        <RightSidebar
          fabricRef={fabricRef}
          isCollapsed={isRightSidebarCollapsed}
          onToggleCollapse={() => setIsRightSidebarCollapsed((collapsed) => !collapsed)}
        />
      </div>
    </div>
  )
}

function getShortcutTool(key: string): ToolType | null {
  const shortcuts: Record<string, ToolType> = {
    v: 'select',
    p: 'pen',
    r: 'rectangle',
    o: 'circle',
    l: 'line',
    t: 'text',
    e: 'eraser',
    h: 'pan',
  }
  return shortcuts[key.toLowerCase()] ?? null
}

function isInputElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.contentEditable === 'true')
  )
}
