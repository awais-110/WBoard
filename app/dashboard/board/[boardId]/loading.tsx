'use client'

import { useEffect, useState } from 'react'

export default function Loading() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(10,191,188,0.08),_transparent_28%),linear-gradient(180deg,#faf8f4_0%,#f3efe8_100%)]">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/[0.08] bg-white/80 px-6 py-5 shadow-[0_18px_45px_rgba(13,13,13,0.08)] backdrop-blur-sm">
        <div className="h-12 w-12 rounded-full border-4 border-[#0ABFBC]/25 border-t-[#0ABFBC] opacity-50 animate-spin" />
        <div className="text-sm font-medium text-[#0d0d0d]/65">Loading board…</div>
      </div>
    </div>
  )
}
