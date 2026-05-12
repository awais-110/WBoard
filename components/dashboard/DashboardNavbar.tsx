'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, LogOut, Sparkles } from 'lucide-react'

interface UserProfile {
  email: string | null
  full_name: string | null
}

export default function DashboardNavbar() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const metadata = user.user_metadata as any
      setUser({
        email: user.email,
        full_name: metadata?.full_name ?? null,
      })
      setLoading(false)
    }

    loadUser()
  }, [router, supabase])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="sticky top-0 z-30 border-b border-[#00A198]/20 bg-gradient-to-r from-[#E4DDD3]/40 to-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-[#00A198]">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-[0.32em]">IdeaSpace</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="bg-gradient-to-r from-[#00A198] to-[#008B7A] bg-clip-text text-2xl font-bold tracking-tight text-transparent">My Boards</h1>
            <span className="animate-pulse rounded-full border border-[#00A198]/30 bg-[#00A198]/10 px-3 py-1 text-xs font-semibold text-[#00A198]">
              Premium Workspace
            </span>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="group inline-flex items-center gap-3 rounded-full border border-[#00A198]/20 bg-gradient-to-r from-[#E4DDD3]/50 to-white/50 px-4 py-2 text-[#008B7A] shadow-lg shadow-[#00A198]/10 transition hover:border-[#00A198]/40 hover:from-[#E4DDD3]/70 hover:to-white/70"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00A198] to-[#008B7A] text-white shadow-lg">
              <span className="text-sm font-bold">{user?.full_name?.charAt(0).toUpperCase() ?? '?'}</span>
            </div>
            <div className="text-left">
              <p className="truncate text-sm font-semibold text-[#008B7A]">{loading ? 'Loading...' : user?.full_name ?? 'Your profile'}</p>
              <p className="truncate text-xs text-[#00A198]/60">{loading ? 'Getting email' : user?.email ?? 'No email available'}</p>
            </div>
            <ChevronDown size={16} className={`transition duration-300 group-hover:text-[#00A198] ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 rounded-3xl border border-[#00A198]/20 bg-gradient-to-br from-[#E4DDD3]/30 to-white/80 p-5 shadow-2xl shadow-[#00A198]/20 backdrop-blur-sm">
              <div className="space-y-3 rounded-2xl bg-white/50 p-4 text-sm">
                <p className="font-bold text-[#008B7A]">Account</p>
                <p className="truncate text-xs text-[#00A198]/70">{user?.email ?? 'No email available'}</p>
                <p className="truncate text-xs text-[#00A198]/60">{user?.full_name ?? 'No profile name set'}</p>
              </div>
              <div className="mt-5 border-t border-[#00A198]/10 pt-5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/50 bg-gradient-to-r from-rose-100/50 to-rose-50/50 px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-md transition hover:border-rose-400/70 hover:from-rose-100 hover:to-rose-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
