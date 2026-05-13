import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendVerificationEmail } from '@/lib/mail'

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export async function POST(request: Request) {
  // ...existing code...

  try {
    const { email, password, name } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const fullName = String(name || '').trim()

    if (!normalizedEmail || !password || !fullName) {
      // ...existing code...
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const redirectTo = `${getBaseUrl()}/login?verified=true`

    // ...existing code...
    const { data: signupLink, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: normalizedEmail,
      password,
      options: {
        redirectTo,
        data: {
          full_name: fullName,
        },
      },
    })

    if (linkError || !signupLink.properties?.action_link) {
      console.error('[register] Signup link generation failed:', linkError)
      return NextResponse.json(
        { error: linkError?.message || 'Registration failed' },
        { status: 500 }
      )
    }

    // ...existing code...
    const mailResult = await sendVerificationEmail(normalizedEmail, signupLink.properties.action_link)

    if (!mailResult.sent) {
      console.error('[register] Verification email failed:', mailResult.error)
      if (signupLink.user?.id) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(signupLink.user.id)
        if (deleteError) {
          console.error('[register] Cleanup after email failure failed:', deleteError)
        }
      }

      return NextResponse.json(
        {
          error: mailResult.error || 'Verification email could not be sent. Check the server email settings.',
        },
        { status: 500 }
      )
    }

    // ...existing code...
    return NextResponse.json({
      success: true,
      message: 'Check your email to verify account',
    })
  } catch (error) {
    console.error('[register] Registration failed:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
