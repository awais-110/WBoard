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

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-the-mint">Get started</p>
          <p className="mt-2 text-sm leading-6 text-ice-latte/65">
            Create your IdeaSpace workspace and invite your team when you are ready.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ice-latte/80">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-ice-latte placeholder:text-ice-latte/30 outline-none transition focus:border-the-mint focus:ring-2 focus:ring-the-mint/20"
              disabled={loading}
            />
          </div>

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
            <p className="mt-1 text-xs text-ice-latte/45">At least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full rounded-xl bg-gradient-to-r from-the-mint to-the-mint/80 px-4 py-3 font-semibold text-black transition-all duration-300 hover:shadow-lg hover:shadow-the-mint/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="pt-2">
          <p className="text-center text-sm text-ice-latte/60">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-the-mint transition-colors hover:text-ice-latte">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
