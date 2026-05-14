'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

/**
 * Login form component with email/password authentication.
 */
export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Logged in successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback`
        }
      })
      if (error) toast.error(error.message)
    } catch {
      toast.error('Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-black/10 bg-[#f7f5f0] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[#0abfbc]">Access</p>
          <p className="mt-2 text-sm leading-6 text-[#0d0d0d]/70">
            Enter the email and password tied to your IdeaSpace workspace.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#0d0d0d]/75">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-[#0d0d0d] placeholder:text-[#0d0d0d]/35 outline-none transition focus:border-[#0abfbc] focus:ring-2 focus:ring-[#0abfbc]/20"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#0d0d0d]/75">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-[#0d0d0d] placeholder:text-[#0d0d0d]/35 outline-none transition focus:border-[#0abfbc] focus:ring-2 focus:ring-[#0abfbc]/20"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full rounded-full bg-[#0d0d0d] px-4 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0abfbc]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="flex items-center gap-3 pt-3 text-sm text-[#6b6b6b]">
            <span className="h-px flex-1 bg-black/10"></span>
            <span>or</span>
            <span className="h-px flex-1 bg-black/10"></span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group mt-4 flex w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 font-semibold text-[#0d0d0d] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2045C17.64 8.49455 17.5845 7.81818 17.4845 7.17045H9V10.86H13.97C13.84 11.9 13.27 12.7677 12.4 13.34V15.54H15.43C16.82 14.02 17.64 11.7 17.64 9.2045Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.45 17.1455 14.97 15.54L12.4 13.34C11.63 14.02 10.52 14.39 9 14.39C6.62 14.39 4.61 12.82 3.92 10.65H0.84V12.92C2.36 15.99 5.43 18 9 18Z" fill="#34A853"/>
              <path d="M3.92 10.65C3.78 10.08 3.7 9.48 3.7 8.86C3.7 8.24 3.78 7.64 3.92 7.07V4.79H0.84C0.3 6.05 0 7.47 0 8.86C0 10.25 0.3 11.67 0.84 12.93L3.92 10.65Z" fill="#FBBC05"/>
              <path d="M9 3.31C10.37 3.31 11.62 3.84 12.57 4.79L15.02 2.34C13.44 0.89 11.43 0 9 0C5.43 0 2.36 2.01 0.84 5.08L3.92 7.36C4.61 5.19 6.62 3.31 9 3.31Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <div className="pt-2">
          <p className="text-center text-sm text-[#0d0d0d]/65">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-[#0abfbc] transition hover:text-[#0d0d0d]">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
