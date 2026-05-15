'use client'

import { useCallback, useEffect, useRef } from 'react'
import { fabric } from 'fabric'
import { useShallow } from 'zustand/react/shallow'
import { createClient } from '@/lib/supabase/client'
import { useCanvasStore } from '@/stores/canvasStore'
import { useSaveStore } from '@/stores/saveStore'
import type { CanvasEventType, ToolType } from '@/types/canvas'
import {
  addArrow,
  addStickyNote,
  addText,
  disableFreeDraw,
  duplicateSelected,
  enableFreeDraw,
} from '@/lib/fabric/tools'
import { initializeCanvas, setupCanvasPan, setupCanvasResize } from '@/lib/fabric/init'

const MIN_ZOOM = 0.05
const MAX_ZOOM = 5
const ZOOM_FACTOR = 0.95

async function broadcastCanvasEvent(
  boardId: string,
  eventType: CanvasEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await (supabase.from('canvas_events') as any).insert({
    board_id: boardId,
    user_id: user.id,
    event_type: eventType,
    payload,
  })

  if (error) console.error('[broadcastCanvasEvent]', error.message)
}

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
  const cleanupRef = useRef<Array<() => void>>([])
  const drawingStateRef = useRef<{ startX: number; startY: number; tool: ToolType } | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const suppressHistoryRef = useRef(false)

  const {
    activeTool,
    strokeColor,
    fillColor,
    strokeWidth,
    opacity,
    fontSize,
    fontFamily,
    snapToGrid,
    gridSize,
  } = useCanvasStore(
    useShallow((state) => ({
      activeTool: state.activeTool,
      strokeColor: state.strokeColor,
      fillColor: state.fillColor,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity,
      fontSize: state.fontSize,
      fontFamily: state.fontFamily,
      snapToGrid: state.snapToGrid,
      gridSize: state.gridSize,
    }))
  )

  useEffect(() => {
    if (!canvasRef.current) return

    const parent = canvasRef.current.parentElement
    const canvas = initializeCanvas(
      canvasRef.current,
      parent?.clientWidth ?? window.innerWidth,
      parent?.clientHeight ?? window.innerHeight - 112
    )

    canvas.defaultCursor = 'default'
    const anyCanvas = canvas as any
    if (anyCanvas.upperCanvasEl?.style) anyCanvas.upperCanvasEl.style.touchAction = 'none'
    if (anyCanvas.wrapperEl?.style) anyCanvas.wrapperEl.style.touchAction = 'none'
    canvas.selection = canEdit && activeTool === 'select'
    fabricRef.current = canvas
    ;(window as any).__fabric__ = canvas

    const resizeCleanup = setupCanvasResize(canvas, parent ?? canvas.getElement().parentElement ?? anyCanvas.wrapperEl)
    const panCleanup = setupCanvasPan(canvas)
    cleanupRef.current.push(resizeCleanup, panCleanup)

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
        } catch (error: any) {
          setError(error?.message ?? 'save failed')
        }
      }, 800)
    }

    const dispatchZoomChange = () => window.dispatchEvent(new Event('whiteboard:zoom-changed'))

    const onMouseWheel = (opt: fabric.IEvent<WheelEvent>) => {
      const event = opt.e
      event.preventDefault()
      event.stopPropagation()

      const zoom = clampZoom(canvas.getZoom() * (event.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR))
      canvas.zoomToPoint(new fabric.Point(event.offsetX, event.offsetY), zoom)
      canvas.requestRenderAll()
      dispatchZoomChange()
    }

    const handleObjectAdded = (event: any) => {
      const target = event.target
      if (!target || (target as any)._ignoreEvent || suppressHistoryRef.current) return
      onObjectAdded?.(target)
      void broadcastCanvasEvent(boardId, 'object:added', target.toObject())
      debouncedSave()
    }

    const modifiedTimers: Record<string, ReturnType<typeof setTimeout>> = {}
    const handleObjectModified = (event: any) => {
      const target = event.target
      if (!target || suppressHistoryRef.current) return
      onObjectModified?.(target)

      // Batch rapid modifications per object id to avoid flooding realtime channel
      const id = (target as any).id as string | undefined
      const payload = target.toObject()
      if (id) {
        if (modifiedTimers[id]) clearTimeout(modifiedTimers[id])
        modifiedTimers[id] = setTimeout(() => {
          void broadcastCanvasEvent(boardId, 'object:modified', payload)
          delete modifiedTimers[id]
        }, 120)
      } else {
        void broadcastCanvasEvent(boardId, 'object:modified', payload)
      }

      debouncedSave()
    }

    const handleObjectRemoved = (event: any) => {
      const target = event.target
      if (!target || suppressHistoryRef.current) return
      onObjectRemoved?.(target)
      void broadcastCanvasEvent(boardId, 'object:removed', { id: (target as any).id })
      debouncedSave()
    }

    const onPathCreated = () => debouncedSave()

    canvas.on('mouse:wheel', onMouseWheel)
    canvas.on('object:added', handleObjectAdded)
    canvas.on('object:modified', handleObjectModified)
    canvas.on('object:removed', handleObjectRemoved)
    canvas.on('path:created', onPathCreated)

    const handleRetrySave = () => debouncedSave()
    window.addEventListener('whiteboard:retry-save', handleRetrySave)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!canEdit || isInputElement(event.target)) return

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        deleteSelectedInternal(canvas)
        debouncedSave()
        return
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        const objects = canvas.getObjects().filter((obj) => obj.evented !== false && obj.visible !== false)
        if (objects.length > 0) {
          const selection = new fabric.ActiveSelection(objects, { canvas })
          canvas.setActiveObject(selection)
          canvas.requestRenderAll()
        }
        return
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateSelected(canvas)
        debouncedSave()
        return
      }

      if (event.key === 'Escape') {
        canvas.discardActiveObject()
        canvas.requestRenderAll()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    cleanupRef.current.push(() => canvas.off('mouse:wheel', onMouseWheel))
    cleanupRef.current.push(() => canvas.off('object:added', handleObjectAdded))
    cleanupRef.current.push(() => canvas.off('object:modified', handleObjectModified))
    cleanupRef.current.push(() => canvas.off('object:removed', handleObjectRemoved))
    cleanupRef.current.push(() => canvas.off('path:created', onPathCreated))
    cleanupRef.current.push(() => window.removeEventListener('whiteboard:retry-save', handleRetrySave))
    cleanupRef.current.push(() => window.removeEventListener('keydown', handleKeyDown))

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      cleanupRef.current.forEach((cleanup) => cleanup())
      cleanupRef.current = []
      canvas.dispose()
      fabricRef.current = null
      if ((window as any).__fabric__ === canvas) {
        delete (window as any).__fabric__
      }
    }
  }, [boardId, canEdit])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    applyTool(canvas, activeTool, { strokeColor, fillColor, strokeWidth, canEdit })
  }, [activeTool, strokeColor, fillColor, strokeWidth, canEdit])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const onMouseDown = (opt: fabric.IEvent) => {
      if (!canEdit) return
      const pointer = canvas.getPointer(opt.e)
      let { x, y } = pointer
      if (snapToGrid) {
        x = snap(x, gridSize)
        y = snap(y, gridSize)
      }

      if (activeTool === 'text') {
        addText(canvas, x, y, 'Click to edit', strokeColor, fontSize, fontFamily)
        return
      }

      if (activeTool === 'sticky') {
        addStickyNote(canvas, x, y, fillColor === 'transparent' ? '#fef08a' : fillColor)
        return
      }

      if (activeTool === 'eraser') {
        eraseAt(canvas, pointer)
        return
      }

      if (activeTool === 'image') {
        ensureImageInput(imageInputRef, () => {
          const file = imageInputRef.current?.files?.[0]
          if (!file) return
          const url = URL.createObjectURL(file)
          fabric.Image.fromURL(url, (img) => {
            img.set({ left: x, top: y, scaleX: 0.5, scaleY: 0.5, id: crypto.randomUUID() } as any)
            canvas.add(img)
            canvas.setActiveObject(img)
            canvas.requestRenderAll()
          })
        })
        imageInputRef.current?.click()
        return
      }

      if (activeTool === 'pen') {
        enableFreeDraw(canvas, strokeColor, strokeWidth)
        return
      }

      if (activeTool === 'pan') {
        canvas.defaultCursor = 'grab'
        return
      }

      if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'triangle' || activeTool === 'diamond' || activeTool === 'line' || activeTool === 'arrow') {
        drawingStateRef.current = { startX: x, startY: y, tool: activeTool }
        const shape = createShapePreview(canvas, activeTool, x, y, strokeColor, fillColor, strokeWidth, opacity)
        if (shape) {
          canvas.add(shape)
        }
      }
    }

    const onMouseMove = (opt: fabric.IEvent) => {
      if (!canEdit) return
      const pointer = canvas.getPointer(opt.e)
      let { x, y } = pointer
      if (snapToGrid) {
        x = snap(x, gridSize)
        y = snap(y, gridSize)
      }

      const state = drawingStateRef.current
      if (!state) {
        if (activeTool === 'eraser' && isPrimaryDown(opt.e)) {
          eraseAt(canvas, pointer)
        }
        return
      }

      const objects = canvas.getObjects()
      const activeObject = objects[objects.length - 1]
      if (!activeObject || activeObject.selectable !== false) return

      updateShapePreview(activeObject, state.tool, state.startX, state.startY, x, y)
      activeObject.setCoords()
      canvas.requestRenderAll()
    }

    const onMouseUp = (opt: fabric.IEvent) => {
      if (!canEdit) return

      const state = drawingStateRef.current
      if (activeTool === 'pen') {
        disableFreeDraw(canvas)
      }

      if (!state) return

      const pointer = canvas.getPointer(opt.e)
      let { x, y } = pointer
      if (snapToGrid) {
        x = snap(x, gridSize)
        y = snap(y, gridSize)
      }

      if (state.tool === 'arrow') {
        const objects = canvas.getObjects()
        const preview = objects[objects.length - 1]
        if (preview && preview.selectable === false) {
          canvas.remove(preview)
        }
        const arrow = addArrow(canvas, state.startX, state.startY, x, y, strokeColor, strokeWidth)
        canvas.setActiveObject(arrow)
        canvas.requestRenderAll()
      }

      const lastObject = canvas.getObjects().at(-1)
      if (lastObject && lastObject.selectable === false) {
        lastObject.set({ selectable: true, evented: true })
        canvas.setActiveObject(lastObject)
        canvas.requestRenderAll()
      }

      drawingStateRef.current = null
      canvas.requestRenderAll()
    }

    canvas.on('mouse:down', onMouseDown)
    canvas.on('mouse:move', onMouseMove)
    canvas.on('mouse:up', onMouseUp)

    return () => {
      canvas.off('mouse:down', onMouseDown)
      canvas.off('mouse:move', onMouseMove)
      canvas.off('mouse:up', onMouseUp)
    }
  }, [activeTool, boardId, canEdit, fillColor, fontFamily, fontSize, gridSize, opacity, snapToGrid, strokeColor, strokeWidth])

  const loadFromJSON = useCallback((json: object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    suppressHistoryRef.current = true
    canvas.loadFromJSON(json, () => {
      canvas.requestRenderAll()
      suppressHistoryRef.current = false
    })
  }, [])

  const toJSON = useCallback(() => fabricRef.current?.toJSON(['id']) ?? {}, [])

  const clear = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    suppressHistoryRef.current = true
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    canvas.requestRenderAll()
    suppressHistoryRef.current = false
    void broadcastCanvasEvent(boardId, 'canvas:cleared', {})
  }, [boardId])

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    deleteSelectedInternal(canvas)
  }, [])

  const zoomTo = useCallback((zoom: number) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const nextZoom = clampZoom(zoom)
    canvas.zoomToPoint(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2), nextZoom)
    canvas.requestRenderAll()
    window.dispatchEvent(new Event('whiteboard:zoom-changed'))
  }, [])

  const zoomIn = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    zoomTo(canvas.getZoom() / ZOOM_FACTOR)
  }, [zoomTo])

  const zoomOut = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    zoomTo(canvas.getZoom() * ZOOM_FACTOR)
  }, [zoomTo])

  const zoomFit = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.setZoom(1)
    canvas.requestRenderAll()
    window.dispatchEvent(new Event('whiteboard:zoom-changed'))
  }, [])

  const alignObjects = useCallback((direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const canvas = fabricRef.current
    if (!canvas) return
    const objects = canvas.getActiveObjects()
    if (objects.length < 2) return
    const bounds = canvas.getActiveObject()?.getBoundingRect()
    if (!bounds) return

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
  }, [])

  return { canvasRef, fabricRef, loadFromJSON, toJSON, clear, deleteSelected, zoomIn, zoomOut, zoomFit, alignObjects }
}

