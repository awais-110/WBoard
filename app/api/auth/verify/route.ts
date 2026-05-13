import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const loginUrl = new URL('/login', url.origin)

  // ...existing code...

  if (!token) {
    loginUrl.searchParams.set('error', 'missing-token')
    return NextResponse.redirect(loginUrl)
  }

  try {
    const supabase = createAdminClient()
    const tokensTable = supabase.from('email_verification_tokens') as any

    // ...existing code...
    const { data: tokenRecord, error: tokenError } = await tokensTable
      .select('id, user_id, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (tokenError || !tokenRecord) {
      console.error('[verify] Token lookup failed:', tokenError)
      loginUrl.searchParams.set('error', 'invalid-token')
      return NextResponse.redirect(loginUrl)
    }

    if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
      // ...existing code...
      loginUrl.searchParams.set('error', 'expired-token')
      return NextResponse.redirect(loginUrl)
    }

    // ...existing code...
    const { error: updateError } = await supabase.auth.admin.updateUserById(tokenRecord.user_id, {
      email_confirm: true,
    })

    if (updateError) {
      console.error('[verify] Email confirm failed:', updateError)
      loginUrl.searchParams.set('error', 'verify-failed')
      return NextResponse.redirect(loginUrl)
    }

    // ...existing code...
    const { error: deleteError } = await tokensTable
      .delete()
      .eq('id', tokenRecord.id)

    if (deleteError) {
      console.error('[verify] Token delete failed:', deleteError)
    }

    // ...existing code...
    loginUrl.searchParams.set('verified', 'true')
    return NextResponse.redirect(loginUrl)
  } catch (error) {
    console.error('[verify] Verification failed:', error)
    loginUrl.searchParams.set('error', 'verify-failed')
    return NextResponse.redirect(loginUrl)
  }
}
