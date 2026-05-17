import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function DELETE(_req: Request, { params }: { params: { boardId: string; userId: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Verify caller is board owner
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', params.boardId)
      .single()

    if (boardError || !board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    if (board.owner_id !== user.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const { error } = await supabase.from('board_members').delete().eq('board_id', params.boardId).eq('user_id', params.userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid request' }, { status: 400 })
  }
}
