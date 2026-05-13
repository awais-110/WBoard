import { ReactNode } from 'react'
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'

/**
 * Layout wrapper for authenticated dashboard pages.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F6F3] text-slate-900">
      <DashboardNavbar />
      {children}
    </div>
  )
}
