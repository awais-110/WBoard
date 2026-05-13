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
