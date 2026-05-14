import { create } from 'zustand'
import type { ToolType } from '@/types/canvas'

interface CanvasStore {
  activeTool: ToolType
  strokeColor: string
  fillColor: string
  strokeWidth: number
  opacity: number
  fontSize: number
  fontFamily: string
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  setActiveTool: (tool: ToolType) => void
  setStrokeColor: (color: string) => void
  setFillColor: (color: string) => void
  setStrokeWidth: (width: number) => void
  setOpacity: (opacity: number) => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  toggleGrid: () => void
  toggleSnap: () => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  activeTool: 'select',
  strokeColor: '#000000',
  fillColor: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
  fontFamily: 'Inter',
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setOpacity: (opacity) => set({ opacity }),
  setFontSize: (fontSize) => set({ fontSize }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
}))