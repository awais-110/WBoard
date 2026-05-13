'use client'

import React from 'react'
import { AlertCircle, CheckCircle2, Download, Loader2, MoreHorizontal, RotateCcw, Settings, Share2, Users } from 'lucide-react'
import { exportAsPng, exportAsSvg } from '@/lib/fabric/export'
import { useShallow } from 'zustand/react/shallow'
import { useSaveStore } from '@/stores/saveStore'

function getCanvasInstance(): HTMLCanvasElement | null {
  return document.querySelector('canvas') as HTMLCanvasElement | null
}

export default function TopNavbar({ boardName = 'Untitled Board' }: { boardName?: string }) {
  // ✅ FIX: single shallow selector instead of multiple individual selectors
  const { status, lastSavedAt, error } = useSaveStore(
    useShallow((s) => ({ status: s.status, lastSavedAt: s.lastSavedAt, error: s.error }))
  )

  const handleExportPng = () => {
    const canvasEl = getCanvasInstance()
    if (!canvasEl) return
    const fabricCanvas = (window as any).__fabric__ ?? (canvasEl as any).__fabric
    if (fabricCanvas && typeof exportAsPng === 'function') {
      exportAsPng(fabricCanvas)
    } else {
      const link = document.createElement('a')
      link.download = `${boardName || 'whiteboard'}.png`
      link.href = canvasEl.toDataURL('image/png')
      link.click()
    }
  }

  const handleExportSvg = () => {
    const canvasEl = getCanvasInstance()
    if (!canvasEl) return
    const fabricCanvas = (window as any).__fabric__ ?? (canvasEl as any).__fabric
    if (fabricCanvas && typeof exportAsSvg === 'function') {
      const svg = exportAsSvg(fabricCanvas)
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${boardName || 'whiteboard'}.svg`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      console.warn('SVG export requires fabric canvas instance')
    }
  }

  return (
    <div className="hidden h-12 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 bg-[#0f0f0f] px-4 text-white sm:grid">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-semibold text-white shadow-sm">
          {boardName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden text-xs font-medium text-white/55 sm:block">Whiteboard</div>
      </div>

      <div className="min-w-0 max-w-md truncate text-center text-sm font-semibold text-white">
        {boardName}
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <SaveStatus status={status} lastSavedAt={lastSavedAt} error={error} />
        {status === 'error' && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('whiteboard:retry-save'))}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#2a2a2a] px-3 text-xs font-medium text-rose-300 hover:bg-[#2a2a2a]"
          >
            <RotateCcw size={14} />
            Retry
          </button>
        )}
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white" title="Collaborators">
          <Users size={18} />
        </button>
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white" title="Share">
          <Share2 size={18} />
        </button>
        <button onClick={handleExportPng} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white" title="Export PNG">
          <Download size={18} />
        </button>
        <button onClick={handleExportSvg} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white" title="Export SVG">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
          </svg>
        </button>
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white" title="Settings">
          <Settings size={18} />
        </button>
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white" title="More">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  )
}

function SaveStatus({
  status,
  lastSavedAt,
  error,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: string | null
  error?: string | null
}) {
  if (status === 'saving') {
    return (
      <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-xs font-medium text-indigo-300">
        <Loader2 size={14} className="animate-spin" />
        Saving
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-medium text-rose-300" title={error ?? 'Save failed'}>
        <AlertCircle size={14} />
        Save failed
      </div>
    )
  }

  if (status === 'saved') {
    return (
      <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-300">
        <CheckCircle2 size={14} />
        Saved {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
    )
  }

  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-xs font-medium text-white/55">
      <span className="h-2 w-2 rounded-full bg-white/30" />
      Ready
    </div>
  )
}
