import { fabric } from 'fabric'

// ─── Sticky Note ────────────────────────────────────────────────────────────

const STICKY_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff']

export function addStickyNote(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  color = STICKY_COLORS[0]
): void {
  const rect = new fabric.Rect({
    width: 220,
    height: 180,
    fill: color,
    rx: 12,
    ry: 12,
    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.12)', blur: 12, offsetY: 4 }),
    strokeWidth: 0,
  })

  const header = new fabric.Rect({
    width: 220,
    height: 32,
    fill: shadeColor(color, -15),
    rx: 12,
    ry: 12,
    strokeWidth: 0,
  })

  const headerBottom = new fabric.Rect({
    width: 220,
    height: 16,
    top: 16,
    fill: shadeColor(color, -15),
    strokeWidth: 0,
  })

  const text = new fabric.Textbox('Type here...', {
    left: 14,
    top: 42,
    width: 192,
    fontSize: 13,
    fontFamily: 'DM Sans, Inter, sans-serif',
    fill: '#374151',
    editable: true,
    selectable: true,
    evented: true,
  })

  const group = new fabric.Group([rect, header, headerBottom, text], {
    left: x,
    top: y,
    subTargetCheck: true,
    objectCaching: false,
  } as fabric.IGroupOptions)

  ;(group as any).id = crypto.randomUUID()
  ;(group as any).objectType = 'sticky'

  canvas.add(group)
  canvas.setActiveObject(group)
  canvas.requestRenderAll()
}

export { STICKY_COLORS }

export async function broadcastCanvasEvent(
  boardId: string,
  eventType: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await (supabase.from('canvas_events') as any).insert([
      {
        board_id: boardId,
        user_id: user.id,
        event_type: eventType,
        payload,
      },
    ] as any)
  } catch (err) {
    console.error('[broadcast] failed:', err)
  }
}

// ─── Rectangle ──────────────────────────────────────────────────────────────

export function addRectangle(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  width: number,
  height: number,
  stroke: string,
  fill: string,
  strokeWidth: number
): fabric.Rect {
  const rect = new fabric.Rect({
    left: x,
    top: y,
    width: Math.max(1, Math.abs(width)),
    height: Math.max(1, Math.abs(height)),
    fill,
    stroke,
    strokeWidth,
    strokeUniform: true,
    originX: 'left',
    originY: 'top',
  } as fabric.IRectOptions)

  ;(rect as any).id = crypto.randomUUID()
  canvas.add(rect)
  canvas.requestRenderAll()
  return rect
}

// ─── Ellipse ─────────────────────────────────────────────────────────────────

export function addEllipse(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  rx: number,
  ry: number,
  stroke: string,
  fill: string,
  strokeWidth: number
): fabric.Ellipse {
  const ellipse = new fabric.Ellipse({
    left: x,
    top: y,
    rx: Math.max(1, Math.abs(rx)),
    ry: Math.max(1, Math.abs(ry)),
    fill,
    stroke,
    strokeWidth,
    strokeUniform: true,
    originX: 'left',
    originY: 'top',
  })

  ;(ellipse as any).id = crypto.randomUUID()
  canvas.add(ellipse)
  canvas.requestRenderAll()
  return ellipse
}

// keep old addCircle for backwards compat
export function addCircle(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  radius: number,
  stroke: string,
  fill: string,
  strokeWidth: number
): fabric.Circle {
  const circle = new fabric.Circle({
    left: x,
    top: y,
    radius: Math.abs(radius),
    fill,
    stroke,
    strokeWidth,
    strokeUniform: true,
  } as fabric.ICircleOptions)

  ;(circle as any).id = crypto.randomUUID()
  canvas.add(circle)
  canvas.requestRenderAll()
  return circle
}

// ─── Arrow (Line + Arrowhead) ────────────────────────────────────────────────

export function addArrow(
  canvas: fabric.Canvas,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  strokeWidth: number
): fabric.Group {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const headLen = Math.max(12, strokeWidth * 4)
  const headAngle = (angle * 180) / Math.PI + 90

  const line = new fabric.Line([x1, y1, x2, y2], {
    stroke,
    strokeWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  })

  // Arrowhead as triangle
  const arrowHead = new fabric.Triangle({
    left: x2,
    top: y2,
    width: headLen,
    height: headLen,
    fill: stroke,
    angle: headAngle,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  })

  const group = new fabric.Group([line, arrowHead], {
    selectable: true,
    evented: true,
  })

  ;(group as any).id = crypto.randomUUID()
  ;(group as any).objectType = 'arrow'

  canvas.add(group)
  canvas.requestRenderAll()
  return group
}

