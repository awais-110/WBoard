'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import InviteModal from './InviteModal'
import ExportMenu from './ExportMenu'
import { useCollaborationStore } from '@/stores/collaborationStore'
import { useShallow } from 'zustand/react/shallow'
import { ChevronLeft, Clock, Download, LogOut, Sparkles, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import VersionHistoryModal from './VersionHistoryModal'
import AIModal from './AIModal'
import type { Board } from '@/types/board'
import type { fabric } from 'fabric'

interface BoardHeaderProps {
  board: Board
  canEdit: boolean
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
}

export default function BoardHeader({ board, canEdit, fabricRef }: BoardHeaderProps) {
  const { presenceUsers } = useCollaborationStore(
    useShallow((state) => ({ presenceUsers: state.presenceUsers }))
  )
  const supabase = useMemo(() => createClient(), [])
  const [title, setTitle] = useState(board.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAI, setShowAI] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleTitleSave() {
    if (title.trim() === board.title) {
      setEditingTitle(false)
      return
    }
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Title updated')
      setEditingTitle(false)
    } catch {
      toast.error('Failed to update title')
      setTitle(board.title)
    }
  }

  return (
    <header className="border-t border-[#2a2a2a] bg-[#1a1a1a]/95 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-2 sm:h-12 sm:gap-3 sm:px-3 lg:px-4">
        <Link
          href="/"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] text-white/70 transition-colors hover:bg-[#2a2a2a] hover:text-white sm:h-9 sm:w-9"
        >
          <ChevronLeft size={18} />
        </Link>

        <div className="min-w-0 flex-1">
          {editingTitle && canEdit ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave() }}
              autoFocus
              className="h-9 w-full max-w-xl rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm font-semibold text-white outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-600/30"
            />
          ) : (
            <button
              type="button"
              onClick={() => canEdit && setEditingTitle(true)}
              className={cn(
                'group flex h-10 w-full max-w-xl items-center gap-2 rounded-lg px-2 text-left transition-colors sm:h-9 sm:gap-3 sm:px-3',
                canEdit ? 'hover:bg-[#2a2a2a]' : 'cursor-default'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-sm font-semibold text-white sm:text-sm">
                    {title}
                  </h1>
                  <span className="hidden rounded-full border border-[#2a2a2a] bg-[#0f0f0f] px-2 py-0.5 text-[11px] font-medium text-white/55 sm:inline-flex">
                    {canEdit ? 'Editable' : 'View only'}
                  </span>
                </div>
                <p className="hidden text-xs text-white/45 md:block">
                  Collaborative whiteboard workspace
                </p>
              </div>
            </button>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="flex h-9 items-center rounded-full border border-[#2a2a2a] bg-[#0f0f0f] px-2 shadow-sm">
            <div className="-space-x-2 flex items-center">
              {presenceUsers.slice(0, 5).map((u) => (
                <div
                  key={u.userId}
                  title={u.fullName ?? 'Anonymous'}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0f0f0f] text-xs font-medium text-white"
                  style={{ backgroundColor: u.color }}
                >
                  {(u.fullName ?? '?')[0].toUpperCase()}
                </div>
              ))}
            </div>
            <span className="ml-2 text-xs font-medium text-white/55">
              {presenceUsers.length ? `${presenceUsers.length} online` : 'Solo mode'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {canEdit && (
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-sm font-medium text-white transition-colors hover:bg-indigo-500 sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
              title="Share"
            >
              <Share2 size={15} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          <button
            onClick={() => setShowHistory(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] text-sm font-medium text-white/75 transition-colors hover:bg-[#2a2a2a] hover:text-white sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
            title="History"
          >
            <Clock size={15} />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={() => setShowAI(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] text-sm font-medium text-white/75 transition-colors hover:bg-[#2a2a2a] hover:text-white sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
            title="AI"
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">AI</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="hidden h-9 items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm font-medium text-white/75 transition-colors hover:bg-[#2a2a2a] hover:text-white sm:inline-flex"
          >
            <Download size={15} />
            Export
          </button>
          <button
            onClick={handleLogout}
            className="hidden h-9 items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20 sm:inline-flex"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>

      {showInvite && <InviteModal boardId={board.id} onClose={() => setShowInvite(false)} />}
      {showExport && (
        <ExportMenu fabricRef={fabricRef} boardTitle={board.title} onClose={() => setShowExport(false)} />
      )}
      {showHistory && (
        <VersionHistoryModal boardId={board.id} fabricRef={fabricRef} onClose={() => setShowHistory(false)} />
      )}
      {showAI && (
        <AIModal boardId={board.id} onClose={() => setShowAI(false)} />
      )}
    </header>
  )
}
