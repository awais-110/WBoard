import type { fabric } from 'fabric'
import type { CanvasData } from '@/types/canvas'

/**
 * Serialize Fabric canvas to JSON for persistence.
 */
export function serializeCanvas(canvas: fabric.Canvas): CanvasData {
  return canvas.toJSON(['id', 'selectable', 'evented']) as unknown as CanvasData
}

/**
 * Load JSON snapshot into Fabric canvas.
 */
export function deserializeCanvas(
  canvas: fabric.Canvas,
  data: CanvasData
): Promise<void> {
  return new Promise((resolve) => {
    canvas.loadFromJSON(data, () => {
      canvas.renderAll()
      resolve()
    })
  })
}
