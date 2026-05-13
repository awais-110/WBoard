'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock3, Trash2, Users } from 'lucide-react'
import { fabric } from 'fabric'
import type { DashboardBoard } from '@/types/board'

interface BoardCardProps {
  board: DashboardBoard
  onDelete?: (id: string) => void
}

export default function BoardCard({ board, onDelete }: BoardCardProps) {
  const [preview, setPreview] = useState<string | null>(board.thumbnail_url)
  const timeAgo = getTimeAgo(board.updated_at)
  const collaboratorCount = board.members?.length ?? 1

  useEffect(() => {
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
  }, [board.canvas_data, board.thumbnail_url])

  return (
    <Link href={`/dashboard/board/${board.id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#00A198]/20 bg-gradient-to-br from-white to-[#E4DDD3]/20 shadow-md shadow-[#00A198]/5 transition duration-300 hover:-translate-y-1 hover:border-[#00A198]/40 hover:shadow-lg hover:shadow-[#00A198]/15">
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[#E4DDD3]/40 to-[#00A198]/10">
          {preview ? (
            <Image src={preview} alt={board.title} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-300 group-hover:scale-105" unoptimized />
          ) : (
            <div className="text-center">
              <div className="mx-auto h-12 w-20 rounded-lg border-2 border-dashed border-[#00A198]/30 bg-white shadow-sm" />
              <p className="mt-3 text-sm font-semibold text-[#00A198]/60">No preview yet</p>
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full border border-[#00A198]/30 bg-white/90 px-3 py-1 text-xs font-bold text-[#008B7A] shadow-sm backdrop-blur-sm">
            {board.access === 'shared' ? 'Shared' : 'Board'}
          </div>
          {board.role && (
            <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[#00A198] to-[#009E8A] px-3 py-1 text-xs font-bold capitalize text-white shadow-md">
              {board.role}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <h3 className="truncate text-base font-bold text-[#008B7A] transition-colors group-hover:text-[#00A198]">
              {board.title}
            </h3>
            <div className="mt-3 flex items-center gap-4 text-xs text-[#00A198]/60">
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
                if (confirm('Delete this board?')) onDelete(board.id)
              }}
              className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-rose-300/50 bg-gradient-to-r from-rose-100/50 to-rose-50/50 px-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-400/70 hover:from-rose-100 hover:to-rose-50"
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
