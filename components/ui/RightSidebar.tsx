'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Copy, Eye, EyeOff, Layers, Sliders, Trash2 } from 'lucide-react'
import type { fabric } from 'fabric'

interface RightSidebarProps {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface CanvasLayer {
  id: string
  label: string
  visible: boolean
  object: fabric.Object
}

interface SelectionProperties {
  type: string
  left: number
  top: number
  width: number
  height: number
  fill: string
  stroke: string
}

export default function RightSidebar({ fabricRef, isCollapsed, onToggleCollapse }: RightSidebarProps) {
  const [selected, setSelected] = useState<SelectionProperties | null>(null)
  const [layers, setLayers] = useState<CanvasLayer[]>([])

  const refresh = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const active = canvas.getActiveObject()
    setSelected(active ? getSelectionProperties(active) : null)
    setLayers(
      canvas.getObjects().map((object, index) => ({
        id: getObjectId(object, index),
        label: `${object.type ?? 'object'} ${index + 1}`,
        visible: object.visible !== false,
        object,
      })).reverse()
    )
  }, [fabricRef])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) {
      const timer = window.setTimeout(refresh, 150)
      return () => window.clearTimeout(timer)
    }

    const events = [
      'selection:created',
      'selection:updated',
      'selection:cleared',
      'object:added',
      'object:removed',
      'object:modified',
      'object:moving',
      'object:scaling',
    ] as const

    events.forEach((eventName) => canvas.on(eventName, refresh))
    refresh()

    return () => {
      events.forEach((eventName) => canvas.off(eventName, refresh))
    }
  }, [fabricRef, refresh])

  const duplicateSelected = () => {
    const canvas = fabricRef.current
    const active = canvas?.getActiveObject()
    if (!canvas || !active) return

    active.clone((clone: fabric.Object) => {
      clone.set({
        left: (active.left ?? 0) + 24,
        top: (active.top ?? 0) + 24,
        evented: true,
        visible: true,
      })
      ;(clone as fabric.Object & { id?: string }).id = crypto.randomUUID()
      canvas.add(clone)
      canvas.setActiveObject(clone)
      canvas.requestRenderAll()
      refresh()
    }, ['id'])
  }

  const deleteSelected = () => {
    const canvas = fabricRef.current
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (!activeObjects.length) return
    canvas.discardActiveObject()
    activeObjects.forEach((object) => canvas.remove(object))
    canvas.requestRenderAll()
    refresh()
  }

  const toggleLayer = (layer: CanvasLayer) => {
    const canvas = fabricRef.current
    if (!canvas) return

    layer.object.set('visible', layer.object.visible === false)
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    refresh()
  }

  if (isCollapsed) {
    return (
      <aside className="relative hidden w-14 shrink-0 border-l border-[#2a2a2a] bg-[#1a1a1a] shadow-sm transition-all duration-200 lg:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -left-4 top-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-white/70 shadow-sm transition-colors hover:bg-[#2a2a2a] hover:text-white"
          title="Expand inspector"
          aria-label="Expand inspector"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex h-full flex-col items-center gap-3 px-2 py-4">
          <Sliders size={18} className="text-white/55" />
          <div className="h-px w-8 bg-[#2a2a2a]" />
          <div className="flex rotate-90 items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-white/45">
            Inspector
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="relative hidden w-[280px] shrink-0 overflow-y-auto border-l border-[#2a2a2a] bg-[#1a1a1a] p-4 text-white shadow-sm transition-all duration-200 lg:block">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute -left-4 top-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-white/70 shadow-sm transition-colors hover:bg-[#2a2a2a] hover:text-white"
        title="Collapse inspector"
        aria-label="Collapse inspector"
      >
        <ChevronRight size={16} />
      </button>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Inspector</p>
          <h2 className="text-sm font-semibold text-white">Properties</h2>
        </div>
        <Sliders size={18} className="text-white/45" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={duplicateSelected}
          disabled={!selected}
          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] text-sm font-medium text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy size={16} />
          Duplicate
        </button>
        <button
          type="button"
          onClick={deleteSelected}
          disabled={!selected}
          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      <section className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f]/80 p-3 backdrop-blur">
        <h3 className="text-sm font-semibold text-white">Selection</h3>
        {selected ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Property label="Type" value={selected.type} />
            <Property label="Fill" value={selected.fill} swatch={selected.fill} />
            <Property label="X" value={`${selected.left}px`} />
            <Property label="Y" value={`${selected.top}px`} />
            <Property label="Width" value={`${selected.width}px`} />
            <Property label="Height" value={`${selected.height}px`} />
            <Property label="Stroke" value={selected.stroke} swatch={selected.stroke} />
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-[#3a3a3a] bg-[#1a1a1a] p-3 text-sm text-white/50">
            Select an object to inspect its size, position, and colors.
          </div>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f]/80 p-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers size={16} />
            Layers
          </h3>
          <span className="text-xs font-medium text-white/50">{layers.length}</span>
        </div>
        <div className="mt-3 space-y-2">
          {layers.length === 0 ? (
            <p className="rounded-lg bg-[#1a1a1a] p-3 text-sm text-white/50">No canvas objects yet.</p>
          ) : (
            layers.map((layer) => (
              <div key={layer.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2">
                <span className="truncate text-sm font-medium text-white/75">{layer.label}</span>
                <button
                  type="button"
                  onClick={() => toggleLayer(layer)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:bg-[#2a2a2a] hover:text-white"
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  )
}

function Property({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-2">
      <div className="text-[11px] font-medium text-white/45">{label}</div>
      <div className="mt-1 flex items-center gap-2 truncate font-semibold text-white">
        {swatch && swatch !== 'transparent' ? (
          <span className="h-3 w-3 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: swatch }} />
        ) : null}
        <span className="truncate">{value || 'None'}</span>
      </div>
    </div>
  )
}

function getSelectionProperties(object: fabric.Object): SelectionProperties {
  const bounds = object.getBoundingRect(true, true)
  const fill = normalizePaint(object.get('fill'))
  const stroke = normalizePaint(object.get('stroke'))

  return {
    type: object.type ?? 'object',
    left: Math.round(bounds.left),
    top: Math.round(bounds.top),
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
    fill,
    stroke,
  }
}

function getObjectId(object: fabric.Object, index: number): string {
  return (object as fabric.Object & { id?: string }).id ?? `${object.type ?? 'object'}-${index}`
}

function normalizePaint(value: unknown): string {
  return typeof value === 'string' ? value : 'transparent'
}
