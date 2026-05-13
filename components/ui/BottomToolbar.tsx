'use client'

import { useCallback, useEffect, useState, type ElementType } from 'react'
import { Circle, Maximize2, Minus, MousePointer2, Pencil, RotateCcw, RotateCw, Square, Type, ZoomIn, ZoomOut } from 'lucide-react'
import { fabric } from 'fabric'
import { useShallow } from 'zustand/react/shallow'
import { useCanvasStore } from '@/stores/canvasStore'
import { cn } from '@/lib/utils'
import type { ToolType } from '@/types/canvas'

interface BottomToolbarProps {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
  onUndo: () => void
  onRedo: () => void
}

const QUICK_TOOLS: Array<{ type: ToolType; icon: ElementType; label: string }> = [
  { type: 'select', icon: MousePointer2, label: 'Select' },
  { type: 'pen', icon: Pencil, label: 'Pen' },
  { type: 'rectangle', icon: Square, label: 'Rectangle' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'line', icon: Minus, label: 'Line' },
  { type: 'text', icon: Type, label: 'Text' },
]

export default function BottomToolbar({ fabricRef, onUndo, onRedo }: BottomToolbarProps) {
  const [zoom, setZoom] = useState(1)
  const {
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
  } = useCanvasStore(
    useShallow((state) => ({
      activeTool: state.activeTool,
      setActiveTool: state.setActiveTool,
      strokeColor: state.strokeColor,
      setStrokeColor: state.setStrokeColor,
      fillColor: state.fillColor,
      setFillColor: state.setFillColor,
    }))
  )

  const refreshZoom = useCallback(() => {
    const canvas = fabricRef.current
    if (canvas) setZoom(canvas.getZoom())
  }, [fabricRef])

  useEffect(() => {
    refreshZoom()
    window.addEventListener('whiteboard:zoom-changed', refreshZoom)
    return () => window.removeEventListener('whiteboard:zoom-changed', refreshZoom)
  }, [refreshZoom])

  const setCanvasZoom = (nextZoom: number) => {
    const canvas = fabricRef.current
    if (!canvas) return

    const clamped = Math.min(4, Math.max(0.2, nextZoom))
    const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2)
    canvas.zoomToPoint(center, clamped)
    canvas.requestRenderAll()
    setZoom(clamped)
  }

  const fitToWindow = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.setZoom(1)
    canvas.requestRenderAll()
    setZoom(1)
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-2 sm:bottom-5 sm:px-4">
      <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a]/95 px-2 py-2 text-white shadow-2xl backdrop-blur [scrollbar-width:none] sm:rounded-full [&::-webkit-scrollbar]:hidden">
        {QUICK_TOOLS.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveTool(type)}
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-10 sm:w-10 sm:rounded-lg',
              activeTool === type ? 'bg-violet-600 text-white' : 'text-white/70 hover:bg-[#2a2a2a] hover:text-white'
            )}
            title={label}
          >
            <Icon size={18} />
          </button>
        ))}
        <div className="mx-1 h-7 w-px shrink-0 bg-[#2a2a2a]" />
        <label className="relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl hover:bg-[#2a2a2a] sm:h-10 sm:w-10 sm:rounded-lg" title="Stroke color">
          <span className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: strokeColor }} />
          <input aria-label="Stroke color" type="color" value={strokeColor} onChange={(event) => setStrokeColor(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <label className="relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl hover:bg-[#2a2a2a] sm:h-10 sm:w-10 sm:rounded-lg" title="Fill color">
          <span className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: fillColor === 'transparent' ? '#ffffff' : fillColor }} />
          <input aria-label="Fill color" type="color" value={fillColor === 'transparent' ? '#ffffff' : fillColor} onChange={(event) => setFillColor(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <div className="mx-1 h-7 w-px shrink-0 bg-[#2a2a2a]" />
        <button type="button" onClick={onUndo} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white sm:h-10 sm:w-10 sm:rounded-lg" title="Undo">
          <RotateCcw size={18} />
        </button>
        <button type="button" onClick={onRedo} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white sm:h-10 sm:w-10 sm:rounded-lg" title="Redo">
          <RotateCw size={18} />
        </button>
        <div className="mx-1 hidden h-7 w-px shrink-0 bg-[#2a2a2a] sm:block" />
        <button
          type="button"
          onClick={() => setCanvasZoom(zoom / 1.1)}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white sm:inline-flex"
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <div className="hidden min-w-16 shrink-0 rounded-lg bg-[#0f0f0f] px-3 py-2 text-center text-sm font-semibold text-white/80 sm:block">
          {Math.round(zoom * 100)}%
        </div>
        <button
          type="button"
          onClick={() => setCanvasZoom(zoom * 1.1)}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white sm:inline-flex"
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <div className="h-7 w-px shrink-0 bg-[#2a2a2a]" />
        <button
          type="button"
          onClick={fitToWindow}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white sm:h-10 sm:w-10 sm:rounded-lg"
          title="Fit canvas"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  )
}
