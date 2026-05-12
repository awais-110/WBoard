'use client'

import { useEffect, useCallback, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCollaborationStore } from '@/stores/collaborationStore'
import type { PresenceUser } from '@/types/user'

const CURSOR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#ec4899', '#14b8a6',
]

export function usePresence(boardId: string) {
  const supabase = useMemo(() => createClient(), [])
  const setPresenceUsers = useCollaborationStore.getState().setPresenceUsers
  const [myColor] = useState(
    () => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
  )
  const selfPresenceRef = useRef<PresenceUser | null>(null)
  const channelRef = ((globalThis as any).__presence_channels__ ||= {})

  useEffect(() => {
    // ✅ cleanup any stale channel first
    if (channelRef[boardId]) {
      try {
        channelRef[boardId].untrack()
        supabase.removeChannel(channelRef[boardId])
      } catch {}
      delete channelRef[boardId]
    }

    const channel = supabase.channel(`presence:${boardId}`, {
      config: { presence: { key: boardId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{
          userId: string
          fullName: string | null
          color: string
          cursor: { x: number; y: number } | null
          online_at: string
        }>()

        const seen = new Set<string>()
        const users: PresenceUser[] = Object.values(state)
          .flat()
          .filter((u) => {
            if (seen.has(u.userId)) return false
            seen.add(u.userId)
            return true
          })
          .map((u) => ({ ...u }))

        setPresenceUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const payload = {
              userId: user.id,
              fullName: user.user_metadata?.full_name ?? null,
              color: myColor,
              cursor: null,
              online_at: new Date().toISOString(),
            }
            selfPresenceRef.current = payload
            await channel.track(payload)
          }
        }
      })

    channelRef[boardId] = channel

    return () => {
      try {
        channel.untrack() // ✅ remove self from presence on unmount
        supabase.removeChannel(channel)
      } catch {}
      delete channelRef[boardId]
      setPresenceUsers([]) // ✅ clear users on leave
    }
  }, [boardId, supabase, myColor])

  const updateCursor = useCallback(
    (x: number, y: number) => {
      try {
        const ch = channelRef[boardId]
        if (!ch || !selfPresenceRef.current) return
        selfPresenceRef.current = {
          ...selfPresenceRef.current,
          cursor: { x, y },
          online_at: new Date().toISOString(),
        }
        ch.track(selfPresenceRef.current)
      } catch {}
    },
    [boardId]
  )

  return { updateCursor, myColor }
}