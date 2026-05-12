
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import BoardContent from '@/components/board/BoardContent'

export const dynamic = 'force-dynamic'

interface BoardPageProps {
  params: { boardId: string }
}

export async function generateMetadata() {
  return {
    title: 'Board - IdeaSpace',
    description: 'Collaborative whiteboard',
  }
}

export default async function BoardPage({ params }: BoardPageProps) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('boards')
    .select('*, board_members(*)')
    .eq('id', params.boardId)
    .single()

  if (error || !data) notFound()

  const board = data as any

  const isOwner = board.owner_id === user.id
  const isMember = (board.board_members ?? []).some(
    (m: any) => m.user_id === user.id
  )

  if (!isOwner && !isMember) redirect('/dashboard')

  const canEdit = isOwner || (board.board_members ?? []).some(
    (m: any) => m.user_id === user.id && m.role !== 'viewer'
  )

  return (
    <BoardContent
      board={board}
      canEdit={canEdit}
    />
  )
}
