'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'register'

interface AuthShellProps {
  initialMode: AuthMode
}

type FieldState = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

type FocusState = {
  fullName: boolean
  email: boolean
  password: boolean
  confirmPassword: boolean
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const namePattern = /^[A-Za-z ]+$/
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

const evaluatePasswordStrength = (password: string) => {
  if (!password) return { level: 0, label: 'Weak', color: '#E24B4A' }
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z\d]/.test(password)) score += 1

  if (score <= 1) return { level: 1, label: 'Weak', color: '#E24B4A' }
  if (score === 2) return { level: 2, label: 'Fair', color: '#EF9F27' }
  if (score === 3) return { level: 3, label: 'Strong', color: '#0ABFBC' }
  return { level: 4, label: 'Excellent', color: '#63C422' }
}

const validateField = (name: keyof FieldState, value: string, fields: FieldState) => {
  if (name === 'fullName') {
    if (!value.trim()) return 'Enter your real name'
    if (value.trim().length < 2) return 'Enter your real name'
    if (!namePattern.test(value.trim())) return 'Enter your real name'
    return ''
  }

  if (name === 'email') {
    if (!value.trim()) return 'Enter a valid email address'
    if (!emailPattern.test(value.trim())) return 'Enter a valid email address'
    return ''
  }

  if (name === 'password') {
    if (!value) return 'Password must be 8+ chars with uppercase, number & symbol'
    if (!passwordPattern.test(value)) return 'Password must be 8+ chars with uppercase, number & symbol'
    return ''
  }

  if (name === 'confirmPassword') {
    if (fields.password && value !== fields.password) return 'Passwords do not match'
    return ''
  }

  return ''
}