function applyTool(
  canvas: fabric.Canvas,
  tool: ToolType,
  opts: { strokeColor: string; fillColor: string; strokeWidth: number; canEdit: boolean }
) {
  canvas.isDrawingMode = false

  if (!opts.canEdit) {
    canvas.selection = false
    canvas.defaultCursor = 'not-allowed'
    disableFreeDraw(canvas)
    return
  }

  canvas.selection = tool === 'select'

  switch (tool) {
    case 'pen':
      enableFreeDraw(canvas, opts.strokeColor, opts.strokeWidth)
      canvas.defaultCursor = 'crosshair'
      break
    case 'select':
      disableFreeDraw(canvas)
      canvas.defaultCursor = 'default'
      break
    case 'text':
      disableFreeDraw(canvas)
      canvas.defaultCursor = 'text'
      break
    case 'eraser':
      disableFreeDraw(canvas)
      canvas.defaultCursor = 'cell'
      canvas.selection = false
      break
    case 'pan':
      disableFreeDraw(canvas)
      canvas.defaultCursor = 'grab'
      canvas.selection = false
      break
    default:
      disableFreeDraw(canvas)
      canvas.defaultCursor = 'crosshair'
      canvas.selection = false
  }
}

function createShapePreview(
  canvas: fabric.Canvas,
  tool: ToolType,
  x: number,
  y: number,
  strokeColor: string,
  fillColor: string,
  strokeWidth: number,
  opacity: number
): fabric.Object | null {
  const options = {
    stroke: strokeColor,
    fill: fillColor,
    strokeWidth,
    opacity,
    selectable: false,
    evented: false,
    originX: 'left' as const,
    originY: 'top' as const,
    id: crypto.randomUUID(),
  }

  if (tool === 'rectangle') {
    return new fabric.Rect({ ...options, left: x, top: y, width: 0, height: 0 })
  }

  if (tool === 'circle') {
    return new fabric.Ellipse({ ...options, left: x, top: y, rx: 0, ry: 0 } as any)
  }

  if (tool === 'triangle') {
    return new fabric.Triangle({ ...options, left: x, top: y, width: 0, height: 0 })
  }

  if (tool === 'diamond') {
    return new fabric.Polygon(
      [
        { x: 0, y: 30 },
        { x: 30, y: 0 },
        { x: 60, y: 30 },
        { x: 30, y: 60 },
      ],
      { ...options, left: x, top: y } as any
    )
  }

  if (tool === 'line') {
    return new fabric.Line([x, y, x, y], { ...options, fill: '', strokeUniform: true })
  }

  if (tool === 'arrow') {
    return new fabric.Line([x, y, x, y], { ...options, fill: '', strokeUniform: true })
  }

  return null
}

