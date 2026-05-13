'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function LandingContent() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setCursorPosition({ x: event.clientX, y: event.clientY })
    }

    const handleMouseLeave = () => setCursorVisible(false)
    const handleMouseEnter = () => setCursorVisible(true)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f5f0] text-[#0d0d0d]">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(13, 13, 13, 0.02) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div
        className="custom-cursor pointer-events-none fixed rounded-full bg-[#0abfbc] shadow-[0_0_0_6px_rgba(10,191,188,0.25)]"
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
          opacity: cursorVisible ? 1 : 0,
          transform: 'translate(-50%, -50%)',
          width: 14,
          height: 14,
          zIndex: 9999,
        }}
      />

      <main className="page relative mx-auto flex min-h-screen max-w-[1120px] flex-col px-6 pt-32 pb-12 text-center">
        <div className="hero mx-auto w-full">
          <div className="hero__badge mx-auto mb-6 inline-flex items-center gap-3 rounded-full bg-[#0abfbc]/12 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0d0d0d] text-center backdrop-blur-sm">
            ✨ The New Way to Ideate
          </div>

          <h1 className="hero__title mx-auto max-w-[760px] text-[clamp(4rem,8vw,7.25rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-[#0d0d0d]" style={{ fontFamily: 'Instrument Serif, serif' }}>
            Collaborate.
            <strong className="block italic text-[#0abfbc]">Create. Innovate.</strong>
          </h1>

          <p className="hero__subtitle mx-auto mt-6 max-w-[540px] text-base leading-[1.85] text-[#0d0d0d]/70">
            Turn ideas into shared visual workflows with a single clean canvas.
          </p>

          <div className="hero__ctas mx-auto mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="button inline-flex items-center justify-center rounded-full bg-[#0d0d0d] px-8 py-3 text-sm font-bold text-[#f7f5f0] transition hover:-translate-y-1"
            >
              Start a board
            </Link>
            <a
              href="#canvas"
              className="button--ghost inline-flex items-center justify-center rounded-full border border-black/12 bg-transparent px-8 py-3 text-sm font-bold text-[#0d0d0d] transition hover:border-[#0abfbc] hover:text-[#0abfbc]"
            >
              See how
            </a>
          </div>

          <section className="hero__canvas mx-auto mt-16 w-full max-w-[960px] rounded-[34px] bg-white p-8 shadow-[0_40px_90px_rgba(13,13,13,0.08)] border border-black/5 relative" id="canvas">
            <div className="hero__canvas-inner grid gap-6">
              <div className="canvas-top flex items-center justify-between">
                <div className="board-chip inline-flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 text-xs font-medium text-[#0d0d0d]">
                  <span className="block h-2.5 w-2.5 rounded-full bg-[#0abfbc]" />
                  Sprint planning board
                </div>
                <div className="status text-xs text-[#0d0d0d]/70">Live • 4 collaborators</div>
              </div>

              <div className="nodes grid gap-4 md:grid-cols-3">
                <div className="node rounded-[24px] bg-[#fffbec] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]">
                  <strong className="mb-2 block text-sm font-semibold text-[#0d0d0d]">Ideas</strong>
                  <p className="text-sm leading-6 text-[#0d0d0d]/80">Define the next experiment in one place for everyone.</p>
                </div>
                <div className="node rounded-[24px] bg-[#fbfaf7] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]">
                  <strong className="mb-2 block text-sm font-semibold text-[#0d0d0d]">Workflow</strong>
                  <p className="text-sm leading-6 text-[#0d0d0d]/80">Drag, connect, and organize notes without manual setup.</p>
                </div>
                <div className="node rounded-[24px] bg-[#fffbec] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]">
                  <strong className="mb-2 block text-sm font-semibold text-[#0d0d0d]">Design</strong>
                  <p className="text-sm leading-6 text-[#0d0d0d]/80">Keep every contribution visible with live cursors and comments.</p>
                </div>
              </div>

              <div className="hero__canvas-footer flex flex-wrap items-center justify-between gap-4 pt-4">
                <div className="avatar-stack inline-flex items-center gap-[-10px]">
                  <div className="avatar grid h-10 w-10 place-items-center rounded-full bg-[#0d0d0d] text-sm font-bold text-white">AL</div>
                  <div className="avatar grid h-10 w-10 place-items-center rounded-full bg-[#0abfbc] text-sm font-bold text-white">MK</div>
                  <div className="avatar grid h-10 w-10 place-items-center rounded-full bg-[#0d0d0d] text-sm font-bold text-white">SJ</div>
                </div>
                <div className="ghost-pill rounded-full border border-black/12 bg-white/90 px-4 py-3 text-sm text-[#0d0d0d]/80">
                  Realtime collaboration • 3 cursors
                </div>
              </div>
            </div>
            <div className="arrows pointer-events-none absolute inset-0">
              <div className="arrow absolute h-20 w-[2px] bg-[#0d0d0d]/20" style={{ left: '14%', top: '24%', transform: 'rotate(28deg)' }} />
              <div className="arrow absolute h-[72px] w-[2px] bg-[#0d0d0d]/20" style={{ left: '45%', top: '46%', transform: 'rotate(-12deg)' }} />
              <div className="arrow absolute h-[58px] w-[2px] bg-[#0d0d0d]/20" style={{ left: '74%', top: '70%', transform: 'rotate(18deg)' }} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
