import { createClient } from '@/lib/supabase/client'
import type { CanvasEventType } from '@/types/canvas'
import { fabric } from 'fabric'

/**
 * Broadcasts a canvas event to Supabase so other users receive it via Realtime.
 */
export async function broadcastCanvasEvent(
  boardId: string,
  eventType: CanvasEventType,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventsTable = supabase.from('canvas_events') as any
  const { error } = await eventsTable.insert({
    board_id: boardId,
    user_id: user.id,
    event_type: eventType,
    payload,
  })

  if (error) console.error('[broadcastCanvasEvent]', error.message)
}

/**
 * Adds a colored sticky note to the canvas.
 */
export function addStickyNote(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  color = '#fef08a'
): void {
  const rect = new fabric.Rect({
    width: 180,
    height: 180,
    fill: color,
    rx: 4,
    ry: 4,
    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.15)', blur: 8, offsetY: 4 }),
  })

  const text = new fabric.IText('Type here...', {
    left: 10,
    top: 10,
    width: 160,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fill: '#374151',
    editable: true,
  })

  const group = new fabric.Group([rect, text], {
    left: x,
    top: y,
    id: crypto.randomUUID(),
  } as fabric.IGroupOptions & { id: string })

  canvas.add(group)
  canvas.setActiveObject(group)
  canvas.renderAll()
}

/**
 * Adds a rectangle to the canvas with current stroke/fill settings.
 */
export function addRectangle(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  width: number,
  height: number,
  stroke: string,
  fill: string,
  strokeWidth: number
): void {
  const rect = new fabric.Rect({
    left: x,
    top: y,
    width: Math.abs(width),
    height: Math.abs(height),
    fill,
    stroke,
    strokeWidth,
    id: crypto.randomUUID(),
  } as fabric.IRectOptions & { id: string })

  canvas.add(rect)
  canvas.renderAll()
}

/**
 * Adds a circle to the canvas.
 */
export function addCircle(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  radius: number,
  stroke: string,
  fill: string,
  strokeWidth: number
): void {
  const circle = new fabric.Circle({
    left: x,
    top: y,
    radius: Math.abs(radius),
    fill,
    stroke,
    strokeWidth,
    id: crypto.randomUUID(),
  } as fabric.ICircleOptions & { id: string })

  canvas.add(circle)
  canvas.renderAll()
}

/**
 * Adds a line to the canvas.
 */
export function addLine(
  canvas: fabric.Canvas,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  strokeWidth: number
): void {
  const line = new fabric.Line([x1, y1, x2, y2], {
    stroke,
    strokeWidth,
    selectable: true,
    id: crypto.randomUUID(),
  } as fabric.ILineOptions & { id: string })

  canvas.add(line)
  canvas.renderAll()
}

/**
 * Adds text to the canvas.
 */
export function addText(
  canvas: fabric.Canvas,
  x: number,
  y: number,
  text: string,
  fill: string
): void {
  const iText = new fabric.IText(text || 'Click to edit', {
    left: x,
    top: y,
    fontSize: 16,
    fontFamily: 'Inter, sans-serif',
    fill,
    editable: true,
    id: crypto.randomUUID(),
  } as fabric.ITextboxOptions & { id: string })

  canvas.add(iText)
  canvas.setActiveObject(iText)
  iText.enterEditing()
  canvas.renderAll()
}
