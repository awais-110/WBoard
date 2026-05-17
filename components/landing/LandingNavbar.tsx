'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/15 bg-[#f7f5f0]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 md:px-8 md:py-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] border border-black/10 bg-[#0D0D0D]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#00fffb" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#ffa200" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#4d04f8" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#ff0080" />
            </svg>
          </div>
          <div className="grid min-w-0 leading-none">
            <span className="truncate text-[19px] font-semibold tracking-[-0.03em] text-[#0D0D0D] sm:text-[22px]">
              IdeaSpace
            </span>
            <span className="mt-[3px] truncate text-[9px] uppercase tracking-[0.1em] text-black sm:text-[10px]">
              Workspace
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          <Link href="/#why" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
            Why
          </Link>
          <Link href="/#canvas" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
            Canvas
          </Link>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#0d0d0d] px-5 py-2.5 text-sm font-bold text-[#f7f5f0] shadow-lg transition hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-[#0d0d0d] md:hidden"
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-black/8 bg-[#f7f5f0]/95 px-4 pb-4 sm:px-6 md:hidden">
          <div className="flex flex-col gap-3 pt-4">
            <Link href="/#why" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
              Why
            </Link>
            <Link href="/#canvas" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
              Canvas
            </Link>
            <Link
              href="/register"
              className="rounded-2xl bg-[#0d0d0d] px-4 py-3 text-center text-sm font-bold text-[#f7f5f0]"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-black/16 px-4 py-3 text-center text-sm font-medium text-[#0d0d0d] transition hover:border-[#0abfbc] hover:text-[#0abfbc]"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
