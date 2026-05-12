'use client'

import {
  Circle,
  Eraser,
  Hand,
  Minus,
  MousePointer2,
  Pencil,
  RotateCcw,
  RotateCw,
  Square,
  StickyNote,
  Trash,
  Trash2,
  Type,
} from 'lucide-react'
import type { ElementType } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { useCanvasStore } from '@/stores/canvasStore'
import { useStickyStore } from '@/stores/stickyStore'
import type { ToolType } from '@/types/canvas'

interface LeftSidebarProps {
  canEdit: boolean
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onDeleteSelected: () => void
}

const TOOLS: Array<{ type: ToolType; icon: ElementType; label: string; shortcut: string }> = [
  { type: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { type: 'pen', icon: Pencil, label: 'Pen', shortcut: 'P' },
  { type: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { type: 'circle', icon: Circle, label: 'Circle', shortcut: 'O' },
  { type: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { type: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { type: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { type: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
]

export default function LeftSidebar({
  canEdit,
  onUndo,
  onRedo,
  onClear,
  onDeleteSelected,
}: LeftSidebarProps) {
  const {
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
  } = useCanvasStore(
    useShallow((state) => ({
      activeTool: state.activeTool,
      setActiveTool: state.setActiveTool,
      strokeColor: state.strokeColor,
      setStrokeColor: state.setStrokeColor,
      fillColor: state.fillColor,
      setFillColor: state.setFillColor,
      strokeWidth: state.strokeWidth,
      setStrokeWidth: state.setStrokeWidth,
    }))
  )
  const addSticky = useStickyStore(useShallow((state) => state.add))

  if (!canEdit) {
    return (
      <aside className="w-14 shrink-0 border-r border-[#2a2a2a] bg-[#1a1a1a] px-2 py-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2a2a2a] text-xs font-semibold text-white/50" title="View only">
          VO
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-14 shrink-0 overflow-y-auto border-r border-[#2a2a2a] bg-[#1a1a1a] px-2 py-3 text-white">
      <section className="flex flex-col items-center gap-2">
        {TOOLS.map(({ type, icon: Icon, label, shortcut }) => (
          <button
            key={type}
            type="button"
            title={`${label} (${shortcut})`}
            onClick={() => setActiveTool(type)}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/75 transition-colors',
              activeTool === type
                ? 'bg-violet-600 text-white shadow-sm'
                : 'hover:bg-[#2a2a2a] hover:text-white'
            )}
          >
            <Icon size={18} />
          </button>
        ))}
        <button
          type="button"
          title="Sticky note (N)"
          onClick={() => addSticky()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-[#2a2a2a] hover:text-white"
        >
          <StickyNote size={18} />
        </button>
      </section>

      <section className="mt-4 flex flex-col items-center gap-2 border-t border-[#2a2a2a] pt-4">
        <label className="flex items-center justify-between gap-3 text-xs font-medium text-slate-300">
          <input
            aria-label="Stroke color"
            type="color"
            value={strokeColor}
            onChange={(event) => setStrokeColor(event.target.value)}
            className="h-8 w-8 cursor-pointer rounded-full border border-[#2a2a2a] bg-transparent p-1"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-xs font-medium text-slate-300">
          <input
            aria-label="Fill color"
            type="color"
            value={fillColor === 'transparent' ? '#ffffff' : fillColor}
            onChange={(event) => setFillColor(event.target.value)}
            className="h-8 w-8 cursor-pointer rounded-full border border-[#2a2a2a] bg-transparent p-1"
          />
        </label>
        <label className="flex h-24 items-center">
          <input
            aria-label="Stroke width"
            type="range"
            min={1}
            max={48}
            value={strokeWidth}
            onChange={(event) => setStrokeWidth(Number(event.target.value))}
            className="h-2 w-20 rotate-[-90deg] cursor-pointer accent-violet-600"
          />
        </label>
      </section>

      <section className="mt-4 flex flex-col items-center gap-2 border-t border-[#2a2a2a] pt-4">
        <button type="button" onClick={onUndo} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/75 hover:bg-[#2a2a2a] hover:text-white" title="Undo (Ctrl+Z)">
          <RotateCcw size={18} />
        </button>
        <button type="button" onClick={onRedo} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/75 hover:bg-[#2a2a2a] hover:text-white" title="Redo (Ctrl+Shift+Z)">
          <RotateCw size={18} />
        </button>
        <button type="button" onClick={onDeleteSelected} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-rose-300 hover:bg-rose-500/20" title="Delete selected">
          <Trash2 size={18} />
        </button>
        <button type="button" onClick={onClear} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/75 hover:bg-[#2a2a2a] hover:text-white" title="Clear canvas">
          <Trash size={18} />
        </button>
      </section>
    </aside>
  )
}
