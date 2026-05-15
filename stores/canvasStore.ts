import { create } from 'zustand'
import type { ToolType } from '@/types/canvas'

interface CanvasStore {
  // Tool
  activeTool: ToolType
  // Style
  strokeColor: string
  fillColor: string
  strokeWidth: number
  opacity: number
  // Text
  fontSize: number
  fontFamily: string
  // Grid
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  // UI state
  isPropertiesPanelOpen: boolean
  zoom: number
  // Actions
  setActiveTool: (tool: ToolType) => void
  setStrokeColor: (color: string) => void
  setFillColor: (color: string) => void
  setStrokeWidth: (width: number) => void
  setOpacity: (opacity: number) => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  toggleGrid: () => void
  toggleSnap: () => void
  setGridSize: (size: number) => void
  setPropertiesPanelOpen: (open: boolean) => void
  setZoom: (zoom: number) => void
  resetStyles: () => void
}

const DEFAULT_STYLES = {
  strokeColor: '#0d0d0d',
  fillColor: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
  fontFamily: 'DM Sans',
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  activeTool: 'select',
  ...DEFAULT_STYLES,
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
  isPropertiesPanelOpen: false,
  zoom: 1,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setOpacity: (opacity) => set({ opacity }),
  setFontSize: (fontSize) => set({ fontSize }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  setGridSize: (gridSize) => set({ gridSize }),
  setPropertiesPanelOpen: (isPropertiesPanelOpen) => set({ isPropertiesPanelOpen }),
  setZoom: (zoom) => set({ zoom }),
  resetStyles: () => set({ ...DEFAULT_STYLES }),
}))