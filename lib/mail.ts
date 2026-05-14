type MailResult = {
  sent: boolean
  error?: string
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Email could not be sent'
}

export async function sendVerificationEmail(email: string, verifyUrl: string): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    const error = new Error('Missing Resend email environment variables')
    console.error('[mail] Verification email skipped:', error.message)
    return { sent: false, error: error.message }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: 'Verify your IdeaSpace account',
        html: `
          <div style="margin:0;padding:32px;background:#f7f5f0;font-family:Arial,sans-serif;color:#0d0d0d;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e0ddd6;border-radius:18px;padding:32px;">
              <div style="width:48px;height:48px;border-radius:16px;background:#0abfbc;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;">I</div>
              <h1 style="margin:24px 0 12px;font-size:28px;line-height:1.2;">Verify your IdeaSpace account</h1>
              <p style="margin:0 0 24px;color:#4a4742;line-height:1.6;">Confirm your email address so you can sign in and start using your collaborative workspace.</p>
              <a href="${verifyUrl}" style="display:inline-block;background:#0abfbc;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">Verify account</a>
              <p style="margin:24px 0 0;color:#6f6962;font-size:13px;line-height:1.6;">This link expires soon. If the button does not work, paste this link into your browser:<br>${verifyUrl}</p>
            </div>
          </div>
        `,
        text: `Verify your IdeaSpace account: ${verifyUrl}`,
      }),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(`Resend API error: ${message}`)
    }

    return { sent: true }
  } catch (error) {
    console.error('[mail] Verification email failed:', error)
    return { sent: false, error: getErrorMessage(error) }
  }
}