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

  // Fetch board with members, but handle case where members list is empty
  const { data: initialData, error: initialError } = await supabase
    .from('boards')
    .select('id, title, owner_id, canvas_data, thumbnail_url, is_public, created_at, updated_at')
    .eq('id', params.boardId)
    .single()

  let data = initialData

  if (initialError || !data) {
    // Add small retry for replication delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { data: retryData, error: retryError } = await supabase
      .from('boards')
      .select('id, title, owner_id, canvas_data, thumbnail_url, is_public, created_at, updated_at')
      .eq('id', params.boardId)
      .single()

    if (retryError || !retryData) notFound()
    data = retryData as any
  }

  // Fetch board members separately
  const { data: members } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', params.boardId)

  const board = {
    ...(data as any),
    board_members: members ?? []
  } as any

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
