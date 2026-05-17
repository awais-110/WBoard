'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, LogOut } from 'lucide-react'

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
    <div className="sticky top-0 z-30 border-b border-[#0D0D0D]/10 bg-[#F7F5F0]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3 text-[#0D0D0D]">
          <div className="grid h-[38px] w-[38px] place-items-center rounded-[10px] border border-black/10 bg-[#0D0D0D] shadow-sm">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#0ABFBC" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#F59E0B" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#8B5CF6" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#EC4899" />
            </svg>
          </div>
          <div className="grid min-w-0 leading-none">
            <span className="truncate text-[18px] font-semibold tracking-tight sm:text-[22px]">IdeaSpace</span>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D0D0D]/60">Workspace</span>
          </div>
        </Link>

        <div className="relative flex min-w-0 items-center justify-between gap-3 sm:justify-end" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="group inline-flex min-h-11 min-w-0 items-center gap-2 rounded-full border border-[#0D0D0D]/10 bg-white/75 px-2 py-2 text-[#0D0D0D] shadow-[0_18px_45px_rgba(13,13,13,0.08)] transition hover:border-[#0ABFBC]/40 sm:gap-3 sm:px-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0ABFBC] text-white shadow-lg shadow-[#0ABFBC]/20 sm:h-10 sm:w-10">
              <span className="text-sm font-bold">{user?.full_name?.charAt(0).toUpperCase() ?? '?'}</span>
            </div>
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-bold text-[#0D0D0D]">{loading ? 'Loading...' : user?.full_name ?? 'Your profile'}</p>
              <p className="hidden truncate text-xs text-[#0ABFBC] sm:block">{loading ? 'Getting email' : user?.email ?? 'No email available'}</p>
            </div>
            <ChevronDown size={16} className={`transition duration-300 group-hover:text-[#0ABFBC] ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-[24px] border border-[#0D0D0D]/10 bg-[#F7F5F0] p-5 shadow-2xl shadow-black/15">
              <div className="space-y-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm">
                <p className="font-bold text-[#0D0D0D]">Account</p>
                <p className="truncate text-xs text-[#0D0D0D]/65">{user?.email ?? 'No email available'}</p>
                <p className="truncate text-xs text-[#0ABFBC]">{user?.full_name ?? 'No profile name set'}</p>
              </div>
              <div className="mt-5 border-t border-[#0D0D0D]/10 pt-5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0D0D0D] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:bg-[#0ABFBC]"
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
