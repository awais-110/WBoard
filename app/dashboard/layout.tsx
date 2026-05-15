"use client"

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'

/**
 * Layout wrapper for authenticated dashboard pages.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const showDashboardNavbar = pathname === '/dashboard'

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#0D0D0D]">
      {showDashboardNavbar && <DashboardNavbar />}
      {children}
    </div>
  )
}
