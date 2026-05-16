'use client'

import { useEffect, useState } from 'react'
import BoardCard from '@/components/dashboard/BoardCard'
import Skeleton from '@/components/ui/Skeleton'

export default function Loading() {
  const [phase, setPhase] = useState<'hidden' | 'skeleton' | 'spinner'>('hidden')

  useEffect(() => {
    const showSkeleton = window.setTimeout(() => setPhase('skeleton'), 300)
    const showSpinner = window.setTimeout(() => setPhase('spinner'), 1500)
    return () => {
      window.clearTimeout(showSkeleton)
      window.clearTimeout(showSpinner)
    }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#0D0D0D]">
      <header className="border-b border-[#0D0D0D]/10 bg-[#F7F5F0]">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Skeleton className="h-4 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-48 rounded-md" />
                <Skeleton className="h-4 w-full max-w-lg rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Skeleton className="hidden h-14 w-24 rounded-2xl sm:block" />
              <Skeleton className="hidden h-14 w-24 rounded-2xl sm:block" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {phase === 'skeleton' ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Skeleton className="h-16 rounded-[24px]" />
              <Skeleton className="h-16 rounded-[24px]" />
            </div>

            <section className="mt-6 rounded-[24px] border border-[#0D0D0D]/10 bg-white/55 p-5 shadow-[0_18px_45px_rgba(13,13,13,0.05)]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-4 w-56 rounded-md" />
                </div>
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BoardCard key={i} loading variant={i} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-10 w-10 rounded-full border-4 border-[#0ABFBC]/25 border-t-[#0ABFBC] opacity-50 animate-spin" />
          </div>
        )}
      </main>
    </div>
  )
}
