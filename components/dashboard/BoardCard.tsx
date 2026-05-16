'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock3, Trash2, Users } from 'lucide-react'
import { fabric } from 'fabric'
import type { DashboardBoard } from '@/types/board'
import Skeleton from '@/components/ui/Skeleton'

interface BoardCardProps {
  board?: DashboardBoard
  variant?: number
  onDelete?: (id: string) => void
  loading?: boolean
}

const cardVariants = [
  'border-[#0D0D0D]/10 bg-white/70',
  'border-[#0ABFBC]/25 bg-white/70',
  'border-[#F59E0B]/20 bg-white/70',
  'border-[#8B5CF6]/20 bg-white/70',
  'border-[#EC4899]/20 bg-white/70',
  'border-[#0D0D0D]/10 bg-white/70',
]

export default function BoardCard({ board, variant = 0, onDelete, loading = false }: BoardCardProps) {
  const [preview, setPreview] = useState<string | null>(board?.thumbnail_url ?? null)
  const variantClass = cardVariants[variant % cardVariants.length]
  useEffect(() => {
    if (!board) return
    if (board.thumbnail_url || !board.canvas_data?.objects?.length) return

    const element = document.createElement('canvas')
    const canvas = new fabric.StaticCanvas(element, {
      width: 480,
      height: 270,
      backgroundColor: '#ffffff',
    })

    canvas.loadFromJSON(board.canvas_data, () => {
      canvas.setZoom(0.35)
      canvas.renderAll()
      setPreview(canvas.toDataURL({ format: 'png', multiplier: 1 }))
      canvas.dispose()
    })
  }, [board])

  if (loading) {
    return (
      <div className="group block h-full">
        <article className={`flex h-full flex-col overflow-hidden rounded-[24px] border shadow-[0_18px_45px_rgba(13,13,13,0.06)] ${variantClass} transition duration-300`}>
          <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[#F7F5F0]">
            <Skeleton className="absolute inset-0 rounded-none" />
          </div>

          <div className="flex flex-1 flex-col gap-4 p-5">
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-3 w-12 rounded-full" />
              </div>
            </div>

            <div className="mt-auto h-10 rounded-full bg-gray-200 opacity-50 dark:bg-[#2a2a2a]" />
          </div>
        </article>
      </div>
    )
  }

  const timeAgo = getTimeAgo(board!.updated_at)
  const collaboratorCount = board!.members?.length ?? 1

  

  return (
    <Link href={`/dashboard/board/${board!.id}`} className="group block h-full">
      <article className={`flex h-full flex-col overflow-hidden rounded-[24px] border shadow-[0_18px_45px_rgba(13,13,13,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#0ABFBC]/45 hover:shadow-[0_28px_60px_rgba(13,13,13,0.10)] ${variantClass}`}>
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[#F7F5F0]">
          {preview ? (
            <Image src={preview} alt={board!.title} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-300 group-hover:scale-105" unoptimized />
          ) : (
            <div className="text-center">
              <div className="mx-auto h-16 w-24 rounded-2xl border border-dashed border-[#0D0D0D]/20 bg-white shadow-sm" />
              <p className="mt-3 text-sm font-semibold text-[#0D0D0D]/55">No preview yet</p>
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full border border-[#0D0D0D]/10 bg-white/90 px-3 py-1 text-xs font-bold text-[#0D0D0D] shadow-sm backdrop-blur-sm">
            {board!.access === 'shared' ? 'Shared' : 'Board'}
          </div>
          {board!.role && (
            <div className="absolute right-3 top-3 rounded-full bg-[#0ABFBC] px-3 py-1 text-xs font-bold capitalize text-white shadow-md">
              {board!.role}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <h3 className="truncate text-base font-bold text-[#0D0D0D] transition-colors group-hover:text-[#0ABFBC]">
              {board!.title}
            </h3>
            <div className="mt-3 flex items-center gap-4 text-xs text-[#0D0D0D]/55">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={13} />
                {timeAgo}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={13} />
                {collaboratorCount}
              </span>
            </div>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (confirm('Delete this board?')) onDelete(board!.id)
              }}
              className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#0D0D0D]/10 bg-[#F7F5F0] px-3 text-sm font-bold text-[#0D0D0D]/70 shadow-sm transition hover:border-rose-300 hover:text-rose-700"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </article>
    </Link>
  )
}

function getTimeAgo(date: string) {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffMins = Math.max(0, Math.floor(diffMs / 60000))
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays > 0) return `Edited ${diffDays}d ago`
  if (diffHours > 0) return `Edited ${diffHours}h ago`
  if (diffMins > 0) return `Edited ${diffMins}m ago`
  return 'Edited just now'
}
