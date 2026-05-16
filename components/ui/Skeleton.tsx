import React from 'react'
import { cn } from '@/lib/utils'

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-md bg-gray-200 opacity-50 dark:bg-[#2a2a2a] transition-opacity', className)}
      aria-hidden
    />
  )
}
