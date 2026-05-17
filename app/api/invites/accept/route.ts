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

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const admin = createAdminClient()
    if (!admin) return NextResponse.json({ error: 'Missing service role key' }, { status: 500 })

    const { data: invite, error: inviteError } = await admin.from('board_invites').select('*').eq('token', token).single()
    if (inviteError || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 400 })
    if (invite.email !== user.email) return NextResponse.json({ error: 'Invite does not match your account' }, { status: 403 })

    // Add member
    const { error: insertError } = await admin.from('board_members').insert({ board_id: invite.board_id, user_id: user.id, role: invite.role })
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    // Mark invite accepted
    await admin.from('board_invites').update({ accepted: true }).eq('id', invite.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid request' }, { status: 400 })
  }
}
