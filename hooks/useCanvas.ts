'use client'

import { useEffect, useRef, useCallback } from 'react'
import { fabric } from 'fabric'
import { useCanvasStore } from '@/stores/canvasStore'
import { useSaveStore } from '@/stores/saveStore'
import { broadcastCanvasEvent } from '@/lib/fabric/tools'
import type { ToolType } from '@/types/canvas'
import { useShallow } from 'zustand/react/shallow'

interface UseCanvasOptions {
  boardId: string
  canEdit: boolean
  onObjectAdded?: (obj: fabric.Object) => void
  onObjectModified?: (obj: fabric.Object) => void
  onObjectRemoved?: (obj: fabric.Object) => void
}

export function useCanvas({
  boardId,
  canEdit,
  onObjectAdded,
  onObjectModified,
  onObjectRemoved,
}: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drawingRef = useRef<fabric.Object | null>(null)
  const isPanningRef = useRef(false)
  const lastPanRef = useRef({ x: 0, y: 0 })
  const startPointRef = useRef({ x: 0, y: 0 })

  const { activeTool, strokeColor, fillColor, strokeWidth, opacity, fontSize, fontFamily, showGrid, snapToGrid, gridSize } = useCanvasStore(
    useShallow((state) => ({
      activeTool: state.activeTool,
      strokeColor: state.strokeColor,
      fillColor: state.fillColor,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity,
      fontSize: state.fontSize,
      fontFamily: state.fontFamily,
      showGrid: state.showGrid,
      snapToGrid: state.snapToGrid,
      gridSize: state.gridSize,
    }))
  )

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const parent = canvasRef.current.parentElement
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      selection: canEdit,
      backgroundColor: '#ffffff',
      width: parent?.clientWidth ?? window.innerWidth,
      height: parent?.clientHeight ?? window.innerHeight - 112,
    })

    canvas.getElement().style.touchAction = 'none'
    const anyCanvas = canvas as any
    anyCanvas.upperCanvasEl?.style.setProperty('touch-action', 'none')
    anyCanvas.wrapperEl?.style.setProperty('touch-action', 'none')

    fabricRef.current = canvas
    ;(window as any).__fabric__ = canvas

    const handleResize = () => {
      const p = canvasRef.current?.parentElement
      canvas.setWidth(p?.clientWidth ?? window.innerWidth)
      canvas.setHeight(p?.clientHeight ?? window.innerHeight - 112)
      canvas.renderAll()
    }
    window.addEventListener('resize', handleResize)

    const { setSaving, setSaved, setError } = useSaveStore.getState()
    const debouncedSave = () => {
      if (!canEdit) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        try {
          setSaving()
          const json = canvas.toJSON(['id'])
          const response = await fetch(`/api/boards/${boardId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ canvas_data: json }),
          })
          if (!response.ok) throw new Error('Unable to save board')
          setSaved()
        } catch (err: any) {
          setError(err?.message ?? 'save failed')
        }
      }, 800)
    }

    const retrySave = () => debouncedSave()
    window.addEventListener('whiteboard:retry-save', retrySave)

    canvas.on('object:added', (e) => {
      if (!e.target || (e.target as any)._ignoreEvent) return
      onObjectAdded?.(e.target)
      broadcastCanvasEvent(boardId, 'object:added', e.target.toObject())
      debouncedSave()
    })
    canvas.on('object:modified', (e) => {
      if (!e.target) return
      onObjectModified?.(e.target)
      broadcastCanvasEvent(boardId, 'object:modified', e.target.toObject())
      debouncedSave()
    })
    canvas.on('object:removed', (e) => {
      if (!e.target) return
      onObjectRemoved?.(e.target)
      broadcastCanvasEvent(boardId, 'object:removed', { id: (e.target as any).id })
      debouncedSave()
    })
    canvas.on('path:created', () => debouncedSave())

    // Zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const event = opt.e as WheelEvent
      let zoom = canvas.getZoom()
      zoom *= 0.999 ** event.deltaY
      zoom = Math.min(5, Math.max(0.1, zoom))
      canvas.zoomToPoint(new fabric.Point(event.offsetX, event.offsetY), zoom)
      event.preventDefault()
      event.stopPropagation()
      window.dispatchEvent(new Event('whiteboard:zoom-changed'))
    })

    // Touch pinch zoom
    let lastDist = 0
    canvas.on('touch:gesture' as any, (e: any) => {
      if (e.e.touches?.length === 2) {
        const t1 = e.e.touches[0]
        const t2 = e.e.touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        if (lastDist > 0) {
          let zoom = canvas.getZoom() * (dist / lastDist)
          zoom = Math.min(5, Math.max(0.1, zoom))
          const midX = (t1.clientX + t2.clientX) / 2
          const midY = (t1.clientY + t2.clientY) / 2
          canvas.zoomToPoint(new fabric.Point(midX, midY), zoom)
        }
        lastDist = dist
      }
    })

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canEdit) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputEl(e.target)) {
        const objs = canvas.getActiveObjects()
        canvas.discardActiveObject()
        objs.forEach((o) => canvas.remove(o))
        canvas.renderAll()
        debouncedSave()
      }
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        canvas.discardActiveObject()
        const sel = new fabric.ActiveSelection(canvas.getObjects(), { canvas })
        canvas.setActiveObject(sel)
        canvas.requestRenderAll()
      }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        const active = canvas.getActiveObject()
        if (!active) return
        active.clone((cloned: fabric.Object) => {
          cloned.set({ left: (active.left ?? 0) + 20, top: (active.top ?? 0) + 20 })
          ;(cloned as any).id = crypto.randomUUID()
          canvas.add(cloned)
          canvas.setActiveObject(cloned)
          canvas.requestRenderAll()
          debouncedSave()
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('whiteboard:retry-save', retrySave)
      window.removeEventListener('keydown', handleKeyDown)
      canvas.dispose()
      fabricRef.current = null
    }
  }, [boardId, canEdit])

  // Sync tool to canvas
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    applyTool(canvas, activeTool, { strokeColor, fillColor, strokeWidth, canEdit })
  }, [activeTool, strokeColor, fillColor, strokeWidth, canEdit])

  // Grid overlay
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    drawGrid(canvas, showGrid, gridSize)
  }, [showGrid, gridSize])

  // Shape & pan handlers
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const onMouseDown = (opt: fabric.IEvent) => {
      if (!canEdit) return
      const pointer = canvas.getPointer(opt.e)
      let { x, y } = pointer
      if (snapToGrid) { x = snap(x, gridSize); y = snap(y, gridSize) }
      startPointRef.current = { x, y }

      if (activeTool === 'text') {
        const text = new fabric.IText('Click to edit', {
          left: x, top: y,
          fontSize,
          fontFamily,
          fill: strokeColor,
          selectable: true,
          id: crypto.randomUUID(),
        } as any)
        canvas.add(text)
        canvas.setActiveObject(text)
        text.enterEditing()
        return
      }

      if (activeTool === 'eraser') {
        eraseAt(canvas, pointer)
        return
      }

      if (activeTool === 'pan') {
        isPanningRef.current = true
        const pt = getClientPoint(opt.e)
        lastPanRef.current = { x: pt.x, y: pt.y }
        canvas.defaultCursor = 'grabbing'
        return
      }

      if (activeTool === 'image') {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (ev) => {
          const file = (ev.target as HTMLInputElement).files?.[0]
          if (!file) return
          const url = URL.createObjectURL(file)
          fabric.Image.fromURL(url, (img) => {
            img.set({ left: x, top: y, scaleX: 0.5, scaleY: 0.5, id: crypto.randomUUID() } as any)
            canvas.add(img)
            canvas.setActiveObject(img)
            canvas.requestRenderAll()
          })
        }
        input.click()
        return
      }

      // Shape tools
      const shapeOpts = {
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        opacity,
        selectable: false,
        id: crypto.randomUUID(),
      }

      if (activeTool === 'rectangle') {
        drawingRef.current = new fabric.Rect({ ...shapeOpts, left: x, top: y, width: 0, height: 0 } as any)
      } else if (activeTool === 'circle') {
        drawingRef.current = new fabric.Ellipse({ ...shapeOpts, left: x, top: y, rx: 0, ry: 0, originX: 'left', originY: 'top' } as any)
      } else if (activeTool === 'line') {
        drawingRef.current = new fabric.Line([x, y, x, y], { ...shapeOpts, fill: '' } as any)
      } else if (activeTool === 'arrow') {
        drawingRef.current = new fabric.Line([x, y, x, y], { ...shapeOpts, fill: '' } as any)
      } else if (activeTool === 'triangle') {
        drawingRef.current = new fabric.Triangle({ ...shapeOpts, left: x, top: y, width: 0, height: 0 } as any)
      } else if (activeTool === 'diamond') {
        const pts = [{ x: 0, y: -50 }, { x: 50, y: 0 }, { x: 0, y: 50 }, { x: -50, y: 0 }]
        drawingRef.current = new fabric.Polygon(pts, { ...shapeOpts, left: x, top: y } as any)
      }

      if (drawingRef.current) canvas.add(drawingRef.current)
    }

    const onMouseMove = (opt: fabric.IEvent) => {
      const pointer = canvas.getPointer(opt.e)
      let { x, y } = pointer
      if (snapToGrid) { x = snap(x, gridSize); y = snap(y, gridSize) }
      const { x: sx, y: sy } = startPointRef.current

      if (activeTool === 'eraser' && isPrimaryDown(opt.e)) {
        eraseAt(canvas, pointer)
        return
      }

      if (isPanningRef.current) {
        const pt = getClientPoint(opt.e)
        const vpt = canvas.viewportTransform
        if (!vpt) return
        vpt[4] += pt.x - lastPanRef.current.x
        vpt[5] += pt.y - lastPanRef.current.y
        canvas.requestRenderAll()
        lastPanRef.current = { x: pt.x, y: pt.y }
        return
      }

      const d = drawingRef.current
      if (!d) return

      if (d instanceof fabric.Rect || d instanceof fabric.Triangle) {
        d.set({ left: Math.min(sx, x), top: Math.min(sy, y), width: Math.abs(x - sx), height: Math.abs(y - sy) })
      } else if (d instanceof fabric.Ellipse) {
        d.set({ left: Math.min(sx, x), top: Math.min(sy, y), rx: Math.abs(x - sx) / 2, ry: Math.abs(y - sy) / 2 })
      } else if (d instanceof fabric.Line) {
        d.set({ x2: x, y2: y })
      } else if (d instanceof fabric.Polygon) {
        const w = Math.abs(x - sx)
        const h = Math.abs(y - sy)
        const pts = [
          { x: w / 2, y: 0 },
          { x: w, y: h / 2 },
          { x: w / 2, y: h },
          { x: 0, y: h / 2 },
        ]
        d.set({ points: pts, left: Math.min(sx, x), top: Math.min(sy, y), pathOffset: { x: w / 2, y: h / 2 } } as any)
      }

      d.setCoords()
      canvas.requestRenderAll()
    }

    const onMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false
        canvas.defaultCursor = 'grab'
      }
      const d = drawingRef.current
      if (d) {
        d.set({ selectable: true })
        canvas.setActiveObject(d)
        canvas.fire('object:modified', { target: d })
        drawingRef.current = null
      }
    }

    const tools: ToolType[] = ['rectangle', 'circle', 'line', 'arrow', 'triangle', 'diamond', 'text', 'eraser', 'pan', 'image']
    if (tools.includes(activeTool)) {
      canvas.on('mouse:down', onMouseDown)
      canvas.on('mouse:move', onMouseMove)
      canvas.on('mouse:up', onMouseUp)
    }

    return () => {
      canvas.off('mouse:down', onMouseDown)
      canvas.off('mouse:move', onMouseMove)
      canvas.off('mouse:up', onMouseUp)
    }
  }, [activeTool, fillColor, strokeColor, strokeWidth, opacity, fontSize, fontFamily, canEdit, snapToGrid, gridSize])

  const loadFromJSON = useCallback((json: object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.loadFromJSON(json, () => canvas.renderAll())
  }, [])

  const toJSON = useCallback(() => fabricRef.current?.toJSON() ?? {}, [])

  const clear = useCallback(() => {
    fabricRef.current?.clear()
    broadcastCanvasEvent(boardId, 'canvas:cleared', {})
  }, [boardId])

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const objs = canvas.getActiveObjects()
    canvas.discardActiveObject()
    objs.forEach((o) => canvas.remove(o))
    canvas.renderAll()
  }, [])

  const zoomIn = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const zoom = Math.min(5, canvas.getZoom() * 1.1)
    canvas.setZoom(zoom)
    canvas.requestRenderAll()
  }, [])

  const zoomOut = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const zoom = Math.max(0.1, canvas.getZoom() / 1.1)
    canvas.setZoom(zoom)
    canvas.requestRenderAll()
  }, [])

  const zoomFit = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.setZoom(1)
    canvas.requestRenderAll()
  }, [])

  const alignObjects = useCallback((direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const canvas = fabricRef.current
    if (!canvas) return
    const objs = canvas.getActiveObjects()
    if (objs.length < 2) return
    const bounds = canvas.getActiveObject()?.getBoundingRect()
    if (!bounds) return
    objs.forEach((obj) => {
      if (direction === 'left') obj.set({ left: bounds.left })
      if (direction === 'right') obj.set({ left: bounds.left + bounds.width - (obj.width ?? 0) * (obj.scaleX ?? 1) })
      if (direction === 'center') obj.set({ left: bounds.left + bounds.width / 2 - (obj.width ?? 0) * (obj.scaleX ?? 1) / 2 })
      if (direction === 'top') obj.set({ top: bounds.top })
      if (direction === 'bottom') obj.set({ top: bounds.top + bounds.height - (obj.height ?? 0) * (obj.scaleY ?? 1) })
      if (direction === 'middle') obj.set({ top: bounds.top + bounds.height / 2 - (obj.height ?? 0) * (obj.scaleY ?? 1) / 2 })
      obj.setCoords()
    })
    canvas.requestRenderAll()
  }, [])

  return { canvasRef, fabricRef, loadFromJSON, toJSON, clear, deleteSelected, zoomIn, zoomOut, zoomFit, alignObjects }
}

function applyTool(canvas: fabric.Canvas, tool: ToolType, opts: { strokeColor: string; fillColor: string; strokeWidth: number; canEdit: boolean }) {
  canvas.isDrawingMode = false
  canvas.selection = opts.canEdit && tool === 'select'

  switch (tool) {
    case 'pen':
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.color = opts.strokeColor
      canvas.freeDrawingBrush.width = opts.strokeWidth
      break
    case 'select': canvas.defaultCursor = 'default'; break
    case 'text': canvas.defaultCursor = 'text'; break
    case 'eraser': canvas.defaultCursor = 'cell'; canvas.selection = false; break
    case 'pan': canvas.defaultCursor = 'grab'; canvas.selection = false; break
    default: canvas.defaultCursor = 'crosshair'; canvas.selection = false
  }
}

function eraseAt(canvas: fabric.Canvas, pointer: { x: number; y: number }) {
  const pt = new fabric.Point(pointer.x, pointer.y)
  const target = [...canvas.getObjects()].reverse().find((o) => o.containsPoint(pt))
  if (target) { canvas.remove(target); canvas.requestRenderAll() }
}

function drawGrid(canvas: fabric.Canvas, show: boolean, size: number) {
  canvas.getObjects().filter((o) => (o as any)._isGrid).forEach((o) => canvas.remove(o))
  if (!show) { canvas.requestRenderAll(); return }
  const w = canvas.getWidth()
  const h = canvas.getHeight()
  for (let x = 0; x < w; x += size) {
    const line = new fabric.Line([x, 0, x, h], { stroke: '#e5e7eb', strokeWidth: 1, selectable: false, evented: false, _isGrid: true } as any)
    canvas.add(line)
    canvas.sendToBack(line)
  }
  for (let y = 0; y < h; y += size) {
    const line = new fabric.Line([0, y, w, y], { stroke: '#e5e7eb', strokeWidth: 1, selectable: false, evented: false, _isGrid: true } as any)
    canvas.add(line)
    canvas.sendToBack(line)
  }
  canvas.requestRenderAll()
}

function snap(val: number, size: number) { return Math.round(val / size) * size }
function getClientPoint(e: Event) {
  if (e instanceof TouchEvent && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  if (e instanceof TouchEvent && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
}
function isPrimaryDown(e: Event) {
  if (e instanceof TouchEvent) return e.touches.length > 0
  return (e as MouseEvent).buttons === 1
}
function isInputEl(t: EventTarget | null) {
  return t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.contentEditable === 'true')
}