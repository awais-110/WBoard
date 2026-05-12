import { fabric } from 'fabric'

/**
 * Initialize a Fabric.js canvas with default settings.
 */
export function initializeCanvas(
  element: HTMLCanvasElement,
  width: number,
  height: number
): fabric.Canvas {
  return new fabric.Canvas(element, {
    isDrawingMode: false,
    selection: true,
    backgroundColor: '#ffffff',
    width,
    height,
  })
}

/**
 * Setup canvas resize listener.
 */
export function setupCanvasResize(
  canvas: fabric.Canvas,
  onResize: (width: number, height: number) => void
): () => void {
  const handleResize = () => {
    const width = window.innerWidth
    const height = window.innerHeight - 64 // subtract header height
    canvas.setWidth(width)
    canvas.setHeight(height)
    canvas.renderAll()
    onResize(width, height)
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
  }
}

/**
 * Setup mouse wheel zoom on canvas.
 */
export function setupCanvasZoom(canvas: fabric.Canvas): void {
  canvas.on('mouse:wheel', (opt) => {
    const delta = (opt.e as WheelEvent).deltaY
    let zoom = canvas.getZoom()
    zoom *= 0.999 ** delta
    zoom = Math.min(Math.max(zoom, 0.1), 5)
    const wheelEvent = opt.e as WheelEvent
    const offsetX = wheelEvent.offsetX || 0
    const offsetY = wheelEvent.offsetY || 0
    canvas.zoomToPoint(
      { x: offsetX, y: offsetY } as fabric.Point,
      zoom
    )
    opt.e.preventDefault()
    opt.e.stopPropagation()
  })
}

/**
 * Setup keyboard shortcuts on canvas.
 */
export function setupCanvasKeyboardShortcuts(
  canvas: fabric.Canvas,
  handlers: {
    undo: () => void
    redo: () => void
    deleteSelected: () => void
    selectAll: () => void
  }
): void {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault()
      handlers.undo()
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
      e.preventDefault()
      handlers.redo()
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputElement(e.target)) {
      e.preventDefault()
      handlers.deleteSelected()
    }
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault()
      handlers.selectAll()
    }
  })
}

/**
 * Check if target is an input element.
 */
function isInputElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.contentEditable === 'true')
  )
}
