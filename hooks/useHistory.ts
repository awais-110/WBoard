'use client'

import { useRef, useCallback } from 'react'
import { fabric } from 'fabric'

/**
 * Undo/Redo stack using Fabric.js JSON snapshots.
 * Call saveSnapshot() after every user action.
 */
export function useHistory(fabricRef: React.MutableRefObject<fabric.Canvas | null>) {
  const undoStack = useRef<string[]>([])
  const redoStack = useRef<string[]>([])

  const saveSnapshot = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    undoStack.current.push(JSON.stringify(canvas.toJSON(['id'])))
    redoStack.current = [] // clear redo on new action
    if (undoStack.current.length > 50) undoStack.current.shift() // cap at 50
  }, [fabricRef])

  const undo = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || undoStack.current.length === 0) return
    const current = JSON.stringify(canvas.toJSON(['id']))
    redoStack.current.push(current)
    const prev = undoStack.current.pop()!
    canvas.loadFromJSON(JSON.parse(prev), () => canvas.renderAll())
  }, [fabricRef])

  const redo = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || redoStack.current.length === 0) return
    const current = JSON.stringify(canvas.toJSON(['id']))
    undoStack.current.push(current)
    const next = redoStack.current.pop()!
    canvas.loadFromJSON(JSON.parse(next), () => canvas.renderAll())
  }, [fabricRef])

  return { saveSnapshot, undo, redo }
}
