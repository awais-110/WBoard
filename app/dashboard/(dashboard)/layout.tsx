import { ReactNode } from 'react'
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'

/**
 * Layout wrapper for authenticated dashboard pages.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardNavbar />
      <div className="bg-slate-50">{children}</div>
    </>
  )
}
