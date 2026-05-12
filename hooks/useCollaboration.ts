'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fabric } from 'fabric'
import type { CanvasEventType } from '@/types/canvas'

interface UseCollaborationOptions {
  boardId: string
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
}

/**
 * Subscribes to Supabase Realtime canal for canvas_events.
 * Applies remote canvas changes to local Fabric.js canvas.
 */
export function useCollaboration({ boardId, fabricRef }: UseCollaborationOptions) {
  const supabase = useMemo(() => createClient(), [])

  const applyRemoteEvent = useCallback(
    (eventType: CanvasEventType, payload: Record<string, unknown>) => {
      const canvas = fabricRef.current
      if (!canvas) return

      switch (eventType) {
        case 'object:added': {
          fabric.util.enlivenObjects(
            [payload],
            (objects: fabric.Object[]) => {
              objects.forEach((obj) => {
                (obj as fabric.Object & { _ignoreEvent: boolean })._ignoreEvent = true
                canvas.add(obj)
                canvas.renderAll()
              })
            },
            'fabric'
          )
          break
        }
        case 'object:modified': {
          const objects = canvas.getObjects()
          const target = objects.find(
            (o) => (o as fabric.Object & { id?: string }).id === (payload.id as string)
          )
          if (target) {
            target.set(payload as Partial<fabric.Object>)
            target.setCoords()
            canvas.renderAll()
          }
          break
        }
        case 'object:removed': {
          const objects = canvas.getObjects()
          const target = objects.find(
            (o) => (o as fabric.Object & { id?: string }).id === (payload.id as string)
          )
          if (target) canvas.remove(target)
          break
        }
        case 'canvas:cleared': {
          canvas.clear()
          break
        }
      }
    },
    [fabricRef]
  )

  useEffect(() => {
    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'canvas_events',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const event = payload.new as {
            event_type: CanvasEventType
            payload: Record<string, unknown>
            user_id: string
          }
          // Ignore own events (already applied locally)
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id !== event.user_id) {
              applyRemoteEvent(event.event_type, event.payload)
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId, supabase, applyRemoteEvent])
}
