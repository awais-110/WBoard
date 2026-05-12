import { createClient } from '@/lib/supabase/server'
import DashboardContent from '@/components/dashboard/DashboardContent'
import { redirect } from 'next/navigation'
import type { Board, BoardRole, DashboardBoard } from '@/types/board'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Boards - Collaborative Whiteboard',
  description: 'Manage your collaborative whiteboards',
}

/**
 * Dashboard home page showing all user boards.
 */
export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: ownedBoards, error: ownedError } = await supabase
    .from('boards')
    .select('*, board_members(id)')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (ownedError) {
    console.error('Error fetching owned boards:', ownedError.message)
  }

  const { data: sharedMemberships, error: sharedError } = await supabase
    .from('board_members')
    .select('role, boards(*)')
    .eq('user_id', user.id)
    .order('invited_at', { ascending: false })

  if (sharedError) {
    console.error('Error fetching shared boards:', sharedError.message)
  }

  const owned: DashboardBoard[] = ((ownedBoards ?? []) as Array<Board & { board_members?: unknown[] }>).map((board) => ({
    ...board,
    access: 'owned',
    members: board.board_members ?? [],
  }))

  const sharedRows = (sharedMemberships ?? []) as Array<{ role: BoardRole; boards: Board | Board[] | null }>

  const shared = sharedRows
    .map<DashboardBoard | null>((membership) => {
      const board = normalizeJoinedBoard(membership.boards)
      if (!board || board.owner_id === user.id) return null

      return {
        ...board,
        access: 'shared' as const,
        role: membership.role as BoardRole,
      }
    })
    .filter((board): board is DashboardBoard => Boolean(board))

  return <DashboardContent boards={owned} sharedBoards={shared} />
}

function normalizeJoinedBoard(value: unknown): Board | null {
  if (!value) return null
  if (Array.isArray(value)) return (value[0] as Board | undefined) ?? null
  return value as Board
}