// legacy addLine kept for compat
export function addLine(
  canvas: fabric.Canvas,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  strokeWidth: number
): fabric.Line {
  const line = new fabric.Line([x1, y1, x2, y2], {
    stroke,
    strokeWidth,
    selectable: true,
    strokeUniform: true,
  } as fabric.ILineOptions)

  ;(line as any).id = crypto.randomUUID()
  canvas.add(line)
  canvas.requestRenderAll()
  return line
}

// ─── Text ────────────────────────────────────────────────────────────────────

export function addText(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  text: string,
  fill: string,
  fontSize = 16,
  fontFamily = 'DM Sans, Inter, sans-serif'
): fabric.Textbox {
  const iText = new fabric.Textbox(text || 'Click to edit', {
    left: x,
    top: y,
    fontSize,
    fontFamily,
    fill,
    editable: true,
    selectable: true,
    evented: true,
    width: 200,
    breakWords: true,
  } as fabric.ITextboxOptions)

  ;(iText as any).id = crypto.randomUUID()

  canvas.add(iText)
  canvas.setActiveObject(iText)
  iText.enterEditing()
  iText.selectAll()
  canvas.requestRenderAll()
  return iText
}

// ─── Freehand pen (smooth Catmull-Rom) ──────────────────────────────────────

export function enableFreeDraw(
  canvas: fabric.Canvas,
  stroke: string,
  strokeWidth: number
): void {
  canvas.isDrawingMode = true
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
  canvas.freeDrawingBrush.color = stroke
  canvas.freeDrawingBrush.width = strokeWidth
  ;(canvas.freeDrawingBrush as any).decimate = 4
}

export function disableFreeDraw(canvas: fabric.Canvas): void {
  canvas.isDrawingMode = false
}

// ─── Duplicate selected ──────────────────────────────────────────────────────

export function duplicateSelected(canvas: fabric.Canvas): void {
  const active = canvas.getActiveObject()
  if (!active) return

  active.clone((cloned: fabric.Object) => {
    cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 })
    ;(cloned as any).id = crypto.randomUUID()

    if (cloned.type === 'activeSelection') {
      (cloned as fabric.ActiveSelection).canvas = canvas
      ;(cloned as fabric.ActiveSelection).forEachObject((obj) => canvas.add(obj))
      cloned.setCoords()
    } else {
      canvas.add(cloned)
    }

    canvas.setActiveObject(cloned)
    canvas.requestRenderAll()
  })
}

// ─── Z-index helpers ─────────────────────────────────────────────────────────

export function bringForward(canvas: fabric.Canvas): void {
  const obj = canvas.getActiveObject()
  if (obj) {
    canvas.bringForward(obj)
    canvas.requestRenderAll()
  }
}

export function sendBackward(canvas: fabric.Canvas): void {
  const obj = canvas.getActiveObject()
  if (obj) {
    canvas.sendBackwards(obj)
    canvas.requestRenderAll()
  }
}

export function bringToFront(canvas: fabric.Canvas): void {
  const obj = canvas.getActiveObject()
  if (obj) {
    canvas.bringToFront(obj)
    canvas.requestRenderAll()
  }
}

export function sendToBack(canvas: fabric.Canvas): void {
  const obj = canvas.getActiveObject()
  if (obj) {
    canvas.sendToBack(obj)
    canvas.requestRenderAll()
  }
}

// ─── Lock / Unlock ───────────────────────────────────────────────────────────

export function toggleLock(canvas: fabric.Canvas): void {
  const obj = canvas.getActiveObject()
  if (!obj) return

  const locked = (obj as any).locked ?? false
  obj.set({
    lockMovementX: !locked,
    lockMovementY: !locked,
    lockRotation: !locked,
    lockScalingX: !locked,
    lockScalingY: !locked,
    selectable: locked,
    evented: locked,
    hasControls: locked,
  })
  ;(obj as any).locked = !locked
  canvas.requestRenderAll()
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent))
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent))
  return `rgb(${r},${g},${b})`
}