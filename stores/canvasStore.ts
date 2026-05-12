import { create } from 'zustand'
import type { ToolType } from '@/types/canvas'

interface CanvasStore {
  activeTool: ToolType
  strokeColor: string
  fillColor: string
  strokeWidth: number
  setActiveTool: (tool: ToolType) => void
  setStrokeColor: (color: string) => void
  setFillColor: (color: string) => void
  setStrokeWidth: (width: number) => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  activeTool: 'select',
  strokeColor: '#000000',
  fillColor: 'transparent',
  strokeWidth: 2,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
}))