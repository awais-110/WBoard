'use client'

import { useEffect, useRef, useCallback } from 'react'
import { fabric } from 'fabric'
import { useCanvasStore } from '@/stores/canvasStore'
import { useSaveStore } from '@/stores/saveStore'
import { broadcastCanvasEvent, addText } from '@/lib/fabric/tools'
import type { ToolType } from '@/types/canvas'
import { useShallow } from 'zustand/react/shallow'

interface UseCanvasOptions {
  boardId: string
  canEdit: boolean
  onObjectAdded?: (obj: fabric.Object) => void
  onObjectModified?: (obj: fabric.Object) => void
  onObjectRemoved?: (obj: fabric.Object) => void
}

/**
 * Initializes and manages Fabric.js canvas with event handling.
 * Handles tool application, object lifecycle, and window resizing.
 */
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
  const { activeTool, strokeColor, fillColor, strokeWidth } = useCanvasStore(
    useShallow((state) => ({
      activeTool: state.activeTool,
      strokeColor: state.strokeColor,
      fillColor: state.fillColor,
      strokeWidth: state.strokeWidth,
    }))
  )

  /** Initialize Fabric.js canvas */
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
    ;(canvas as fabric.Canvas & { upperCanvasEl?: HTMLCanvasElement; wrapperEl?: HTMLDivElement }).upperCanvasEl?.style.setProperty('touch-action', 'none')
    ;(canvas as fabric.Canvas & { upperCanvasEl?: HTMLCanvasElement; wrapperEl?: HTMLDivElement }).wrapperEl?.style.setProperty('touch-action', 'none')

    fabricRef.current = canvas
    ;(window as Window & { __fabric__?: fabric.Canvas }).__fabric__ = canvas

    /** Resize handler */
    const handleResize = () => {
      const nextParent = canvasRef.current?.parentElement
      canvas.setWidth(nextParent?.clientWidth ?? window.innerWidth)
      canvas.setHeight(nextParent?.clientHeight ?? window.innerHeight - 112)
      canvas.renderAll()
    }
    window.addEventListener('resize', handleResize)

    /** Event listeners */
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
      if (!e.target || (e.target as fabric.Object & { _ignoreEvent?: boolean })._ignoreEvent) return
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
      broadcastCanvasEvent(boardId, 'object:removed', { id: (e.target as fabric.Object & { id?: string }).id })
      debouncedSave()
    })

    canvas.on('path:created', () => debouncedSave())

    canvas.on('mouse:wheel', (opt) => {
      const event = opt.e as WheelEvent
      const delta = event.deltaY
      let zoom = canvas.getZoom()
      zoom *= 0.999 ** delta
      zoom = Math.min(4, Math.max(0.2, zoom))
      canvas.zoomToPoint(new fabric.Point(event.offsetX, event.offsetY), zoom)
      event.preventDefault()
      event.stopPropagation()
      window.dispatchEvent(new Event('whiteboard:zoom-changed'))
    })

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('whiteboard:retry-save', retrySave)
      canvas.dispose()
      fabricRef.current = null
    }
  }, [boardId, canEdit, onObjectAdded, onObjectModified, onObjectRemoved])

  /** Sync tool changes to canvas */
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    applyTool(canvas, activeTool, { strokeColor, fillColor, strokeWidth, canEdit })
  }, [activeTool, strokeColor, fillColor, strokeWidth, canEdit])

  /** Shape drawing handlers for rectangle/circle/line */
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    let drawing: fabric.Object | null = null
    let isPanning = false
    let lastPanX = 0
    let lastPanY = 0
    let startX = 0
    let startY = 0

    const onMouseDown = (opt: fabric.IEvent) => {
      if (!canEdit) return
      const point = getClientPoint(opt.e)
      const pointer = canvas.getPointer(opt.e)
      startX = pointer.x
      startY = pointer.y

      if (activeTool === 'text') {
        addText(canvas, startX, startY, 'Click to edit', strokeColor)
        return
      }

      if (activeTool === 'eraser') {
        eraseAtPointer(canvas, pointer)
        return
      }

      if (activeTool === 'pan') {
        isPanning = true
        lastPanX = point.x
        lastPanY = point.y
        canvas.defaultCursor = 'grabbing'
        return
      }

      if (activeTool === 'rectangle') {
        drawing = new fabric.Rect({
          left: startX,
          top: startY,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          selectable: true,
          id: crypto.randomUUID(),
        } as fabric.IRectOptions & { id: string })
        canvas.add(drawing)
      }

      if (activeTool === 'circle') {
        drawing = new fabric.Ellipse({
          left: startX,
          top: startY,
          rx: 0,
          ry: 0,
          originX: 'left',
          originY: 'top',
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          selectable: true,
          id: crypto.randomUUID(),
        } as fabric.IEllipseOptions & { id: string })
        canvas.add(drawing)
      }

      if (activeTool === 'line') {
        drawing = new fabric.Line([startX, startY, startX, startY], {
          stroke: strokeColor,
          strokeWidth,
          selectable: true,
          id: crypto.randomUUID(),
        } as fabric.ILineOptions & { id: string })
        canvas.add(drawing)
      }
    }

    const onMouseMove = (opt: fabric.IEvent) => {
      const point = getClientPoint(opt.e)
      const pointer = canvas.getPointer(opt.e)

      if (activeTool === 'eraser' && isPrimaryPointerDown(opt.e)) {
        eraseAtPointer(canvas, pointer)
        return
      }

      if (isPanning) {
        const vpt = canvas.viewportTransform
        if (!vpt) return
        vpt[4] += point.x - lastPanX
        vpt[5] += point.y - lastPanY
        canvas.requestRenderAll()
        lastPanX = point.x
        lastPanY = point.y
        return
      }

      if (!drawing) return
      const x = pointer.x
      const y = pointer.y

      if (drawing instanceof fabric.Rect) {
        const rect = drawing as fabric.Rect
        rect.set({
          left: Math.min(startX, x),
          top: Math.min(startY, y),
          width: Math.abs(x - startX),
          height: Math.abs(y - startY),
        })
        rect.setCoords()
        canvas.requestRenderAll()
      }

      if (drawing instanceof fabric.Ellipse) {
        const el = drawing as fabric.Ellipse
        const rx = Math.abs(x - startX) / 2
        const ry = Math.abs(y - startY) / 2
        el.set({
          left: Math.min(startX, x),
          top: Math.min(startY, y),
          rx,
          ry,
        })
        el.setCoords()
        canvas.requestRenderAll()
      }

      if (drawing instanceof fabric.Line) {
        const ln = drawing as fabric.Line
        ln.set({ x2: x, y2: y })
        ln.setCoords()
        canvas.requestRenderAll()
      }
    }

    const onMouseUp = () => {
      if (isPanning) {
        isPanning = false
        canvas.defaultCursor = 'grab'
      }
      if (drawing) {
        canvas.fire('object:modified', { target: drawing })
      }
      drawing = null
    }

    // Attach handlers when using shape tools
    if (['rectangle', 'circle', 'line', 'text', 'eraser', 'pan'].includes(activeTool)) {
      canvas.on('mouse:down', onMouseDown)
      canvas.on('mouse:move', onMouseMove)
      canvas.on('mouse:up', onMouseUp)
    }

    return () => {
      canvas.off('mouse:down', onMouseDown)
      canvas.off('mouse:move', onMouseMove)
      canvas.off('mouse:up', onMouseUp)
    }
  }, [activeTool, fillColor, strokeColor, strokeWidth, canEdit])

  const loadFromJSON = useCallback((json: object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.loadFromJSON(json, () => canvas.renderAll())
  }, [])

  const toJSON = useCallback(() => {
    return fabricRef.current?.toJSON() ?? {}
  }, [])

  const clear = useCallback(() => {
    fabricRef.current?.clear()
    broadcastCanvasEvent(boardId, 'canvas:cleared', {})
  }, [boardId])

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    canvas.discardActiveObject()
    activeObjects.forEach((obj) => canvas.remove(obj))
    canvas.renderAll()
  }, [])

  return { canvasRef, fabricRef, loadFromJSON, toJSON, clear, deleteSelected }
}

