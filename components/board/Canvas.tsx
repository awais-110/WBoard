'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useCanvas } from '../../hooks/useCanvas'
import { useCollaboration } from '@/hooks/useCollaboration'
import { usePresence } from '@/hooks/usePresence'
import { deserializeCanvas } from '@/lib/fabric/serialize'
import { renderGrid } from '@/lib/fabric/init'
import { useCanvasStore } from '@/stores/canvasStore'
import CollaboratorCursors from './CollaboratorCursors'
import type { CanvasData } from '@/types/canvas'
import type { fabric } from 'fabric'

interface CanvasProps {
  boardId: string
  initialData: CanvasData
  canEdit: boolean
  onCanvasReady?: (fabricRef: React.MutableRefObject<fabric.Canvas | null>) => void
  onReady?: () => void
}

export default function Canvas({
  boardId,
  initialData,
  canEdit,
  onCanvasReady,
  onReady,
}: CanvasProps) {
  const { canvasRef, fabricRef } = useCanvas({ boardId, canEdit })
  const { updateCursor } = usePresence(boardId)
  useCollaboration({ boardId, fabricRef })

  const showGrid = useCanvasStore((s) => s.showGrid)
  const gridSize = useCanvasStore((s) => s.gridSize)
  const setZoom = useCanvasStore((s) => s.setZoom)

  const [isEmpty, setIsEmpty] = useState(!(initialData?.objects?.length))
  const onCanvasReadyRef = useRef(onCanvasReady)
  const onReadyRef = useRef(onReady)
  const hasNotifiedRef = useRef(false)
  const hasReadyNotifiedRef = useRef(false)
  const initialDataRef = useRef(initialData)
  const cursorTsRef = useRef(0)

  useEffect(() => { onCanvasReadyRef.current = onCanvasReady }, [onCanvasReady])
  useEffect(() => { onReadyRef.current = onReady }, [onReady])

  // Notify parent once
  useEffect(() => {
    if (fabricRef.current && onCanvasReadyRef.current && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true
      onCanvasReadyRef.current(fabricRef)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (fabricRef.current && !initialDataRef.current?.objects?.length && onReadyRef.current && !hasReadyNotifiedRef.current) {
      hasReadyNotifiedRef.current = true
      onReadyRef.current()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load initial data once
  useEffect(() => {
    if (fabricRef.current && initialDataRef.current?.objects?.length) {
      deserializeCanvas(fabricRef.current, initialDataRef.current).then(() => {
        setIsEmpty(false)
        if (onReadyRef.current && !hasReadyNotifiedRef.current) {
          hasReadyNotifiedRef.current = true
          onReadyRef.current()
        }
      })
    }
    if (fabricRef.current && !initialDataRef.current?.objects?.length && onReadyRef.current && !hasReadyNotifiedRef.current) {
      hasReadyNotifiedRef.current = true
      onReadyRef.current()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track empty state
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const update = () => setIsEmpty(canvas.getObjects().length === 0)
    canvas.on('object:added', update)
    canvas.on('object:removed', update)
    canvas.on('canvas:cleared', update)
    update()
    return () => {
      canvas.off('object:added', update)
      canvas.off('object:removed', update)
      canvas.off('canvas:cleared', update)
    }
  }, [fabricRef])

  // Grid overlay — redraws on zoom/pan
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const drawGrid = () => {
      if (showGrid) renderGrid(canvas, gridSize)
    }

    if (showGrid) {
      canvas.on('after:render', drawGrid)
    } else {
      canvas.off('after:render', drawGrid)
    }

    canvas.requestRenderAll()

    return () => { canvas.off('after:render', drawGrid) }
  }, [fabricRef, showGrid, gridSize])

  // Sync zoom to store
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const onZoom = () => setZoom(Math.round(canvas.getZoom() * 100) / 100)
    canvas.on('mouse:wheel', onZoom)
    return () => { canvas.off('mouse:wheel', onZoom) }
  }, [fabricRef, setZoom])

  // Throttled cursor update — 16ms (~60fps)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = performance.now()
    if (now - cursorTsRef.current < 16) return
    cursorTsRef.current = now
    const bounds = e.currentTarget.getBoundingClientRect()
    updateCursor(e.clientX - bounds.left, e.clientY - bounds.top)
  }, [updateCursor])

  return (
    <div
      className="whiteboard-dot-grid relative h-full w-full touch-none overflow-hidden bg-[#f7f5f0]"
      onMouseMove={handleMouseMove}
    >
      <canvas ref={canvasRef} className="block" />

      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5">
          <div className="max-w-[300px] rounded-2xl border border-black/[0.08] bg-white/90 px-6 py-5 text-center shadow-lg shadow-black/[0.06] backdrop-blur-sm">
            <div className="mb-2 text-2xl">✏️</div>
            <p className="text-sm font-semibold text-[#0d0d0d]">Canvas is empty</p>
            <p className="mt-1 text-xs leading-5 text-[#0d0d0d]/45">
              Pick a tool from the toolbar to start drawing
            </p>
          </div>
        </div>
      )}

      <CollaboratorCursors />
    </div>
  )
}