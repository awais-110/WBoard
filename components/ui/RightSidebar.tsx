'use client'

import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Settings2,
  Trash2,
  Unlock,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCanvasStore } from '@/stores/canvasStore'
import { cn } from '@/lib/utils'
import type { fabric } from 'fabric'

interface RightSidebarProps {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
  isCollapsed: boolean
  onToggleCollapse: () => void
}

type Tab = 'properties' | 'layers'

export default function RightSidebar({ fabricRef, isCollapsed, onToggleCollapse }: RightSidebarProps) {
  const [tab, setTab] = useState<Tab>('properties')
  const [selected, setSelected] = useState<fabric.Object | null>(null)
  const [layers, setLayers] = useState<fabric.Object[]>([])
  const { strokeColor, setStrokeColor, fillColor, setFillColor, strokeWidth, setStrokeWidth } = useCanvasStore()

  const refresh = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    setLayers([...canvas.getObjects()].reverse())
    setSelected(canvas.getActiveObject() ?? null)
  }, [fabricRef])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const onSelectionChange = () => refresh()
    const onLayerChange = () => refresh()

    canvas.on('selection:created', onSelectionChange)
    canvas.on('selection:updated', onSelectionChange)
    canvas.on('selection:cleared', onSelectionChange)
    canvas.on('object:added', onLayerChange)
    canvas.on('object:removed', onLayerChange)
    canvas.on('object:modified', onLayerChange)
    refresh()

    return () => {
      canvas.off('selection:created', onSelectionChange)
      canvas.off('selection:updated', onSelectionChange)
      canvas.off('selection:cleared', onSelectionChange)
      canvas.off('object:added', onLayerChange)
      canvas.off('object:removed', onLayerChange)
      canvas.off('object:modified', onLayerChange)
    }
  }, [fabricRef, refresh])

  const updateSelected = useCallback((props: Record<string, any>) => {
    const canvas = fabricRef.current
    const object = canvas?.getActiveObject()
    if (!canvas || !object) return
    object.set(props)
    object.setCoords()
    canvas.requestRenderAll()
    canvas.fire('object:modified', { target: object })
  }, [fabricRef])

  const align = useCallback((direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const canvas = fabricRef.current
    if (!canvas) return
    const objects = canvas.getActiveObjects()
    const bounds = canvas.getActiveObject()?.getBoundingRect()
    if (!bounds || objects.length < 2) return

    objects.forEach((object) => {
      if (direction === 'left') object.set({ left: bounds.left })
      if (direction === 'center') object.set({ left: bounds.left + bounds.width / 2 - object.getScaledWidth() / 2 })
      if (direction === 'right') object.set({ left: bounds.left + bounds.width - object.getScaledWidth() })
      if (direction === 'top') object.set({ top: bounds.top })
      if (direction === 'middle') object.set({ top: bounds.top + bounds.height / 2 - object.getScaledHeight() / 2 })
      if (direction === 'bottom') object.set({ top: bounds.top + bounds.height - object.getScaledHeight() })
      object.setCoords()
    })

    canvas.requestRenderAll()
  }, [fabricRef])

  const toggleVisibility = useCallback((object: fabric.Object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    object.set({ visible: !object.visible })
    canvas.requestRenderAll()
    refresh()
  }, [fabricRef, refresh])

  const toggleLock = useCallback((object: fabric.Object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const locked = Boolean((object as any).locked)
    object.set({
      selectable: locked,
      evented: locked,
      lockMovementX: !locked,
      lockMovementY: !locked,
      lockRotation: !locked,
      lockScalingX: !locked,
      lockScalingY: !locked,
      hasControls: locked,
    })
    ;(object as any).locked = !locked
    canvas.requestRenderAll()
    refresh()
  }, [fabricRef, refresh])

  const deleteObj = useCallback((object: fabric.Object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.remove(object)
    canvas.requestRenderAll()
    refresh()
  }, [fabricRef, refresh])

  const duplicateObj = useCallback((object: fabric.Object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    object.clone((cloned: fabric.Object) => {
      cloned.set({ left: (object.left ?? 0) + 20, top: (object.top ?? 0) + 20 })
      ;(cloned as any).id = crypto.randomUUID()
      canvas.add(cloned)
      canvas.setActiveObject(cloned)
      canvas.requestRenderAll()
      refresh()
    })
  }, [fabricRef, refresh])

  const selectLayer = useCallback((object: fabric.Object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setActiveObject(object)
    canvas.requestRenderAll()
    refresh()
  }, [fabricRef, refresh])

  const selectedType = useMemo(() => (selected as any)?.type ?? 'Object', [selected])

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center justify-center rounded-l-2xl border border-r-0 border-black/[0.08] bg-white/90 px-1.5 py-4 text-[#0d0d0d]/50 shadow-[0_14px_30px_rgba(13,13,13,0.08)] backdrop-blur-md hover:text-[#0d0d0d]"
      >
        <ChevronRight size={14} />
      </button>
    )
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-black/[0.08] bg-[#fbfaf7]/90 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-black/[0.08] px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0abfbc]/15 text-[#0abfbc] shadow-sm">
            <Settings2 size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#0d0d0d]">Inspector</div>
            <div className="text-[11px] text-[#0d0d0d]/40">Properties and layers</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-full p-2 text-[#0d0d0d]/45 hover:bg-black/[0.05] hover:text-[#0d0d0d]"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex border-b border-black/[0.08] px-2 pt-2">
        {(['properties', 'layers'] as Tab[]).map((currentTab) => (
          <button
            key={currentTab}
            type="button"
            onClick={() => setTab(currentTab)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold capitalize transition-colors',
              tab === currentTab
                ? 'border-[#0abfbc] text-[#0abfbc]'
                : 'border-transparent text-[#0d0d0d]/45 hover:text-[#0d0d0d]'
            )}
          >
            {currentTab === 'properties' ? <Settings2 size={12} /> : <Layers size={12} />}
            {currentTab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'properties' ? (
          selected ? (
            <div className="space-y-3.5">
              <Section title={`Selected: ${selectedType}`}>
                <div className="grid grid-cols-2 gap-2">
                  <NumInput label="X" value={Math.round(selected.left ?? 0)} onChange={(value) => updateSelected({ left: value })} />
                  <NumInput label="Y" value={Math.round(selected.top ?? 0)} onChange={(value) => updateSelected({ top: value })} />
                  <NumInput label="W" value={Math.round(selected.getScaledWidth())} onChange={(value) => updateSelected({ scaleX: value / Math.max(1, selected.width ?? 1) })} />
                  <NumInput label="H" value={Math.round(selected.getScaledHeight())} onChange={(value) => updateSelected({ scaleY: value / Math.max(1, selected.height ?? 1) })} />
                  <NumInput label="Angle" value={Math.round(selected.angle ?? 0)} onChange={(value) => updateSelected({ angle: value })} />
                  <NumInput label="Opacity" value={Math.round((selected.opacity ?? 1) * 100)} onChange={(value) => updateSelected({ opacity: value / 100 })} />
                </div>
              </Section>

              <Section title="Style">
                <div className="space-y-2">
                  <ColorRow label="Stroke" value={(selected.stroke as string) || strokeColor} onChange={(value) => {
                    setStrokeColor(value)
                    updateSelected({ stroke: value })
                  }} />
                  <ColorRow label="Fill" value={(selected.fill as string) || fillColor} onChange={(value) => {
                    setFillColor(value)
                    updateSelected({ fill: value })
                  }} allowTransparent />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#0d0d0d]/55">
                      <span>Stroke width</span>
                      <span>{strokeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={strokeWidth}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setStrokeWidth(value)
                        updateSelected({ strokeWidth: value })
                      }}
                      className="w-full accent-[#0abfbc]"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Align">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: <AlignLeft size={14} />, dir: 'left' },
                    { icon: <AlignCenter size={14} />, dir: 'center' },
                    { icon: <AlignRight size={14} />, dir: 'right' },
                    { icon: <AlignStartVertical size={14} />, dir: 'top' },
                    { icon: <AlignCenterVertical size={14} />, dir: 'middle' },
                    { icon: <AlignEndVertical size={14} />, dir: 'bottom' },
                  ].map(({ icon, dir }) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => align(dir as any)}
                      className="flex h-9 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#0d0d0d]/55 transition-colors hover:bg-black/[0.05] hover:text-[#0d0d0d]"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Actions">
                <div className="flex gap-2">
                  <ActionButton onClick={() => duplicateObj(selected)}>
                    <Copy size={12} /> Duplicate
                  </ActionButton>
                  <ActionButton danger onClick={() => deleteObj(selected)}>
                    <Trash2 size={12} /> Delete
                  </ActionButton>
                </div>
              </Section>
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center text-center">
              <div className="max-w-[220px]">
                <Settings2 size={24} className="mx-auto mb-3 text-[#0d0d0d]/18" />
                <p className="text-sm font-medium text-[#0d0d0d]/70">Select an object to edit its size, position, and style.</p>
              </div>
            </div>
          )
        ) : (
          <Section title={`Layers (${layers.length})`}>
            {layers.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#0d0d0d]/45">No canvas objects yet.</p>
            ) : (
              <div className="space-y-1">
                {layers.map((object) => {
                  const isSelected = fabricRef.current?.getActiveObjects().includes(object)
                  const locked = Boolean((object as any).locked)
                  return (
                    <div
                      key={(object as any).id ?? `${object.type}-${object.top}-${object.left}`}
                      onClick={() => selectLayer(object)}
                      className={cn(
                        'group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors',
                        isSelected
                          ? 'bg-[#0abfbc]/10 text-[#0d0d0d]'
                          : 'text-[#0d0d0d]/55 hover:bg-black/[0.04] hover:text-[#0d0d0d]'
                      )}
                    >
                      <span className="flex-1 truncate text-xs font-medium capitalize">{(object as any).type}</span>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <LayerAction onClick={(event) => { event.stopPropagation(); toggleVisibility(object) }} title={object.visible !== false ? 'Hide' : 'Show'}>
                          {object.visible !== false ? <Eye size={11} /> : <EyeOff size={11} />}
                        </LayerAction>
                        <LayerAction onClick={(event) => { event.stopPropagation(); toggleLock(object) }} title={locked ? 'Unlock' : 'Lock'}>
                          {locked ? <Lock size={11} /> : <Unlock size={11} />}
                        </LayerAction>
                        <LayerAction danger onClick={(event) => { event.stopPropagation(); deleteObj(object) }} title="Delete">
                          <Trash2 size={11} />
                        </LayerAction>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        )}
      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0d0d0d]/30">{title}</div>
      {children}
    </div>
  )
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-2 py-1.5">
      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#0d0d0d]/32">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full bg-transparent text-sm text-[#0d0d0d] outline-none"
      />
    </div>
  )
}

function ColorRow({
  label,
  value,
  onChange,
  allowTransparent,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  allowTransparent?: boolean
}) {
  const transparent = value === 'transparent'
  const inputId = `${label.toLowerCase()}-color`

  return (
    <div className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-white px-3 py-2">
      <span className="text-xs text-[#0d0d0d]/55">{label}</span>
      <div className="flex items-center gap-2">
        {allowTransparent && (
          <button
            type="button"
            onClick={() => onChange('transparent')}
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
              transparent ? 'bg-[#0abfbc]/15 text-[#0abfbc]' : 'text-[#0d0d0d]/45 hover:bg-black/[0.05]'
            )}
          >
            None
          </button>
        )}
        <button type="button" onClick={() => document.getElementById(inputId)?.click()} className="relative h-6 w-6 overflow-hidden rounded-md border border-black/[0.08]">
          <span className="absolute inset-0" style={{ backgroundColor: transparent ? '#ffffff' : value }} />
          {transparent && (
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 24 24">
              <line x1="3" y1="21" x2="21" y2="3" stroke="#ef4444" strokeWidth="2" />
            </svg>
          )}
        </button>
        <input
          id={inputId}
          type="color"
          value={transparent ? '#ffffff' : value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute h-0 w-0 opacity-0"
        />
      </div>
    </div>
  )
}

function ActionButton({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
        danger ? 'text-red-400 hover:bg-red-50' : 'border border-black/[0.08] bg-white text-[#0d0d0d]/70 hover:bg-black/[0.05] hover:text-[#0d0d0d]'
      )}
    >
      {children}
    </button>
  )
}

function LayerAction({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  title?: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
        danger ? 'text-red-400 hover:bg-red-50' : 'text-[#0d0d0d]/50 hover:bg-black/[0.05] hover:text-[#0d0d0d]'
      )}
    >
      {children}
    </button>
  )
}