/**
 * Applies the active tool settings to the canvas.
 */
function applyTool(
  canvas: fabric.Canvas,
  tool: ToolType,
  options: { strokeColor: string; fillColor: string; strokeWidth: number; canEdit: boolean }
) {
  const { strokeColor, fillColor, strokeWidth, canEdit } = options

  canvas.isDrawingMode = false
  canvas.selection = canEdit && tool === 'select'

  switch (tool) {
    case 'pen':
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.color = strokeColor
      canvas.freeDrawingBrush.width = strokeWidth
      break
    case 'select':
      canvas.defaultCursor = 'default'
      break
    case 'text':
      canvas.defaultCursor = 'text'
      break
    case 'eraser':
      canvas.defaultCursor = 'not-allowed'
      canvas.selection = false
      break
    case 'pan':
      canvas.defaultCursor = 'grab'
      canvas.selection = false
      break
    default:
      canvas.defaultCursor = 'crosshair'
      canvas.selection = false
  }
}

function eraseAtPointer(canvas: fabric.Canvas, pointer: fabric.Point | { x: number; y: number }) {
  const objects = canvas.getObjects()
  const target = [...objects].reverse().find((object) => object.containsPoint(new fabric.Point(pointer.x, pointer.y)))
  if (!target) return

  canvas.remove(target)
  canvas.requestRenderAll()
}

function getClientPoint(event: Event) {
  if (isTouchEvent(event) && event.touches.length > 0) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }

  if (isTouchEvent(event) && event.changedTouches.length > 0) {
    return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
  }

  const mouseEvent = event as MouseEvent
  return { x: mouseEvent.clientX, y: mouseEvent.clientY }
}

function isPrimaryPointerDown(event: Event) {
  if (isTouchEvent(event)) return event.touches.length > 0
  return (event as MouseEvent).buttons === 1
}

function isTouchEvent(event: Event): event is TouchEvent {
  return typeof TouchEvent !== 'undefined' && event instanceof TouchEvent
}
