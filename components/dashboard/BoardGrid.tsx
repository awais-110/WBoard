'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BoardCard from './BoardCard'
import toast from 'react-hot-toast'
import type { DashboardBoard } from '@/types/board'

interface BoardGridProps {
  boards: DashboardBoard[]
  allowDelete?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

/**
 * Grid layout for displaying user's boards.
 */
export default function BoardGrid({
  boards: initialBoards,
  allowDelete = true,
  emptyTitle = 'No boards yet',
  emptyDescription = 'Create your first whiteboard and start sketching ideas with your team.',
}: BoardGridProps) {
  const [boards, setBoards] = useState(initialBoards)
  const router = useRouter()

  async function handleDelete(boardId: string) {
    try {
      const res = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setBoards(boards.filter((b) => b.id !== boardId))
      toast.success('Board deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete board')
    }
  }

  if (boards.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#0D0D0D]/15 bg-white/55 px-6 py-12 text-center shadow-[0_18px_45px_rgba(13,13,13,0.05)]">
        <div className="mx-auto h-14 w-20 rounded-2xl border border-[#0D0D0D]/10 bg-[#F7F5F0] shadow-sm" />
        <h2 className="mt-4 font-serif text-2xl font-semibold text-[#0D0D0D]">{emptyTitle}</h2>
        <p className="mt-1 text-sm text-[#0D0D0D]/55">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {boards.map((board, index) => (
        <BoardCard
          key={board.id}
          board={board}
          variant={index}
          onDelete={allowDelete && board.access === 'owned' ? handleDelete : undefined}
        />
      ))}
    </div>
  )
}
