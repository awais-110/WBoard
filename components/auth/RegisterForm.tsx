'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

/**
 * Registration form component for creating new accounts.
 */
export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Account created! Please check your email to confirm.')
      router.push('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
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
          <p className="text-xs uppercase tracking-[0.3em] text-[#0abfbc]">Get started</p>
          <p className="mt-2 text-sm leading-6 text-[#0d0d0d]/70">
            Create your IdeaSpace workspace and invite your team when you are ready.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#0d0d0d]/75">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 text-[#0d0d0d] placeholder:text-[#0d0d0d]/35 outline-none transition focus:border-[#0abfbc] focus:ring-2 focus:ring-[#0abfbc]/20"
              disabled={loading}
            />
          </div>

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
            <p className="mt-1 text-xs text-[#0d0d0d]/45">At least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full rounded-full bg-[#0d0d0d] px-4 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0abfbc]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs text-[#0d0d0d]/40">or</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full rounded-full border border-black/10 bg-white px-4 py-3 font-semibold text-[#0d0d0d] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="pt-2">
          <p className="text-center text-sm text-[#0d0d0d]/65">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[#0abfbc] transition hover:text-[#0d0d0d]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
