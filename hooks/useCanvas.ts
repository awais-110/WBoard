'use client'

import { useCallback, useEffect, useRef } from 'react'
import { fabric } from 'fabric'
import { useShallow } from 'zustand/react/shallow'
import { createClient } from '@/lib/supabase/client'
import { useHandwritingRecognition } from '@/hooks/useHandwritingRecognition'
import { useCanvasStore } from '@/stores/canvasStore'
import { useSaveStore } from '@/stores/saveStore'
import type { CanvasEventType, ToolType } from '@/types/canvas'
import {
  addArrow,
  addStickyNote,
  addText,
  broadcastCanvasEvent,
  disableFreeDraw,
  duplicateSelected,
  enableFreeDraw,
} from '@/lib/fabric/tools'
import { initializeCanvas, setupCanvasPan, setupCanvasResize } from '@/lib/fabric/init'

const MIN_ZOOM = 0.05
const MAX_ZOOM = 5
const ZOOM_FACTOR = 0.95

interface UseCanvasOptions {
  boardId: string
  canEdit: boolean
  onObjectAdded?: (obj: fabric.Object) => void
  onObjectModified?: (obj: fabric.Object) => void
  onObjectRemoved?: (obj: fabric.Object) => void
}

// Event flush timer and flush function retained for compatibility with previous
// queue-based implementation. Current broadcasting sends immediately, so
// these are no-ops but must exist to satisfy cleanup references.
let eventFlushTimer: ReturnType<typeof setInterval> | null = null
async function flushEventQueue(): Promise<void> {
  return
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
  const handwritingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handwritingPathIdsRef = useRef<Set<string>>(new Set())
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

  const activeToolRef = useRef(activeTool)
  const styleRef = useRef({ strokeColor, fillColor, strokeWidth, opacity, fontSize, fontFamily, snapToGrid, gridSize })
  const { recognize, isRecognizing } = useHandwritingRecognition()

  useEffect(() => {
    activeToolRef.current = activeTool
  }, [activeTool])

  useEffect(() => {
    styleRef.current = { strokeColor, fillColor, strokeWidth, opacity, fontSize, fontFamily, snapToGrid, gridSize }
  }, [fillColor, fontFamily, fontSize, gridSize, opacity, snapToGrid, strokeColor, strokeWidth])

  const runHandwritingRecognition = useCallback(
    async (canvas: fabric.Canvas, debouncedSave: () => void) => {
      if (isRecognizing) return

      if (handwritingTimerRef.current) {
        clearTimeout(handwritingTimerRef.current)
        handwritingTimerRef.current = null
      }

      const pathIds = Array.from(handwritingPathIdsRef.current)
      if (pathIds.length === 0) return

      const paths = canvas
        .getObjects()
        .filter((object): object is fabric.Path => object.type === 'path' && pathIds.includes(ensureObjectId(object)))

      if (paths.length === 0) {
        handwritingPathIdsRef.current.clear()
        return
      }

      const recognition = await recognize({ canvas, objects: paths, padding: 18, language: 'eng' })
      if (!recognition) return

      const text = recognition.text.trim()
      if (!text) return

      paths.forEach((path) => canvas.remove(path))

      const textObject = new fabric.IText(text, {
        left: recognition.left,
        top: recognition.top,
        fill: styleRef.current.strokeColor,
        fontSize: Math.max(16, styleRef.current.fontSize),
        fontFamily: styleRef.current.fontFamily,
        editable: true,
        selectable: true,
        evented: true,
        id: crypto.randomUUID(),
      } as any)

      canvas.add(textObject)
      canvas.setActiveObject(textObject)
      canvas.requestRenderAll()
      handwritingPathIdsRef.current.clear()
      debouncedSave()
    },
    [isRecognizing, recognize]
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
        }, 50)
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

    const onPathCreated = (event: fabric.IEvent) => {
      const path = (event as fabric.IEvent & { path?: fabric.Path }).path
      if (!path) {
        debouncedSave()
        return
      }

      const pathId = ensureObjectId(path)
      const currentTool = activeToolRef.current

      if (currentTool === 'handwrite') {
        handwritingPathIdsRef.current.add(pathId)
        if (handwritingTimerRef.current) clearTimeout(handwritingTimerRef.current)
        handwritingTimerRef.current = setTimeout(() => {
          void runHandwritingRecognition(canvas, debouncedSave)
        }, 1000)
        debouncedSave()
        return
      }

      if (currentTool === 'pen') {
        const detectedShape = detectFreehandShape(path)
        if (detectedShape) {
          replacePathWithShape(canvas, path, detectedShape)
          debouncedSave()
          return
        }
      }

      debouncedSave()
    }

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
    cleanupRef.current.push(() => {
      if (handwritingTimerRef.current) {
        clearTimeout(handwritingTimerRef.current)
        handwritingTimerRef.current = null
      }
    })

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      cleanupRef.current.forEach((cleanup) => cleanup())
      cleanupRef.current = []
      canvas.dispose()
      fabricRef.current = null
      if ((window as any).__fabric__ === canvas) {
        delete (window as any).__fabric__
      }
      // Flush any queued canvas events and stop the periodic flush when the canvas unmounts
      try {
        void flushEventQueue()
      } catch (e) {
        /* ignore */
      }
      if (eventFlushTimer) {
        window.removeEventListener('beforeunload', flushEventQueue)
        clearInterval(eventFlushTimer)
        eventFlushTimer = null
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

      if (activeTool === 'pen' || activeTool === 'handwrite') {
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

  return { canvasRef, fabricRef, loadFromJSON, toJSON, clear, deleteSelected, zoomIn, zoomOut, zoomFit, alignObjects, isRecognizing }
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
    case 'handwrite':
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

type FreehandShape = 'line' | 'rectangle' | 'circle' | 'triangle'

function ensureObjectId(object: fabric.Object): string {
  const existingId = (object as any).id as string | undefined
  if (existingId) return existingId

  const id = crypto.randomUUID()
  object.set('id', id)
  return id
}

function detectFreehandShape(path: fabric.Path): FreehandShape | null {
  const points = extractPathPoints(path)
  if (points.length < 4) return null

  const bounds = path.getBoundingRect(true, true)
  const start = points[0]
  const end = points[points.length - 1]

  if (isStraightStroke(points, bounds, start, end)) return 'line'
  if (isCircleStroke(points, bounds, start, end)) return 'circle'
  if (isTriangleStroke(points, bounds, start, end)) return 'triangle'
  if (isRectangleStroke(points, bounds, start, end)) return 'rectangle'

  return null
}

function replacePathWithShape(canvas: fabric.Canvas, path: fabric.Path, shape: FreehandShape): void {
  const bounds = path.getBoundingRect(true, true)
  const stroke = path.stroke ?? '#111827'
  const strokeWidth = path.strokeWidth ?? 2
  const id = ensureObjectId(path)

  canvas.remove(path)

  let replacement: fabric.Object | null = null

  if (shape === 'line') {
    replacement = new fabric.Line([bounds.left, bounds.top, bounds.left + bounds.width, bounds.top + bounds.height], {
      left: bounds.left,
      top: bounds.top,
      stroke,
      strokeWidth,
      fill: '',
      selectable: true,
      evented: true,
      strokeUniform: true,
      id,
    } as any)
  }

  if (shape === 'rectangle') {
    replacement = new fabric.Rect({
      left: bounds.left,
      top: bounds.top,
      width: Math.max(1, bounds.width),
      height: Math.max(1, bounds.height),
      fill: 'transparent',
      stroke,
      strokeWidth,
      selectable: true,
      evented: true,
      id,
    } as any)
  }

  if (shape === 'circle') {
    replacement = new fabric.Ellipse({
      left: bounds.left,
      top: bounds.top,
      rx: Math.max(1, bounds.width / 2),
      ry: Math.max(1, bounds.height / 2),
      fill: 'transparent',
      stroke,
      strokeWidth,
      selectable: true,
      evented: true,
      id,
    } as any)
  }

  if (shape === 'triangle') {
    replacement = new fabric.Triangle({
      left: bounds.left,
      top: bounds.top,
      width: Math.max(1, bounds.width),
      height: Math.max(1, bounds.height),
      fill: 'transparent',
      stroke,
      strokeWidth,
      selectable: true,
      evented: true,
      id,
    } as any)
  }

  if (!replacement) return

  canvas.add(replacement)
  canvas.setActiveObject(replacement)
  canvas.requestRenderAll()
}

function extractPathPoints(path: fabric.Path): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = []
  const segments = path.path as Array<Array<string | number>>

  segments.forEach((segment) => {
    const [command, ...values] = segment

    if (command === 'M' || command === 'L') {
      if (typeof values[0] === 'number' && typeof values[1] === 'number') {
        points.push({ x: values[0], y: values[1] })
      }
      return
    }

    if (command === 'Q') {
      if (typeof values[0] === 'number' && typeof values[1] === 'number') {
        points.push({ x: values[0], y: values[1] })
      }
      if (typeof values[2] === 'number' && typeof values[3] === 'number') {
        points.push({ x: values[2], y: values[3] })
      }
      return
    }

    if (command === 'C') {
      if (typeof values[0] === 'number' && typeof values[1] === 'number') {
        points.push({ x: values[0], y: values[1] })
      }
      if (typeof values[2] === 'number' && typeof values[3] === 'number') {
        points.push({ x: values[2], y: values[3] })
      }
      if (typeof values[4] === 'number' && typeof values[5] === 'number') {
        points.push({ x: values[4], y: values[5] })
      }
    }
  })

  return points.length > 0 ? points : [{ x: 0, y: 0 }]
}

function isStraightStroke(
  points: Array<{ x: number; y: number }>,
  bounds: fabric.IRect,
  start: { x: number; y: number },
  end: { x: number; y: number }
): boolean {
  const directDistance = distance(start, end)
  if (directDistance < Math.max(24, Math.min(bounds.width, bounds.height) * 1.3)) return false

  const pathLength = points.reduce((total, point, index) => {
    if (index === 0) return total
    return total + distance(points[index - 1], point)
  }, 0)

  const maxDeviation = points.reduce((max, point) => {
    return Math.max(max, distanceToLine(point, start, end))
  }, 0)

  return pathLength / directDistance < 1.35 && maxDeviation < Math.max(12, Math.min(bounds.width, bounds.height) * 0.18)
}

function isCircleStroke(
  points: Array<{ x: number; y: number }>,
  bounds: fabric.IRect,
  start: { x: number; y: number },
  end: { x: number; y: number }
): boolean {
  const size = Math.max(bounds.width, bounds.height)
  if (size < 28) return false

  const ratio = bounds.width / Math.max(1, bounds.height)
  const closedness = distance(start, end) < size * 0.35
  if (!closedness || ratio < 0.75 || ratio > 1.35) return false

  const center = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
  const distances = points.map((point) => distance(point, center))
  const averageDistance = distances.reduce((sum, value) => sum + value, 0) / distances.length
  const meanDeviation = distances.reduce((sum, value) => sum + Math.abs(value - averageDistance), 0) / distances.length

  return meanDeviation / Math.max(averageDistance, 1) < 0.22
}

function isTriangleStroke(
  points: Array<{ x: number; y: number }>,
  bounds: fabric.IRect,
  start: { x: number; y: number },
  end: { x: number; y: number }
): boolean {
  if (!isClosedStroke(bounds, start, end)) return false
  return countCorners(points) === 3
}

function isRectangleStroke(
  points: Array<{ x: number; y: number }>,
  bounds: fabric.IRect,
  start: { x: number; y: number },
  end: { x: number; y: number }
): boolean {
  if (!isClosedStroke(bounds, start, end)) return false
  const corners = countCorners(points)
  return corners >= 4 && corners <= 6
}

function isClosedStroke(bounds: fabric.IRect, start: { x: number; y: number }, end: { x: number; y: number }): boolean {
  const size = Math.max(bounds.width, bounds.height)
  return distance(start, end) < Math.max(20, size * 0.35)
}

function countCorners(points: Array<{ x: number; y: number }>): number {
  const simplified = simplifyPoints(points, 6)
  if (simplified.length < 4) return 0

  let corners = 0

  for (let index = 1; index < simplified.length - 1; index += 1) {
    const previous = simplified[index - 1]
    const current = simplified[index]
    const next = simplified[index + 1]

    const angleA = Math.atan2(current.y - previous.y, current.x - previous.x)
    const angleB = Math.atan2(next.y - current.y, next.x - current.x)
    const difference = Math.abs(normalizeAngle(angleB - angleA))

    if (difference > Math.PI / 4) corners += 1
  }

  return corners
}

function simplifyPoints(points: Array<{ x: number; y: number }>, threshold: number): Array<{ x: number; y: number }> {
  const simplified: Array<{ x: number; y: number }> = [points[0]]

  for (let index = 1; index < points.length; index += 1) {
    if (distance(points[index], simplified[simplified.length - 1]) >= threshold) {
      simplified.push(points[index])
    }
  }

  if (simplified.length === 1 && points.length > 1) {
    simplified.push(points[points.length - 1])
  }

  return simplified
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function distanceToLine(point: { x: number; y: number }, start: { x: number; y: number }, end: { x: number; y: number }): number {
  const lineLength = distance(start, end)
  if (lineLength === 0) return distance(point, start)

  const numerator = Math.abs(
    (end.y - start.y) * point.x -
      (end.x - start.x) * point.y +
      end.x * start.y -
      end.y * start.x
  )

  return numerator / lineLength
}

function normalizeAngle(value: number): number {
  let angle = value
  while (angle > Math.PI) angle -= Math.PI * 2
  while (angle < -Math.PI) angle += Math.PI * 2
  return angle
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
