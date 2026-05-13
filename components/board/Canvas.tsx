'use client'

import { useEffect, useRef, useState } from 'react'
import { useCanvas } from '@/hooks/useCanvas'
import { useCollaboration } from '@/hooks/useCollaboration'
import { usePresence } from '@/hooks/usePresence'
import { deserializeCanvas } from '@/lib/fabric/serialize'
import CollaboratorCursors from './CollaboratorCursors'
import type { CanvasData } from '@/types/canvas'
import type { fabric } from 'fabric'

interface CanvasProps {
  boardId: string
  initialData: CanvasData
  canEdit: boolean
  onCanvasReady?: (fabricRef: React.MutableRefObject<fabric.Canvas | null>) => void
}

export default function Canvas({
  boardId,
  initialData,
  canEdit,
  onCanvasReady,
}: CanvasProps) {
  const { canvasRef, fabricRef } = useCanvas({ boardId, canEdit })
  const { updateCursor } = usePresence(boardId)
  useCollaboration({ boardId, fabricRef })
  const [isEmpty, setIsEmpty] = useState(!(initialData?.objects?.length))

  // Store onCanvasReady in a ref so it never triggers re-runs
  const onCanvasReadyRef = useRef(onCanvasReady)
  useEffect(() => {
    onCanvasReadyRef.current = onCanvasReady
  }, [onCanvasReady])

  // Notify parent once on mount — guarded so it only fires once
  const hasNotifiedRef = useRef(false)
  useEffect(() => {
    if (fabricRef.current && onCanvasReadyRef.current && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true
      onCanvasReadyRef.current(fabricRef)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // empty: run once after first mount

  // Load initial canvas data once — captured in ref to avoid re-runs
  const initialDataRef = useRef(initialData)
  useEffect(() => {
    if (fabricRef.current && initialDataRef.current?.objects?.length) {
      deserializeCanvas(fabricRef.current, initialDataRef.current).then(() => setIsEmpty(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // empty: initial data only loaded once on mount

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const updateEmptyState = () => setIsEmpty(canvas.getObjects().length === 0)
    canvas.on('object:added', updateEmptyState)
    canvas.on('object:removed', updateEmptyState)
    canvas.on('canvas:cleared', updateEmptyState)
    updateEmptyState()

    return () => {
      canvas.off('object:added', updateEmptyState)
      canvas.off('object:removed', updateEmptyState)
      canvas.off('canvas:cleared', updateEmptyState)
    }
  }, [fabricRef])

  return (
    <div
      className="whiteboard-dot-grid relative h-full w-full touch-none overflow-hidden bg-white"
      onMouseMove={(e) => {
        const now = performance.now()
        const last = (canvasRef.current as any)?._lastCursorUpdate || 0
        if (now - last > 50) {
          const bounds = e.currentTarget.getBoundingClientRect()
          updateCursor(e.clientX - bounds.left, e.clientY - bounds.top)
          if (canvasRef.current) (canvasRef.current as any)._lastCursorUpdate = now
        }
      }}
    >
      <canvas ref={canvasRef} className="block" />
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5">
          <div className="max-w-[280px] rounded-2xl border border-[#2a2a2a]/15 bg-white/90 px-5 py-4 text-center shadow-lg backdrop-blur sm:max-w-none sm:rounded-xl sm:px-6 sm:py-5">
            <p className="text-base font-semibold text-slate-900">Start drawing!</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">Pick a tool from the bottom dock to add shapes, text, or notes.</p>
          </div>
        </div>
      )}
      <CollaboratorCursors />
    </div>
  )
}
