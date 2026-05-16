'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useHistory } from '@/hooks/useHistory'
import Canvas from './Canvas'
import TopNavbar from '../ui/TopNavbar'
import LeftSidebar from '../ui/LeftSidebar'
import RightSidebar from '../ui/RightSidebar'
import BottomToolbar from '../ui/BottomToolbar'
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
  loading?: boolean
}

export default function BoardContent({ board, canEdit, loading }: BoardContentProps) {
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const { saveSnapshot, undo, redo } = useHistory(fabricRef)
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)

  // Stable callback — empty deps, writes into ref directly (no setState)
  const handleCanvasReady = useCallback(
    (ref: React.MutableRefObject<fabric.Canvas | null>) => {
      fabricRef.current = ref.current
    },
    [] // no setState called here, so no re-render triggered
  )

  const handleCanvasMounted = useCallback(() => {
    setCanvasReady(true)
  }, [])

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

  const showLoading = loading || !canvasReady

  useEffect(() => {
    const minimum = window.setTimeout(() => setShowOverlay(false), 300)
    const maximum = window.setTimeout(() => setShowOverlay(false), 1500)
    if (!showLoading) {
      setShowOverlay(false)
    } else {
      setShowOverlay(true)
    }

    return () => {
      window.clearTimeout(minimum)
      window.clearTimeout(maximum)
    }
  }, [showLoading])

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(10,191,188,0.08),_transparent_28%),linear-gradient(180deg,#faf8f4_0%,#f3efe8_100%)] text-[#0d0d0d]">
      <div className={`absolute inset-0 z-[60] bg-[#f7f5f0] transition-opacity duration-300 ${showOverlay ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/[0.08] bg-white/80 px-6 py-5 shadow-[0_18px_45px_rgba(13,13,13,0.08)] backdrop-blur-sm">
            <div className="h-12 w-12 rounded-full border-4 border-[#0ABFBC]/25 border-t-[#0ABFBC] opacity-50 animate-spin" />
            <div className="text-sm font-medium text-[#0d0d0d]/65">Loading board…</div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.08] bg-[#f7f5f0]/90 shadow-[0_10px_30px_rgba(13,13,13,0.06)] backdrop-blur-xl">
        <TopNavbar boardName={board.title || 'Board'} boardId={board.id} canEdit={canEdit} onUndo={handleUndo} onRedo={handleRedo} onClear={handleClear} />
      </div>

      <div className="flex h-full min-h-0 pt-14 sm:pt-14">
        <LeftSidebar />

        <main className="relative min-w-0 flex-1 overflow-hidden p-3 sm:p-4">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(13,13,13,0.08)]">
            <div className="relative min-h-0 flex-1 overflow-hidden bg-[#fbfaf7]">
              <Canvas
                boardId={board.id}
                initialData={board.canvas_data}
                canEdit={canEdit}
                onCanvasReady={handleCanvasReady}
                onReady={handleCanvasMounted}
              />
              <StickyNotesLayer />
            </div>
            <BottomToolbar fabricRef={fabricRef} onUndo={handleUndo} onRedo={handleRedo} onDeleteSelected={handleDeleteSelected} onClear={handleClear} canEdit={canEdit} />
          </div>
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
