'use client'

import { useCanvasStore } from '@/stores/canvasStore'
import { useHistory } from '@/hooks/useHistory'
import {
  MousePointer2, Pencil, Square, Circle, Triangle, Minus,
  Type, StickyNote, Eraser, Hand, Image, ArrowRight,
  Diamond, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Grid3x3,
  Magnet, Trash2
} from 'lucide-react'
import type { fabric } from 'fabric'
import type { ToolType } from '@/types/canvas'
import { cn } from '@/lib/utils'
import { useRef, useState } from 'react'

interface BottomToolbarProps {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
  onUndo: () => void
  onRedo: () => void
  onDeleteSelected?: () => void
}

const TOOLS: { id: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: 'select', icon: <MousePointer2 size={16} />, label: 'Select', shortcut: 'V' },
  { id: 'pen', icon: <Pencil size={16} />, label: 'Pen', shortcut: 'P' },
  { id: 'rectangle', icon: <Square size={16} />, label: 'Rectangle', shortcut: 'R' },
  { id: 'circle', icon: <Circle size={16} />, label: 'Circle', shortcut: 'O' },
  { id: 'triangle', icon: <Triangle size={16} />, label: 'Triangle', shortcut: 'T' },
  { id: 'diamond', icon: <Diamond size={16} />, label: 'Diamond', shortcut: '' },
  { id: 'arrow', icon: <ArrowRight size={16} />, label: 'Arrow', shortcut: '' },
  { id: 'line', icon: <Minus size={16} />, label: 'Line', shortcut: 'L' },
  { id: 'text', icon: <Type size={16} />, label: 'Text', shortcut: 'T' },
  { id: 'sticky', icon: <StickyNote size={16} />, label: 'Sticky', shortcut: '' },
  { id: 'image', icon: <Image size={16} />, label: 'Image', shortcut: '' },
  { id: 'eraser', icon: <Eraser size={16} />, label: 'Eraser', shortcut: 'E' },
  { id: 'pan', icon: <Hand size={16} />, label: 'Pan', shortcut: 'H' },
]

