export interface CanvasData {
  version?: string
  objects: FabricObject[]
  background?: string
}

export interface FabricObject {
  type: string
  version: string
  originX: string
  originY: string
  left: number
  top: number
  width: number
  height: number
  fill: string
  stroke: string | null
  strokeWidth: number
  [key: string]: any
}

export type ToolType =
  | 'select'
  | 'pen'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'text'
  | 'sticky'
  | 'eraser'
  | 'pan'

export type CanvasEventType =
  | 'object:added'
  | 'object:modified'
  | 'object:removed'
  | 'canvas:cleared'

export interface CanvasEvent {
  id: string
  board_id: string
  user_id: string
  event_type: CanvasEventType
  payload: Record<string, any>
  created_at: string
}