const AuthShell = ({ initialMode }: AuthShellProps) => {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [fields, setFields] = useState<FieldState>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<keyof FieldState, string>>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [touched, setTouched] = useState<Record<keyof FieldState, boolean>>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [focus, setFocus] = useState<FocusState>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [shake, setShake] = useState(false)

  const passwordStrength = useMemo(
    () => evaluatePasswordStrength(fields.password),
    [fields.password]
  )

  useEffect(() => {
    if (status === 'error') {
      const timer = setTimeout(() => setStatus('idle'), 1600)
      return () => clearTimeout(timer)
    }
  }, [status])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (initialMode === 'login' && params.get('verified') === 'true') {
      setSuccessMessage('Email verified! You can now sign in.')
    } else if (initialMode === 'login' && params.get('registered') === 'true') {
      setSuccessMessage('Check your email to verify account')
    }
  }, [initialMode])

  useEffect(() => {
    if (serverError) {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [serverError])

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode)
    setServerError('')
    setSuccessMessage('')
    setStatus('idle')
    setFields({ fullName: '', email: '', password: '', confirmPassword: '' })
    setErrors({ fullName: '', email: '', password: '', confirmPassword: '' })
    setTouched({ fullName: false, email: false, password: false, confirmPassword: false })
    setFocus({ fullName: false, email: false, password: false, confirmPassword: false })
    if (newMode === 'login') {
      router.push('/login')
    } else {
      router.push('/register')
    }
  }

  const handleInputChange = (field: keyof FieldState, value: string) => {
    const nextFields = { ...fields, [field]: value }
    setFields(nextFields)
    setErrors(prev => ({ ...prev, [field]: '' }))

    if (field === 'password' && nextFields.confirmPassword) {
      const confirmError = validateField('confirmPassword', nextFields.confirmPassword, nextFields)
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }))
    }

    setServerError('')
    setSuccessMessage('')
  }

  const handleBlur = (field: keyof FieldState) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const message = mode === 'login' && field === 'password'
      ? fields.password ? '' : 'Enter your password'
      : validateField(field, fields[field], fields)
    setErrors(prev => ({ ...prev, [field]: message }))
  }

  const handleFocus = (field: keyof FieldState) => {
    setFocus(prev => ({ ...prev, [field]: true }))
  }

  const handleBlurFocus = (field: keyof FieldState) => {
    setFocus(prev => ({ ...prev, [field]: false }))
  }

  const validateAll = () => {
    const currentErrors: Record<keyof FieldState, string> = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    }

    if (mode === 'register') {
      currentErrors.fullName = validateField('fullName', fields.fullName, fields)
    }

    currentErrors.email = validateField('email', fields.email, fields)
    currentErrors.password = mode === 'login'
      ? fields.password ? '' : 'Enter your password'
      : validateField('password', fields.password, fields)

    if (mode === 'register') {
      currentErrors.confirmPassword = validateField('confirmPassword', fields.confirmPassword, fields)
    }

    if (mode === 'register' && !currentErrors.confirmPassword && fields.confirmPassword !== fields.password) {
      currentErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(currentErrors)
    setTouched(prev => ({
      ...prev,
      fullName: mode === 'register' ? true : prev.fullName,
      email: true,
      password: true,
      confirmPassword: mode === 'register' ? true : prev.confirmPassword,
    }))

    return Object.values(currentErrors).every(error => !error)
  }

  const isFieldValid = (field: keyof FieldState) => {
    if (!touched[field]) return false
    return !errors[field] && fields[field].length > 0
  }

  const isLoginValid = () => {
    return (
      fields.email && !validateField('email', fields.email, fields) &&
      fields.password
    )
  }

  const isRegisterValid = () => {
    return (
      fields.fullName && !validateField('fullName', fields.fullName, fields) &&
      fields.email && !validateField('email', fields.email, fields) &&
      fields.password && !validateField('password', fields.password, fields) &&
      fields.confirmPassword && !validateField('confirmPassword', fields.confirmPassword, fields)
    )
  }

  const canSubmit = mode === 'login' ? isLoginValid() : isRegisterValid()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const valid = validateAll()

    if (!valid) {
      setShake(true)
      setStatus('error')
      return
    }

    setStatus('submitting')
    setServerError('')
    setSuccessMessage('')

    try {
      if (mode === 'register') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fields.fullName.trim(),
            email: fields.email.trim(),
            password: fields.password,
          }),
        })

        const payload = await response.json()

        if (!response.ok) {
          console.error('[auth-form] Register failed:', payload)
          throw new Error(payload.error || 'Registration failed')
        }

        setMode('login')
        setFields({ fullName: '', email: fields.email, password: '', confirmPassword: '' })
        setTouched({ fullName: false, email: false, password: false, confirmPassword: false })
        setStatus('idle')
        setSuccessMessage(payload.message || 'Check your email to verify account')
        router.push('/login?registered=true')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: fields.email.trim(),
        password: fields.password,
      })

      if (error) {
        const message = error.message.toLowerCase().includes('email not confirmed')
          ? 'Please verify your email first'
          : error.message
        console.error('[auth-form] Login failed:', error.message)
        throw new Error(message)
      }

      setStatus('success')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setServerError(message)
      setStatus('error')
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setServerError('')
    const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      console.log('[google] OAuth response:', data, error)
      if (error) {
        setServerError(error.message)
        setGoogleLoading(false)
      }
      // If no error, browser will redirect to Google — no need to reset loading
    } catch (err) {
      console.error('[google] OAuth error:', err)
      setServerError('Google login failed')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <main className="form-panel">
          <div className="auth-topbar">
            <Link href="/" className="auth-logo" aria-label="IdeaSpace home">
              <div className="auth-logo-badge">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#0ABFBC"/>
                  <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#F59E0B"/>
                  <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#8B5CF6"/>
                  <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#EC4899"/>
                </svg>
              </div>
              <div className="auth-logo-copy">
                <span>IdeaSpace</span>
                <span>Workspace</span>
              </div>
            </Link>
          </div>
          <div className={`auth-card ${shake ? 'shake' : ''}`}>
            <div className="form-header">
              <p className="form-eyebrow">{mode === 'login' ? 'Sign in to IdeaSpace' : 'Create your IdeaSpace account'}</p>
              <h2>{mode === 'login' ? 'Welcome back' : 'Start your workspace'}</h2>
              <p className="form-subtitle">
                {mode === 'login'
                  ? 'Enter your credentials and continue to your collaborative canvas.'
                  : 'Secure your account with a strong password and join your team.'}
              </p>
            </div>

            {serverError ? (
              <div className="server-error" role="alert">
                <span>✕</span> {serverError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="server-success" role="status">
                <span>✓</span> {successMessage}
              </div>
            ) : null}

            {/* Google Button - OUTSIDE form */}
            <div style={{ marginBottom: '16px', display: 'grid', gap: '10px' }}>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '100px',
                  border: '1px solid #E0DDD6',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0D0D0D',
                  cursor: googleLoading ? 'not-allowed' : 'pointer',
                  opacity: googleLoading ? 0.6 : 1,
                }}
              >
                {googleLoading ? 'Redirecting...' : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: '#E0DDD6' }} />
                <span style={{ fontSize: '11px', color: '#88807A' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: '#E0DDD6' }} />
              </div>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {mode === 'register' ? (
                <div className="field-group">
                  <div className="field-label-row">
                    <label htmlFor="fullName" className="field-label">Full Name</label>
                  </div>
                  <div className={`input-shell ${focus.fullName ? 'focused' : ''} ${isFieldValid('fullName') ? 'valid' : ''} ${errors.fullName ? 'invalid' : ''}`}>
                    <input
                      id="fullName"
                      type="text"
                      autoComplete="name"
                      value={fields.fullName}
                      onChange={e => handleInputChange('fullName', e.target.value)}
                      onBlur={() => { handleBlur('fullName'); handleBlurFocus('fullName') }}
                      onFocus={() => handleFocus('fullName')}
                      aria-invalid={errors.fullName ? 'true' : 'false'}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      placeholder=""
                    />
                    <span className={`floating-label ${focus.fullName || fields.fullName ? 'active' : ''}`}>Full Name</span>
                    {errors.fullName ? <span className="status-icon">✕</span> : isFieldValid('fullName') ? <span className="status-icon">✓</span> : null}
                  </div>
                  <div className={`field-error ${errors.fullName ? 'visible' : ''}`} id="fullName-error">
                    <span>✕</span> {errors.fullName}
                  </div>
                </div>
              ) : null}

              <div className="field-group">
                <div className="field-label-row">
                  <label htmlFor="email" className="field-label">Email Address</label>
                </div>
                <div className={`input-shell ${focus.email ? 'focused' : ''} ${isFieldValid('email') ? 'valid' : ''} ${errors.email ? 'invalid' : ''}`}>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={fields.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    onBlur={() => { handleBlur('email'); handleBlurFocus('email') }}
                    onFocus={() => handleFocus('email')}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    placeholder=""
                  />
                  <span className={`floating-label ${focus.email || fields.email ? 'active' : ''}`}>Email Address</span>
                  {errors.email ? <span className="status-icon">✕</span> : isFieldValid('email') ? <span className="status-icon">✓</span> : null}
                </div>
                <div className={`field-error ${errors.email ? 'visible' : ''}`} id="email-error">
                  <span>✕</span> {errors.email}
                </div>
              </div>

              <div className="field-group">
                <div className="field-label-row">
                  <label htmlFor="password" className="field-label">Password</label>
                  {mode === 'login' ? (
                    <a className="forgot-link" href="#">Forgot password?</a>
                  ) : null}
                </div>
                <div className={`input-shell ${focus.password ? 'focused' : ''} ${isFieldValid('password') ? 'valid' : ''} ${errors.password ? 'invalid' : ''}`}>
                  <input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={fields.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    onBlur={() => { handleBlur('password'); handleBlurFocus('password') }}
                    onFocus={() => handleFocus('password')}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    placeholder=""
                  />
                  <span className={`floating-label ${focus.password || fields.password ? 'active' : ''}`}>Password</span>
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setPasswordVisible(prev => !prev)}
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisible ? '🙈' : '👁️'}
                  </button>
                  {errors.password ? <span className="status-icon">✕</span> : isFieldValid('password') ? <span className="status-icon">✓</span> : null}
                </div>
                <div className={`field-error ${errors.password ? 'visible' : ''}`} id="password-error">
                  <span>✕</span> {errors.password}
                </div>
              </div>

              {mode === 'register' ? (
                <div className="strength-meter">
                  <div className="strength-label">{passwordStrength.label}</div>
                  <div className="strength-bar" aria-hidden="true">
                    {[1, 2, 3, 4].map(index => (
                      <span
                        key={index}
                        className={`segment ${passwordStrength.level >= index ? 'filled' : ''}`}
                        style={{ backgroundColor: passwordStrength.level >= index ? passwordStrength.color : '#E8E2DC' }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {mode === 'register' ? (
                <div className="field-group">
                  <div className="field-label-row">
                    <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
                  </div>
                  <div className={`input-shell ${focus.confirmPassword ? 'focused' : ''} ${isFieldValid('confirmPassword') ? 'valid' : ''} ${errors.confirmPassword ? 'invalid' : ''}`}>
                    <input
                      id="confirmPassword"
                      type={confirmVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={fields.confirmPassword}
                      onChange={e => handleInputChange('confirmPassword', e.target.value)}
                      onBlur={() => { handleBlur('confirmPassword'); handleBlurFocus('confirmPassword') }}
                      onFocus={() => { setConfirmVisible(false); handleFocus('confirmPassword') }}
                      aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                      placeholder=""
                    />
                    <span className={`floating-label ${focus.confirmPassword || fields.confirmPassword ? 'active' : ''}`}>Confirm Password</span>
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setConfirmVisible(prev => !prev)}
                      aria-label={confirmVisible ? 'Hide password' : 'Show password'}
                    >
                      {confirmVisible ? '🙈' : '👁️'}
                    </button>
                    {errors.confirmPassword ? <span className="status-icon">✕</span> : isFieldValid('confirmPassword') ? <span className="status-icon">✓</span> : null}
                  </div>
                  <div className={`field-error ${errors.confirmPassword ? 'visible' : ''}`} id="confirmPassword-error">
                    <span>✕</span> {errors.confirmPassword}
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                className={`submit-button ${canSubmit ? 'active' : 'disabled'} ${status === 'success' ? 'success' : ''}`}
                disabled={!canSubmit || status === 'submitting' || status === 'success'}
              >
                {status === 'submitting'
                  ? mode === 'login'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : status === 'success'
                    ? '✓ Welcome to IdeaSpace!'
                    : mode === 'login'
                      ? 'Sign In →'
                      : 'Create Account →'}
              </button>
            </form>

            <div className="page-switch">
              {mode === 'login' ? (
                <>
                  <span>Don&apos;t have an account?</span>
                  <button type="button" className="page-link" onClick={() => handleModeSwitch('register')}>Get Started</button>
                </>
              ) : (
                <>
                  <span>Already have an account?</span>
                  <button type="button" className="page-link" onClick={() => handleModeSwitch('login')}>Sign In</button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        :global(html),
        :global(body) {
          min-height: 100%;
        }

        .auth-shell {
          min-height: 100vh;
          overflow: auto;
          background: #F7F5F0;
          color: #0D0D0D;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-grid {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100vh;
        }

        .form-panel {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 88px 24px 32px;
          position: relative;
        }

        .auth-topbar {
          position: absolute;
          top: 18px;
          left: 24px;
          right: 24px;
          display: flex;
          justify-content: flex-start;
          z-index: 2;
        }

        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          padding: 8px 12px;
          border-radius: 16px;
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(13,13,13,0.08);
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .auth-logo-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #0D0D0D;
          display: grid;
          place-items: center;
          border: 1px solid rgba(0,0,0,0.12);
          flex-shrink: 0;
        }

        .auth-logo-copy {
          display: grid;
          gap: 2px;
          line-height: 1;
        }

        .auth-logo-copy span:first-child {
          font-size: 15px;
          font-weight: 700;
        }

        .auth-logo-copy span:last-child {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B6B6B;
        }

        .auth-card {
          width: min(420px, 100%);
          background: #F7F5F0;
          border: 1px solid #E0DDD6;
          border-radius: 16px;
          padding: 32px 36px;
          box-shadow: 0 20px 55px rgba(13, 13, 13, 0.08);
          position: relative;
          transition: transform 0.2s ease;
        }

        .auth-card.shake {
          animation: shake 0.45s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }

        .form-header {
          margin-bottom: 20px;
        }

        .form-eyebrow {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0ABFBC;
          margin-bottom: 8px;
        }

        .form-header h2 {
          margin: 0 0 6px;
          font-size: 24px;
          font-weight: 500;
          line-height: 1.15;
        }

        .form-subtitle {
          margin: 0;
          color: #0D0D0D;
          opacity: 0.76;
          font-size: 13px;
          line-height: 1.5;
          max-width: 34rem;
        }

        .server-error {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FFECEC;
          color: #E24B4A;
          border: 1px solid rgba(226, 75, 74, 0.18);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 14px;
          font-size: 12px;
        }

        .server-success {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #EAF8EA;
          color: #2F7D32;
          border: 1px solid rgba(99, 196, 34, 0.22);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 14px;
          font-size: 12px;
        }

        .auth-form {
          display: grid;
          gap: 14px;
        }

        .field-group {
          display: grid;
          gap: 6px;
        }

        .field-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #0D0D0D;
        }

        .forgot-link {
          font-size: 12px;
          color: #0ABFBC;
          text-decoration: none;
        }

        .input-shell {
          position: relative;
          background: white;
          border: 1px solid #E0DDD6;
          border-radius: 10px;
          height: 40px;
          padding: 0 42px 0 14px;
          display: flex;
          align-items: center;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input-shell.focused {
          border-color: #0ABFBC;
          box-shadow: 0 0 0 4px rgba(10, 191, 188, 0.12);
        }

        .input-shell.valid {
          border-color: #63C422;
        }

        .input-shell.invalid {
          border-color: #E24B4A;
        }

        .input-shell input {
          width: 100%;
          height: 40px;
          border: none;
          outline: none;
          font: 14px 'DM Sans', sans-serif;
          color: #0D0D0D;
          background: transparent;
          padding: 0;
          line-height: 40px;
        }

        .input-shell input::placeholder {
          color: transparent;
        }

        .floating-label {
          position: absolute;
          left: 14px;
          top: 50%;
          pointer-events: none;
          color: #88807A;
          font-size: 14px;
          transition: transform 0.2s ease, color 0.2s ease, font-size 0.2s ease;
          transform-origin: left top;
          transform: translateY(-50%);
        }

        .floating-label.active {
          transform: translateY(-18px) scale(0.72);
          color: #0D0D0D;
        }

        .toggle-visibility {
          position: absolute;
          top: 50%;
          right: 18px;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }

        .status-icon {
          position: absolute;
          top: 50%;
          right: 18px;
          transform: translateY(-50%);
          font-size: 13px;
          color: #63C422;
        }

        .input-shell.invalid .status-icon {
          color: #E24B4A;
        }

        .field-error {
          color: #E24B4A;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateY(-6px);
          transition: max-height 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
        }

        .field-error.visible {
          max-height: 44px;
          opacity: 1;
          transform: translateY(0);
        }

        .strength-meter {
          display: grid;
          gap: 6px;
          margin-top: 6px;
          margin-bottom: 0;
        }

        .strength-label {
          font-size: 11px;
          color: #0D0D0D;
          font-weight: 600;
        }

        .strength-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: #E8E2DC;
        }

        .strength-bar .segment {
          border-radius: 999px;
          transition: background-color 0.25s ease;
        }

        .submit-button {
          width: 100%;
          height: 42px;
          margin-top: 20px;
          padding: 0 18px;
          border: none;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.01em;
          transition: background 0.25s ease, transform 0.2s ease;
          cursor: pointer;
        }

        .submit-button.disabled {
          background: #D8D1C8;
          color: #7B746D;
          cursor: not-allowed;
        }

        .submit-button.active {
          background: #0D0D0D;
          color: #FFFFFF;
        }

        .submit-button.active:hover {
          background: #0ABFBC;
        }

        .submit-button.success {
          background: #63C422;
          color: white;
        }

        .page-switch {
          margin-top: 14px;
          display: flex;
          justify-content: center;
          gap: 8px;
          color: #0D0D0D;
          font-size: 12px;
          text-align: center;
        }

        .page-link {
          border: none;
          background: transparent;
          color: #0ABFBC;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        @media (max-width: 900px) {
          .auth-grid {
            grid-template-columns: 1fr;
          }

          .auth-topbar {
            top: 16px;
            left: 18px;
            right: 18px;
            justify-content: center;
          }

          .form-panel {
            align-items: flex-start;
            padding: 96px 18px 28px;
          }
        }

        @media (max-width: 720px) {
          .auth-shell {
            min-height: 100dvh;
          }

          .auth-grid,
          .form-panel {
            min-height: 100dvh;
          }

          .auth-logo {
            padding: 7px 10px;
            border-radius: 14px;
          }

          .auth-logo-badge {
            width: 34px;
            height: 34px;
            border-radius: 10px;
          }

          .auth-card {
            width: min(420px, 100%);
            border-radius: 16px;
            padding: 26px 20px 22px;
            box-shadow: 0 16px 42px rgba(13, 13, 13, 0.08);
          }

          .form-header {
            margin-bottom: 18px;
          }

          .form-header h2 {
            font-size: 23px;
          }

          .form-subtitle {
            font-size: 12px;
          }

          .auth-form {
            gap: 13px;
          }

          .input-shell,
          .input-shell input,
          .submit-button {
            height: 42px;
          }

          .submit-button {
            margin-top: 16px;
          }

          .page-switch {
            flex-wrap: wrap;
            line-height: 1.4;
          }
        }
      `}</style>
    </div>
  )
}

export default AuthShell
