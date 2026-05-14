'use client'

import { useEffect, useState, useCallback } from 'react'
import { useCanvasStore } from '@/stores/canvasStore'
import { ChevronRight, Layers, Settings2, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Eye, EyeOff, Lock, Unlock, Trash2, Copy } from 'lucide-react'
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
  const [, forceUpdate] = useState(0)
  const { strokeColor, setStrokeColor, fillColor, setFillColor, strokeWidth, setStrokeWidth, opacity, setOpacity } = useCanvasStore()

  const refresh = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    setLayers([...canvas.getObjects()].reverse())
    setSelected(canvas.getActiveObject() ?? null)
    forceUpdate((n) => n + 1)
  }, [fabricRef])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.on('selection:created', refresh)
    canvas.on('selection:updated', refresh)
    canvas.on('selection:cleared', refresh)
    canvas.on('object:added', refresh)
    canvas.on('object:removed', refresh)
    canvas.on('object:modified', refresh)
    return () => {
      canvas.off('selection:created', refresh)
      canvas.off('selection:updated', refresh)
      canvas.off('selection:cleared', refresh)
      canvas.off('object:added', refresh)
      canvas.off('object:removed', refresh)
      canvas.off('object:modified', refresh)
    }
  }, [fabricRef, refresh])

  const updateSelected = (props: Record<string, any>) => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (!obj) return
    obj.set(props)
    obj.setCoords()
    canvas?.requestRenderAll()
    canvas?.fire('object:modified', { target: obj })
  }

  const align = (dir: string) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const objs = canvas.getActiveObjects()
    const bounds = canvas.getActiveObject()?.getBoundingRect()
    if (!bounds || objs.length < 2) return
    objs.forEach((obj) => {
      if (dir === 'left') obj.set({ left: bounds.left })
      if (dir === 'center') obj.set({ left: bounds.left + bounds.width / 2 - (obj.getScaledWidth() / 2) })
      if (dir === 'right') obj.set({ left: bounds.left + bounds.width - obj.getScaledWidth() })
      if (dir === 'top') obj.set({ top: bounds.top })
      if (dir === 'middle') obj.set({ top: bounds.top + bounds.height / 2 - (obj.getScaledHeight() / 2) })
      if (dir === 'bottom') obj.set({ top: bounds.top + bounds.height - obj.getScaledHeight() })
      obj.setCoords()
    })
    canvas.requestRenderAll()
  }

  const toggleVisibility = (obj: fabric.Object) => {
    obj.set({ visible: !obj.visible })
    fabricRef.current?.requestRenderAll()
    refresh()
  }

  const toggleLock = (obj: fabric.Object) => {
    const locked = (obj as any)._locked
    obj.set({
      selectable: locked,
      evented: locked,
      lockMovementX: !locked,
      lockMovementY: !locked,
    });
    (obj as any)._locked = !locked
    fabricRef.current?.requestRenderAll()
    refresh()
  }

  const deleteObj = (obj: fabric.Object) => {
    fabricRef.current?.remove(obj)
    fabricRef.current?.requestRenderAll()
    refresh()
  }

  const duplicateObj = (obj: fabric.Object) => {
    obj.clone((cloned: fabric.Object) => {
      cloned.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 })
      ;(cloned as any).id = crypto.randomUUID()
      fabricRef.current?.add(cloned)
      fabricRef.current?.setActiveObject(cloned)
      fabricRef.current?.requestRenderAll()
      refresh()
    })
  }

  const selectLayer = (obj: fabric.Object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setActiveObject(obj)
    canvas.requestRenderAll()
    refresh()
  }

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-[#2a2a2a] bg-[#0f0f0f] px-1.5 py-4 text-white/60 hover:text-white transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    )
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-[#2a2a2a] bg-[#0f0f0f] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a]">
        {(['properties', 'layers'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium capitalize transition-colors',
              tab === t ? 'border-b-2 border-violet-500 text-white' : 'text-white/50 hover:text-white'
            )}
          >
            {t === 'properties' ? <Settings2 size={12} /> : <Layers size={12} />}
            {t}
          </button>
        ))}
        <button onClick={onToggleCollapse} className="px-2 text-white/40 hover:text-white transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {tab === 'properties' ? (
          <>
            {selected ? (
              <>
                <Section title="Position & Size">
                  <div className="grid grid-cols-2 gap-2">
                    <NumInput label="X" value={Math.round(selected.left ?? 0)} onChange={(v) => updateSelected({ left: v })} />
                    <NumInput label="Y" value={Math.round(selected.top ?? 0)} onChange={(v) => updateSelected({ top: v })} />
                    <NumInput label="W" value={Math.round((selected.width ?? 0) * (selected.scaleX ?? 1))} onChange={(v) => updateSelected({ scaleX: v / (selected.width ?? 1) })} />
                    <NumInput label="H" value={Math.round((selected.height ?? 0) * (selected.scaleY ?? 1))} onChange={(v) => updateSelected({ scaleY: v / (selected.height ?? 1) })} />
                    <NumInput label="°" value={Math.round(selected.angle ?? 0)} onChange={(v) => updateSelected({ angle: v })} />
                    <NumInput label="%" value={Math.round((selected.opacity ?? 1) * 100)} onChange={(v) => updateSelected({ opacity: v / 100 })} />
                  </div>
                </Section>

                <Section title="Style">
                  <div className="space-y-2">
                    <ColorRow label="Stroke" value={(selected.stroke as string) || '#000000'} onChange={(v) => updateSelected({ stroke: v })} />
                    <ColorRow label="Fill" value={(selected.fill as string) || 'transparent'} onChange={(v) => updateSelected({ fill: v })} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Stroke width</span>
                      <input
                        type="range" min={1} max={20} value={selected.strokeWidth ?? 2}
                        onChange={(e) => updateSelected({ strokeWidth: Number(e.target.value) })}
                        className="w-24 accent-violet-500"
                      />
                    </div>
                  </div>
                </Section>

                <Section title="Align">
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { icon: <AlignLeft size={14} />, dir: 'left' },
                      { icon: <AlignCenter size={14} />, dir: 'center' },
                      { icon: <AlignRight size={14} />, dir: 'right' },
                      { icon: <AlignStartVertical size={14} />, dir: 'top' },
                      { icon: <AlignCenterVertical size={14} />, dir: 'middle' },
                      { icon: <AlignEndVertical size={14} />, dir: 'bottom' },
                    ].map(({ icon, dir }) => (
                      <button key={dir} onClick={() => align(dir)} className="flex items-center justify-center rounded-lg border border-[#2a2a2a] py-1.5 text-white/60 hover:bg-[#1a1a1a] hover:text-white transition-colors">
                        {icon}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Actions">
                  <div className="flex gap-2">
                    <button onClick={() => duplicateObj(selected)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#2a2a2a] py-2 text-xs text-white/60 hover:bg-[#1a1a1a] hover:text-white transition-colors">
                      <Copy size={12} /> Duplicate
                    </button>
                    <button onClick={() => deleteObj(selected)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-xs text-rose-400 hover:bg-rose-500/20 transition-colors">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </Section>
              </>
            ) : (
              <div className="flex h-32 items-center justify-center text-center">
                <div>
                  <Settings2 size={24} className="mx-auto mb-2 text-white/20" />
                  <p className="text-xs text-white/40">Select an object to inspect its size, position, and colors.</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Section title={`Layers (${layers.length})`}>
              {layers.length === 0 ? (
                <p className="text-center text-xs text-white/40 py-4">No canvas objects yet.</p>
              ) : (
                <div className="space-y-1">
                  {layers.map((obj, i) => {
                    const isSelected = fabricRef.current?.getActiveObjects().includes(obj)
                    const locked = (obj as any)._locked
                    return (
                      <div
                        key={i}
                        onClick={() => selectLayer(obj)}
                        className={cn(
                          'group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors',
                          isSelected ? 'bg-violet-600/20 text-white' : 'text-white/60 hover:bg-[#1a1a1a] hover:text-white'
                        )}
                      >
                        <span className="flex-1 truncate text-xs capitalize">{(obj as any).type}</span>
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); toggleVisibility(obj) }} className="rounded p-0.5 hover:text-white">
                            {obj.visible !== false ? <Eye size={11} /> : <EyeOff size={11} />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); toggleLock(obj) }} className="rounded p-0.5 hover:text-white">
                            {locked ? <Lock size={11} /> : <Unlock size={11} />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteObj(obj) }} className="rounded p-0.5 text-rose-400 hover:text-rose-300">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">{title}</p>
      {children}
    </div>
  )
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1">
      <span className="text-[10px] text-white/30 w-3">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent text-right text-xs text-white outline-none"
      />
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-white/40">{value}</span>
        <div className="relative h-6 w-6 overflow-hidden rounded border border-white/20">
          <div className="absolute inset-0" style={{ backgroundColor: value === 'transparent' ? '#fff' : value }} />
          <input type="color" value={value === 'transparent' ? '#ffffff' : value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </div>
      </div>
    </div>
  )
}