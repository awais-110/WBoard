import { ReactNode } from 'react'
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'

/**
 * Layout wrapper for authenticated dashboard pages.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#0D0D0D]">
      <DashboardNavbar />
      {children}
    </div>
  )
}
