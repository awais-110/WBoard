import { fabric } from 'fabric'

const MIN_ZOOM = 0.05
const MAX_ZOOM = 5
const ZOOM_FACTOR = 0.95

export function initializeCanvas(
  element: HTMLCanvasElement,
  width: number,
  height: number
): fabric.Canvas {
  const canvas = new fabric.Canvas(element, {
    isDrawingMode: false,
    selection: true,
    backgroundColor: '#ffffff',
    width,
    height,
    preserveObjectStacking: true,
    renderOnAddRemove: false,
    stopContextMenu: true,
    fireRightClick: true,
    enableRetinaScaling: true,
  })

  fabric.Object.prototype.set({
    borderColor: '#0abfbc',
    cornerColor: '#0abfbc',
    cornerSize: 8,
    cornerStyle: 'circle',
    transparentCorners: false,
    borderScaleFactor: 1.5,
    padding: 4,
  })

  return canvas
}

export function setupCanvasResize(
  canvas: fabric.Canvas,
  containerEl: HTMLElement,
  onResize?: (width: number, height: number) => void
): () => void {
  let raf = 0

  const resize = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      const width = containerEl.clientWidth
      const height = containerEl.clientHeight
      canvas.setDimensions({ width, height })
      canvas.calcOffset()
      canvas.requestRenderAll()
      onResize?.(width, height)
    })
  }

  const observer = new ResizeObserver(resize)
  observer.observe(containerEl)
  resize()

  return () => {
    observer.disconnect()
    cancelAnimationFrame(raf)
  }
}

export function setupCanvasZoom(canvas: fabric.Canvas): () => void {
  const onWheel = (opt: fabric.IEvent<WheelEvent>) => {
    const e = opt.e
    e.preventDefault()
    e.stopPropagation()

    const zoom = clampZoom(canvas.getZoom() * (e.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR))
    canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoom)
    canvas.requestRenderAll()
  }

  canvas.on('mouse:wheel', onWheel)
  return () => canvas.off('mouse:wheel', onWheel)
}

export function setupCanvasPan(canvas: fabric.Canvas): () => void {
  let isPanning = false
  let lastPoint = { x: 0, y: 0 }
  let spaceDown = false

  const onMouseDown = (opt: fabric.IEvent<MouseEvent>) => {
    const event = opt.e
    if (event.button !== 1 && !spaceDown) return
    isPanning = true
    lastPoint = { x: event.clientX, y: event.clientY }
    canvas.defaultCursor = 'grabbing'
    canvas.selection = false
  }

  const onMouseMove = (opt: fabric.IEvent<MouseEvent>) => {
    if (!isPanning) return
    const event = opt.e
    const viewport = canvas.viewportTransform
    if (!viewport) return

    viewport[4] += event.clientX - lastPoint.x
    viewport[5] += event.clientY - lastPoint.y
    lastPoint = { x: event.clientX, y: event.clientY }

    canvas.setViewportTransform(viewport)
    canvas.requestRenderAll()
  }

  const onMouseUp = () => {
    if (!isPanning) return
    isPanning = false
    canvas.selection = true
    canvas.defaultCursor = spaceDown ? 'grab' : 'default'
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Space' && !isInputElement(event.target)) {
      spaceDown = true
      if (!isPanning) canvas.defaultCursor = 'grab'
    }
  }

  const onKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      spaceDown = false
      if (!isPanning) canvas.defaultCursor = 'default'
    }
  }

  canvas.on('mouse:down', onMouseDown)
  canvas.on('mouse:move', onMouseMove)
  canvas.on('mouse:up', onMouseUp)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  return () => {
    canvas.off('mouse:down', onMouseDown)
    canvas.off('mouse:move', onMouseMove)
    canvas.off('mouse:up', onMouseUp)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
  }
}

export function setupCanvasKeyboardShortcuts(
  canvas: fabric.Canvas,
  handlers: {
    undo: () => void
    redo: () => void
    deleteSelected: () => void
    selectAll: () => void
    duplicate?: () => void
  }
): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (isInputElement(event.target)) return

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      handlers.deleteSelected()
      return
    }

    if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      handlers.selectAll()
      return
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'd') {
      event.preventDefault()
      handlers.duplicate?.()
      return
    }

    if (event.key === 'Escape') {
      canvas.discardActiveObject()
      canvas.requestRenderAll()
      return
    }

    if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      handlers.undo()
      return
    }

    if ((event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z') || (event.ctrlKey && event.key.toLowerCase() === 'y')) {
      event.preventDefault()
      handlers.redo()
    }
  }

  document.addEventListener('keydown', onKeyDown)
  return () => document.removeEventListener('keydown', onKeyDown)
}

export function renderGrid(
  canvas: fabric.Canvas,
  gridSize = 20,
  color = 'rgba(0,0,0,0.08)'
): void {
  const context = canvas.getContext()
  if (!context) return

  const zoom = canvas.getZoom()
  const viewport = canvas.viewportTransform
  const width = canvas.getWidth()
  const height = canvas.getHeight()
  const step = Math.max(2, gridSize * zoom)
  const offsetX = ((viewport?.[4] ?? 0) % step + step) % step
  const offsetY = ((viewport?.[5] ?? 0) % step + step) % step

  context.save()
  context.fillStyle = color

  for (let x = offsetX; x < width; x += step) {
    for (let y = offsetY; y < height; y += step) {
      context.beginPath()
      context.arc(x, y, 1, 0, Math.PI * 2)
      context.fill()
    }
  }

  context.restore()
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

function isInputElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.contentEditable === 'true')
  )
}