export default function BottomToolbar({ fabricRef, onUndo, onRedo, onDeleteSelected }: BottomToolbarProps) {
  const { activeTool, setActiveTool, showGrid, snapToGrid, toggleGrid, toggleSnap,
    strokeColor, setStrokeColor, fillColor, setFillColor, strokeWidth, setStrokeWidth } = useCanvasStore()
  const [zoom, setZoom] = useState(100)
  const strokeInputRef = useRef<HTMLInputElement>(null)
  const fillInputRef = useRef<HTMLInputElement>(null)

  const handleZoomIn = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const z = Math.min(500, Math.round(canvas.getZoom() * 110))
    canvas.setZoom(z / 100)
    canvas.requestRenderAll()
    setZoom(z)
  }

  const handleZoomOut = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const z = Math.max(10, Math.round(canvas.getZoom() * 91))
    canvas.setZoom(z / 100)
    canvas.requestRenderAll()
    setZoom(z)
  }

  const handleZoomFit = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.setZoom(1)
    canvas.requestRenderAll()
    setZoom(100)
  }

  return (
    <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]/95 px-3 py-2 shadow-2xl backdrop-blur-xl">

        {/* Tools */}
        <div className="flex items-center gap-0.5">
          {TOOLS.map((tool) => (
            <Tooltip key={tool.id} label={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}>
              <button
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150',
                  activeTool === tool.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-white/60 hover:bg-[#2a2a2a] hover:text-white'
                )}
              >
                {tool.icon}
              </button>
            </Tooltip>
          ))}
        </div>

        <div className="h-6 w-px bg-[#2a2a2a]" />

        {/* Colors */}
        <div className="flex items-center gap-2">
          <Tooltip label="Stroke color">
            <div className="relative">
              <button
                onClick={() => strokeInputRef.current?.click()}
                className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-white/20 shadow-inner"
                style={{ backgroundColor: strokeColor }}
              />
              <input
                ref={strokeInputRef}
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </Tooltip>

          <Tooltip label="Fill color">
            <div className="relative">
              <button
                onClick={() => fillInputRef.current?.click()}
                className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-white/20"
                style={{ backgroundColor: fillColor === 'transparent' ? '#ffffff' : fillColor }}
              >
                {fillColor === 'transparent' && (
                  <svg className="absolute inset-0 h-full w-full rounded-lg" viewBox="0 0 28 28">
                    <line x1="0" y1="28" x2="28" y2="0" stroke="#ef4444" strokeWidth="2" />
                  </svg>
                )}
              </button>
              <input
                ref={fillInputRef}
                type="color"
                value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </Tooltip>

          {/* Stroke width */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 4, 8].map((w) => (
              <Tooltip key={w} label={`${w}px`}>
                <button
                  onClick={() => setStrokeWidth(w)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                    strokeWidth === w ? 'bg-[#2a2a2a] ring-1 ring-violet-500' : 'hover:bg-[#1a1a1a]'
                  )}
                >
                  <div className="rounded-full bg-white" style={{ width: Math.max(2, w * 1.5), height: Math.max(2, w * 1.5) }} />
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-[#2a2a2a]" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip label="Undo (Ctrl+Z)">
            <button onClick={onUndo} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-[#2a2a2a] hover:text-white">
              <Undo2 size={16} />
            </button>
          </Tooltip>
          <Tooltip label="Redo (Ctrl+Shift+Z)">
            <button onClick={onRedo} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-[#2a2a2a] hover:text-white">
              <Redo2 size={16} />
            </button>
          </Tooltip>
        </div>

        <div className="h-6 w-px bg-[#2a2a2a]" />

        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <Tooltip label="Zoom out">
            <button onClick={handleZoomOut} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-[#2a2a2a] hover:text-white">
              <ZoomOut size={16} />
            </button>
          </Tooltip>
          <button onClick={handleZoomFit} className="min-w-[52px] rounded-lg px-2 py-1 text-xs font-mono font-medium text-white/60 transition-all hover:bg-[#2a2a2a] hover:text-white">
            {zoom}%
          </button>
          <Tooltip label="Zoom in">
            <button onClick={handleZoomIn} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-[#2a2a2a] hover:text-white">
              <ZoomIn size={16} />
            </button>
          </Tooltip>
          <Tooltip label="Fit to screen">
            <button onClick={handleZoomFit} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-[#2a2a2a] hover:text-white">
              <Maximize2 size={16} />
            </button>
          </Tooltip>
        </div>

        <div className="h-6 w-px bg-[#2a2a2a]" />

        {/* Grid & Snap */}
        <div className="flex items-center gap-0.5">
          <Tooltip label="Toggle grid">
            <button
              onClick={toggleGrid}
              className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-all', showGrid ? 'bg-violet-600/20 text-violet-400' : 'text-white/60 hover:bg-[#2a2a2a] hover:text-white')}
            >
              <Grid3x3 size={16} />
            </button>
          </Tooltip>
          <Tooltip label="Snap to grid">
            <button
              onClick={toggleSnap}
              className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-all', snapToGrid ? 'bg-violet-600/20 text-violet-400' : 'text-white/60 hover:bg-[#2a2a2a] hover:text-white')}
            >
              <Magnet size={16} />
            </button>
          </Tooltip>
        </div>

        {onDeleteSelected && (
          <>
            <div className="h-6 w-px bg-[#2a2a2a]" />
            <Tooltip label="Delete selected">
              <button onClick={onDeleteSelected} className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-400/70 transition-all hover:bg-rose-500/10 hover:text-rose-400">
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  )
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1a1a1a] px-2 py-1 text-xs text-white/80 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
        {label}
      </div>
    </div>
  )
}