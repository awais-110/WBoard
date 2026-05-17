import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) return null

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: Request, { params }: { params: { boardId: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { email, role = 'editor', sendEmail = false } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    // Verify user is board owner
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', params.boardId)
      .single()

    if (boardError || !board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    if (board.owner_id !== user.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    // Try to find an existing profile
    const admin = createAdminClient()
    if (!admin) return NextResponse.json({ error: 'Missing service role key' }, { status: 500 })

    const { data: profile } = await admin.from('profiles').select('id').eq('email', email).single()

    if (profile && profile.id) {
      // Insert directly into board_members
      const { error: insertError } = await admin.from('board_members').insert({ board_id: params.boardId, user_id: profile.id, role })
      if (insertError) {
        if ((insertError as any).code === '23505') {
          return NextResponse.json({ ok: true, message: 'User already a member' })
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true, invited: true })
    }

    // Create invite token
    const token = crypto.randomUUID()
    const { error: inviteError } = await admin.from('board_invites').insert({ board_id: params.boardId, email, token, role, invited_by: user.id })
    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 })

    // Optionally handle email sending externally; return token for now
    return NextResponse.json({ ok: true, invited: false, token })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid request' }, { status: 400 })
  }
}
