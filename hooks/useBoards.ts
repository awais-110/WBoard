'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Board } from '@/types/board'

/**
 * Provides CRUD operations for boards.
 */
export function useBoards() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getBoards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: err } = await supabase
        .from('boards')
        .select('*')
        .or(`owner_id.eq.${user.id},board_members.user_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

      if (err) throw err
      return data as Board[]
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch boards'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createBoard = useCallback(
    async (title = 'Untitled Board') => {
      setLoading(true)
      setError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boardsTable = supabase.from('boards') as any
        const { data, error: err } = await boardsTable
          .insert({ title, owner_id: user.id, canvas_data: {} })
          .select()
          .single()

        if (err) throw err
        return data as Board
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create board'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const deleteBoard = useCallback(
    async (boardId: string) => {
      setLoading(true)
      setError(null)
      try {
        const { error: err } = await supabase
          .from('boards')
          .delete()
          .eq('id', boardId)

        if (err) throw err
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete board'
        setError(message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const updateBoard = useCallback(
    async (boardId: string, updates: Partial<Board>) => {
      setLoading(true)
      setError(null)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boardsTable = supabase.from('boards') as any
        const { data, error: err } = await boardsTable
          .update(updates)
          .eq('id', boardId)
          .select()
          .single()

        if (err) throw err
        return data as Board
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update board'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  return { getBoards, createBoard, deleteBoard, updateBoard, loading, error }
}
