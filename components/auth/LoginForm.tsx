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

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-the-mint">Access</p>
          <p className="mt-2 text-sm leading-6 text-ice-latte/65">
            Enter the email and password tied to your IdeaSpace workspace.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ice-latte/80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-ice-latte placeholder:text-ice-latte/30 outline-none transition focus:border-the-mint focus:ring-2 focus:ring-the-mint/20"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ice-latte/80">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-ice-latte placeholder:text-ice-latte/30 outline-none transition focus:border-the-mint focus:ring-2 focus:ring-the-mint/20"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full rounded-xl bg-gradient-to-r from-the-mint to-the-mint/80 px-4 py-3 font-semibold text-black transition-all duration-300 hover:shadow-lg hover:shadow-the-mint/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2">
          <p className="text-center text-sm text-ice-latte/60">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-the-mint transition-colors hover:text-ice-latte">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
