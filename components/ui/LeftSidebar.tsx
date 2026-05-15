'use client'

import { ArrowRight, Circle, MousePointer2, Pencil, Square, Type } from 'lucide-react'
import type { ElementType } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { useCanvasStore } from '@/stores/canvasStore'
import type { ToolType } from '@/types/canvas'

const TOOLS: Array<{ type: ToolType; icon: ElementType; label: string; shortcut: string }> = [
  { type: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { type: 'pen', icon: Pencil, label: 'Pen', shortcut: 'P' },
  { type: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { type: 'circle', icon: Circle, label: 'Circle', shortcut: 'O' },
  { type: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  { type: 'text', icon: Type, label: 'Text', shortcut: 'T' },
]

export default function LeftSidebar() {
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

  return (
    <aside className="flex w-[76px] shrink-0 flex-col border-r border-black/[0.08] bg-[#fbfaf7]/90 px-2 py-2.5 backdrop-blur-md">
      <div className="mt-2.5 rounded-[18px] border border-black/[0.08] bg-white/80 p-1.5 shadow-[0_10px_28px_rgba(13,13,13,0.04)]">
        <div className="flex flex-col items-center gap-1">
          {TOOLS.map(({ type, icon: Icon, label, shortcut }) => (
            <ToolBtn
              key={type}
              active={activeTool === type}
              onClick={() => setActiveTool(type)}
              title={`${label} (${shortcut})`}
            >
              <Icon size={15} />
            </ToolBtn>
          ))}
        </div>
      </div>

      <div className="mt-2 rounded-[18px] border border-black/[0.08] bg-white/80 p-1.5 shadow-[0_10px_28px_rgba(13,13,13,0.04)]">
        <div className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#0d0d0d]/30">Style</div>
        <div className="flex flex-col items-center gap-2">
          <ColorPicker label="Stroke" value={strokeColor} onChange={setStrokeColor} transparent={false} />
          <ColorPicker label="Fill" value={fillColor} onChange={setFillColor} transparent={fillColor === 'transparent'} allowTransparent />
          <div className="flex flex-col items-center gap-1">
            {[1, 2, 4, 8].map((width) => (
              <button
                key={width}
                type="button"
                onClick={() => setStrokeWidth(width)}
                title={`${width}px`}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border transition-all',
                  strokeWidth === width
                    ? 'border-[#0abfbc]/30 bg-[#0abfbc]/15 text-[#0abfbc] shadow-sm'
                    : 'border-black/[0.08] bg-white/90 text-[#0d0d0d]/60 hover:bg-black/[0.05]'
                )}
              >
                <span className="rounded-full bg-current" style={{ width: Math.max(2, width * 1.4), height: Math.max(2, width * 1.4) }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

function ToolBtn({
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
        'flex h-9 w-9 items-center justify-center rounded-[16px] transition-all duration-150',
        danger
          ? 'text-red-400 hover:bg-red-50 hover:text-red-500'
          : active
          ? 'bg-[#0abfbc] text-white shadow-[0_12px_24px_rgba(10,191,188,0.25)]'
          : 'text-[#0d0d0d]/50 hover:bg-black/[0.05] hover:text-[#0d0d0d]'
      )}
    >
      {children}
    </button>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
  transparent,
  allowTransparent,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  transparent: boolean
  allowTransparent?: boolean
}) {
  const inputId = `${label.toLowerCase()}-picker`

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#0d0d0d]/32">{label}</div>
      <div className="relative h-7 w-7 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_10px_18px_rgba(13,13,13,0.04)]">
        <button
          type="button"
          onClick={() => document.getElementById(inputId)?.click()}
          className="absolute inset-0"
          aria-label={label}
        >
          <span className="absolute inset-0" style={{ backgroundColor: transparent ? '#ffffff' : value }} />
          {transparent && (
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 32 32">
              <line x1="4" y1="28" x2="28" y2="4" stroke="#ef4444" strokeWidth="2" />
            </svg>
          )}
        </button>
        <input
          id={inputId}
          type="color"
          value={transparent ? '#ffffff' : value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      {allowTransparent && (
        <button
          type="button"
          onClick={() => onChange('transparent')}
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
            transparent
              ? 'bg-[#0abfbc]/15 text-[#0abfbc]'
              : 'text-[#0d0d0d]/45 hover:bg-black/[0.05]'
          )}
        >
          Transparent
        </button>
      )}
    </div>
  )
}
