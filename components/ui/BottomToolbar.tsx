'use client'

import { Maximize2, Minus, Plus, RotateCcw, RotateCw, Eraser, StickyNote, Trash2, Trash } from 'lucide-react'
import { fabric } from 'fabric'
import { useShallow } from 'zustand/react/shallow'
import { useCanvasStore } from '@/stores/canvasStore'
import { useStickyStore } from '@/stores/stickyStore'
import { cn } from '@/lib/utils'

interface BottomToolbarProps {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
  onUndo?: () => void
  onRedo?: () => void
  onDeleteSelected?: () => void
  onClear?: () => void
  canEdit?: boolean
}

export default function BottomToolbar({
  fabricRef,
  onUndo,
  onRedo,
  onDeleteSelected,
  onClear,
  canEdit = false,
}: BottomToolbarProps) {
  const zoom = useCanvasStore((state) => state.zoom)
  const setZoom = useCanvasStore((state) => state.setZoom)
  const setActiveTool = useCanvasStore((state) => state.setActiveTool)
  const addSticky = useStickyStore(useShallow((state) => state.add))

  const updateZoom = (nextZoom: number) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const clamped = clampZoom(nextZoom)
    canvas.zoomToPoint(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2), clamped)
    canvas.requestRenderAll()
    setZoom(clamped)
  }

  const handleZoomIn = () => updateZoom(zoom / 0.95)
  const handleZoomOut = () => updateZoom(zoom * 0.95)
  const handleReset = () => updateZoom(1)
  const handleFit = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.setZoom(1)
    canvas.requestRenderAll()
    setZoom(1)
  }

  const handleSticky = () => {
    if (!canEdit) return
    setActiveTool('sticky')
    addSticky()
  }

  const handleEraser = () => {
    if (!canEdit) return
    setActiveTool('eraser')
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 hidden justify-center px-3 md:flex">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white/92 px-2 py-1.5 shadow-[0_16px_40px_rgba(13,13,13,0.08)] backdrop-blur-xl">
        {canEdit && (
          <DockGroup>
            <DockBtn onClick={handleSticky} title="Sticky note" active>
              <StickyNote size={13} />
            </DockBtn>
            <DockBtn onClick={handleEraser} title="Eraser">
              <Eraser size={13} />
            </DockBtn>
          </DockGroup>
        )}

        {canEdit && (onUndo || onRedo || onDeleteSelected || onClear) && <DockDivider />}

        {canEdit && (
          <DockGroup>
            <DockBtn onClick={onUndo} title="Undo">
              <RotateCcw size={13} />
            </DockBtn>
            <DockBtn onClick={onRedo} title="Redo">
              <RotateCw size={13} />
            </DockBtn>
            <DockBtn onClick={onDeleteSelected} title="Delete selection" danger>
              <Trash2 size={13} />
            </DockBtn>
            <DockBtn onClick={onClear} title="Clear canvas" danger>
              <Trash size={13} />
            </DockBtn>
          </DockGroup>
        )}

        <DockDivider />

        <div className="flex items-center gap-1">
          <ZoomBtn onClick={handleZoomOut} title="Zoom out">
            <Minus size={13} />
          </ZoomBtn>

          <button
            type="button"
            onClick={handleReset}
            title="Reset zoom"
            className="min-w-[58px] rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums text-[#0d0d0d]/65 transition-colors hover:bg-black/[0.05] hover:text-[#0d0d0d]"
          >
            {Math.round(zoom * 100)}%
          </button>

          <ZoomBtn onClick={handleZoomIn} title="Zoom in">
            <Plus size={13} />
          </ZoomBtn>

          <DockDivider compact />

          <ZoomBtn onClick={handleFit} title="Fit to screen">
            <Maximize2 size={13} />
          </ZoomBtn>
        </div>
      </div>
    </div>
  )
}

function DockGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>
}

function DockDivider({ compact = false }: { compact?: boolean }) {
  return <div className={cn('mx-0.5 w-px bg-black/10', compact ? 'h-3.5' : 'h-5')} />
}

function ZoomBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full text-[#0d0d0d]/50 transition-all hover:bg-black/[0.05] hover:text-[#0d0d0d]'
      )}
    >
      {children}
    </button>
  )
}

function DockBtn({
  children,
  onClick,
  title,
  active,
  danger,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full transition-all',
        danger
          ? 'text-red-400 hover:bg-red-50 hover:text-red-500'
          : active
          ? 'bg-[#0abfbc]/15 text-[#0abfbc]'
          : 'text-[#0d0d0d]/50 hover:bg-black/[0.05] hover:text-[#0d0d0d]'
      )}
    >
      {children}
    </button>
  )
}

function clampZoom(value: number): number {
  return Math.min(5, Math.max(0.05, value))
}
