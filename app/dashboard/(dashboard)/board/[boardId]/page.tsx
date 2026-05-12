import { createClient } from '@/lib/supabase/server'
import BoardContent from '@/components/board/BoardContent'
import { notFound, redirect } from 'next/navigation'
import type { Board } from '@/types/board'

interface Props {
  params: { boardId: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data: board } = await supabase
    .from('boards')
    .select('title')
    .eq('id', params.boardId)
    .single<Board>()

  return {
    title: board?.title ? `${board.title} - Collaborative Whiteboard` : 'Whiteboard',
  }
}

/**
 * Main whiteboard page component.
 */
export default async function BoardPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch board
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', params.boardId)
    .single<Board>()

  if (boardError || !board) {
    notFound()
  }

  // Check access
  const isOwner = board.owner_id === user.id
  const { data: membership } = await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', board.id)
    .eq('user_id', user.id)
    .single<{ role: string }>()

  const canEdit: boolean =
    isOwner || (membership !== null && ['editor', 'admin'].includes(membership.role))

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BoardContent board={board} canEdit={canEdit} />
    </div>
  )
}
