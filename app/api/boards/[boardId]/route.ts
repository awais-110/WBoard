import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Board } from '@/types/board'

/**
 * PATCH /api/boards/:boardId — save canvas snapshot or update board
 */
export async function PATCH(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    // Verify user is board owner or editor
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', params.boardId)
      .single<Pick<Board, 'owner_id'>>()

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.owner_id !== user.id) {
      // Check if user is editor member
      const { data: member, error: memberError } = await supabase
        .from('board_members')
        .select('role')
        .eq('board_id', params.boardId)
        .eq('user_id', user.id)
        .single<{ role: string }>()

      if (memberError || !member || !['editor', 'admin'].includes(member.role)) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
    }

    // Update board - Supabase client typing requires any cast for update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error }: any = await supabase
      .from('boards')
      // @ts-expect-error - Supabase client typing issue with update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(body as any)
      .eq('id', params.boardId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/boards/:boardId
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { boardId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Verify user is board owner
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', params.boardId)
      .single<Pick<Board, 'owner_id'>>()

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only board owner can delete' },
        { status: 403 }
      )
    }

    // Delete board
    const { error } = await supabase.from('boards').delete().eq('id', params.boardId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    )
  }
}
