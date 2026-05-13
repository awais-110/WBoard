'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[#f7f5f0]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div>
            {/* <span className="text-lg font-bold text-white" style={{ fontFamily: 'Instrument Serif, serif' }}>
              I
            </span> */}
          </div>
         <div className="flex items-center gap-3">
  <div style={{
    width: '38px',
    height: '38px',
    background: '#0D0D0D',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid rgba(0, 0, 0, 0.1)'
  }}>
    <svg width="18" height="18" viewBox="0 0 18 18" 
      fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#0ABFBC"/>
      <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#F59E0B"/>
      <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#8B5CF6"/>
      <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#EC4899"/>
    </svg>
  </div>
  <div className="flex flex-col">
    <span style={{
      fontSize: '22px',
      fontWeight: '600',
      color: '#0D0D0D',
      letterSpacing: '-0.03em',
      lineHeight: '1'
    }}>
      IdeaSpace
    </span>
    <span style={{
      fontSize: '10px',
      color: 'black',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      marginTop: '3px'
    }}>
      Workspace
    </span>
  </div>
</div>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          <a href="#why" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
            Why
          </a>
          <a href="#canvas" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
            Canvas
          </a>
          <a href="/register" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
            Start
          </a>
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
          className="md:hidden text-[#0d0d0d]"
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-black/8 bg-[#f7f5f0]/95 px-8 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-4">
            <a href="#why" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
              Why
            </a>
            <a href="#canvas" className="text-sm font-medium text-[#0d0d0d] transition hover:text-[#0abfbc]">
              Canvas
            </a>
            <Link
              href="/register"
              className="rounded-2xl bg-[#0d0d0d] px-4 py-3 text-center text-sm font-bold text-[#f7f5f0]"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-black/16 px-4 py-3 text-sm font-medium text-[#0d0d0d] transition hover:border-[#0abfbc] hover:text-[#0abfbc]"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
