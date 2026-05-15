'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToHash() {
  const pathname = usePathname()

  useEffect(() => {
    // wait a tick for DOM to update after navigation
    const id = window.location.hash?.replace('#', '')
    if (!id) return

    const t = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY
        // adjust for navbar height if needed
        const NAV_HEIGHT = 72
        window.scrollTo({ top: y - NAV_HEIGHT, behavior: 'smooth' })
      }
    }, 60)

    return () => clearTimeout(t)
  }, [pathname])

  // also handle manual hash changes
  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash?.replace('#', '')
      if (!id) return
      const el = document.getElementById(id)
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY
        const NAV_HEIGHT = 72
        window.scrollTo({ top: y - NAV_HEIGHT, behavior: 'smooth' })
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return null
}