function updateShapePreview(
  object: fabric.Object,
  tool: ToolType,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): void {
  if (tool === 'rectangle') {
    object.set({
      left: Math.min(startX, endX),
      top: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY),
    })
    return
  }

  if (tool === 'circle') {
    object.set({
      left: Math.min(startX, endX),
      top: Math.min(startY, endY),
      rx: Math.abs(endX - startX) / 2,
      ry: Math.abs(endY - startY) / 2,
    } as any)
    return
  }

  if (tool === 'triangle') {
    object.set({
      left: Math.min(startX, endX),
      top: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY),
    })
    return
  }

  if (tool === 'diamond') {
    const width = Math.max(1, Math.abs(endX - startX))
    const height = Math.max(1, Math.abs(endY - startY))
    ;(object as fabric.Polygon).set({
      left: Math.min(startX, endX),
      top: Math.min(startY, endY),
      width,
      height,
      pathOffset: new fabric.Point(width / 2, height / 2),
      points: [
        { x: width / 2, y: 0 },
        { x: width, y: height / 2 },
        { x: width / 2, y: height },
        { x: 0, y: height / 2 },
      ],
    } as any)
    return
  }

  if (tool === 'line') {
    ;(object as fabric.Line).set({ x2: endX, y2: endY })
  }
}

function deleteSelectedInternal(canvas: fabric.Canvas): void {
  const activeObjects = canvas.getActiveObjects()
  if (activeObjects.length === 0) return
  canvas.discardActiveObject()
  activeObjects.forEach((object) => canvas.remove(object))
  canvas.requestRenderAll()
}

function eraseAt(canvas: fabric.Canvas, pointer: { x: number; y: number }): void {
  const point = new fabric.Point(pointer.x, pointer.y)
  const target = [...canvas.getObjects()].reverse().find((object) => object.containsPoint(point))
  if (target) {
    canvas.remove(target)
    canvas.requestRenderAll()
  }
}

function snap(value: number, size: number): number {
  return Math.round(value / size) * size
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

function isPrimaryDown(event: Event): boolean {
  if (event instanceof MouseEvent) return (event.buttons & 1) === 1
  if (event instanceof TouchEvent) return event.touches.length > 0
  return false
}

function ensureImageInput(ref: { current: HTMLInputElement | null }, onChange: () => void): void {
  if (ref.current) {
    ref.current.onchange = onChange
    return
  }

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.style.display = 'none'
  input.addEventListener('change', onChange)
  document.body.appendChild(input)
  ref.current = input
}

function isInputElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.contentEditable === 'true')
  )
}
