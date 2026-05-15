'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock, Download, Loader2, LogOut, MessageSquare, RotateCcw, Grid3x3, Hash, Share2, Sparkles, Trash2, UserPlus, Users, X } from 'lucide-react'
import { exportAsPng, exportAsSvg } from '@/lib/fabric/export'
import { useShallow } from 'zustand/react/shallow'
import { useSaveStore } from '@/stores/saveStore'
import { useCanvasStore } from '@/stores/canvasStore'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import InviteModal from '@/components/board/InviteModal'
import ExportMenu from '@/components/board/ExportMenu'
import VersionHistoryModal from '@/components/board/VersionHistoryModal'
import AIModal from '@/components/board/AIModal'
import { useCollaborationStore } from '@/stores/collaborationStore'
import { useChatStore } from '@/stores/chatStore'

function getCanvasInstance() {
  return (window as any).__fabric__ ?? null
}

interface TopNavbarProps {
  boardName?: string
  onUndo: () => void
  onRedo: () => void
  onClear?: () => void
  boardId?: string
  canEdit?: boolean
}

export default function TopNavbar({
  boardName = 'IdeaSpace',
  onUndo,
  onRedo,
  onClear,
  boardId,
  canEdit = false,
}: TopNavbarProps) {
  const { status, lastSavedAt, error } = useSaveStore(
    useShallow((s) => ({ status: s.status, lastSavedAt: s.lastSavedAt, error: s.error }))
  )
  const { showGrid, snapToGrid, toggleGrid, toggleSnap } = useCanvasStore(
    useShallow((s) => ({
      showGrid: s.showGrid,
      snapToGrid: s.snapToGrid,
      toggleGrid: s.toggleGrid,
      toggleSnap: s.toggleSnap,
    }))
  )
  const { presenceUsers } = useCollaborationStore(
    useShallow((state) => ({ presenceUsers: state.presenceUsers }))
  )
  const supabase = useMemo(() => createClient(), [])
  const toggleChat = useChatStore((state) => state.toggle)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteAnchorRect, setInviteAnchorRect] = useState<DOMRect | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showPresenceMenu, setShowPresenceMenu] = useState(false)
  const presenceMenuRef = useRef<HTMLDivElement | null>(null)

  const uniqueUsers = useMemo(
    () =>
      presenceUsers.filter((user, index, array) => array.findIndex((item) => item.userId === user.userId) === index),
    [presenceUsers]
  )

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!presenceMenuRef.current?.contains(event.target as Node)) {
        setShowPresenceMenu(false)
      }
    }

    if (showPresenceMenu) {
      window.addEventListener('mousedown', handleOutsideClick)
      return () => window.removeEventListener('mousedown', handleOutsideClick)
    }

    return undefined
  }, [showPresenceMenu])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleExportPng = () => {
    const fc = getCanvasInstance()
    if (fc) {
      exportAsPng(fc, boardName)
      return
    }

    const el = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!el) return
    const a = document.createElement('a')
    a.download = `${boardName}.png`
    a.href = el.toDataURL('image/png')
    a.click()
  }

  const handleExportSvg = () => {
    const fc = getCanvasInstance()
    if (!fc) return
    const svg = exportAsSvg(fc)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${boardName}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="flex h-14 w-full items-center justify-between gap-3 border-b border-black/[0.08] bg-[#f7f5f0]/95 px-3 text-[#0d0d0d] sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#0d0d0d] text-xs font-semibold text-white shadow-[0_8px_24px_rgba(13,13,13,0.18)]">
            {boardName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold tracking-tight">{boardName}</div>
            <div className="text-[11px] text-[#0d0d0d]/45">Pro canvas editor workspace</div>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-black/[0.08] bg-white/85 px-1.5 py-1 shadow-[0_10px_30px_rgba(13,13,13,0.06)] backdrop-blur-md">
          <NavBtn onClick={onUndo} title="Undo (Ctrl+Z)">
            <RotateCcw size={14} />
          </NavBtn>
          <NavBtn onClick={onRedo} title="Redo (Ctrl+Shift+Z)">
            <RotateCcw size={14} className="scale-x-[-1]" />
          </NavBtn>
          <div className="mx-1 h-4 w-px bg-black/10" />
          <NavBtn onClick={toggleGrid} title="Toggle grid" active={showGrid}>
            <Grid3x3 size={14} />
          </NavBtn>
          <NavBtn onClick={toggleSnap} title="Toggle snap" active={snapToGrid}>
            <Hash size={14} />
          </NavBtn>
          {onClear && (
            <>
              <div className="mx-1 h-4 w-px bg-black/10" />
              <NavBtn onClick={onClear} title="Clear canvas" danger>
                <Trash2 size={14} />
              </NavBtn>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={presenceMenuRef}>
            <button
              type="button"
              onClick={() => setShowPresenceMenu((value) => !value)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-black/[0.08] bg-white/90 px-3 text-xs text-[#0d0d0d]/60 shadow-[0_10px_20px_rgba(13,13,13,0.04)] transition-colors hover:bg-white"
              title="Collaborators"
            >
              <Users size={13} className="text-[#0d0d0d]/45" />
              <div className="flex -space-x-2">
                {uniqueUsers.slice(0, 2).map((user) => (
                  <span
                    key={user.userId}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-white text-[10px] font-semibold text-white shadow-sm"
                    style={{ backgroundColor: user.color }}
                    title={user.fullName ?? 'Anonymous'}
                  >
                    {(user.fullName ?? '?')[0].toUpperCase()}
                  </span>
                ))}
              </div>
              <span>{uniqueUsers.length ? `${uniqueUsers.length} online` : 'Solo mode'}</span>
            </button>

            {showPresenceMenu && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_60px_rgba(13,13,13,0.16)]">
                <div className="flex items-center justify-between border-b border-black/[0.08] px-3 py-2.5">
                  <div>
                    <div className="text-sm font-semibold text-[#0d0d0d]">Collaborators</div>
                    <div className="text-[11px] text-[#0d0d0d]/45">Live presence and quick actions</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPresenceMenu(false)}
                    className="rounded-full p-1 text-[#0d0d0d]/45 transition-colors hover:bg-black/[0.05] hover:text-[#0d0d0d]"
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="max-h-56 overflow-auto p-2">
                  {uniqueUsers.length === 0 ? (
                    <div className="rounded-xl bg-black/[0.03] px-3 py-3 text-sm text-[#0d0d0d]/45">No collaborators online</div>
                  ) : (
                    uniqueUsers.map((user) => (
                      <div key={user.userId} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.03]">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: user.color }}
                        >
                          {(user.fullName ?? '?')[0].toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-[#0d0d0d]">{user.fullName ?? 'Anonymous'}</div>
                          <div className="text-[11px] text-[#0d0d0d]/45">{user.cursor ? 'Active now' : 'Connected'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-black/[0.08] p-3">
                  <button
                    type="button"
                    onClick={() => {
                      const rect = presenceMenuRef.current?.getBoundingClientRect() ?? null
                      setInviteAnchorRect(rect)
                      setShowPresenceMenu(false)
                      setShowInvite(true)
                    }}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#0abfbc] text-xs font-medium text-white transition-colors hover:bg-[#089e99]"
                  >
                    <UserPlus size={14} /> Invite
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPresenceMenu(false)
                      setShowAI(false)
                      toggleChat()
                    }}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white text-xs font-medium text-[#0d0d0d]/70 transition-colors hover:bg-black/[0.05] hover:text-[#0d0d0d]"
                  >
                    <MessageSquare size={14} /> Chat
                  </button>
                </div>
              </div>
            )}
          </div>
          <SaveStatus status={status} lastSavedAt={lastSavedAt} error={error} />
          {status === 'error' && (
            <button
              onClick={() => window.dispatchEvent(new Event('whiteboard:retry-save'))}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <RotateCcw size={12} /> Retry
            </button>
          )}
          {canEdit && boardId && (
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#0abfbc] px-3 text-xs font-medium text-white shadow-[0_12px_28px_rgba(10,191,188,0.18)] transition-colors hover:bg-[#089e99]"
              title="Share"
            >
              <Share2 size={14} /> Share
            </button>
          )}
          <NavBtn onClick={() => setShowHistory(true)} title="History">
            <Clock size={14} />
          </NavBtn>
          <NavBtn onClick={() => setShowAI(true)} title="AI">
            <Sparkles size={14} />
          </NavBtn>
          <NavBtn onClick={handleExportPng} title="Export PNG">
            <Download size={14} />
          </NavBtn>
          <NavBtn onClick={handleExportSvg} title="Export SVG">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h18v18H3z" />
            </svg>
          </NavBtn>
          <button
            onClick={handleLogout}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-500/25 bg-rose-500/8 px-3 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/15"
            title="Logout"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {showInvite && boardId && canEdit && (
        <InviteModal boardId={boardId} onClose={() => setShowInvite(false)} anchorRect={inviteAnchorRect} />
      )}
      {showExport && <ExportMenu fabricRef={{ current: getCanvasInstance() }} boardTitle={boardName} onClose={() => setShowExport(false)} />}
      {showHistory && boardId && <VersionHistoryModal boardId={boardId} fabricRef={{ current: getCanvasInstance() }} onClose={() => setShowHistory(false)} />}
      {showAI && boardId && <AIModal boardId={boardId} onClose={() => setShowAI(false)} />}
    </>
  )
}

function NavBtn({
  children,
  onClick,
  title,
  active,
  danger,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full transition-all',
        danger
          ? 'text-red-400 hover:bg-red-50 hover:text-red-500'
          : active
          ? 'bg-[#0abfbc]/15 text-[#0abfbc] shadow-sm'
          : 'text-[#0d0d0d]/55 hover:bg-black/[0.05] hover:text-[#0d0d0d]'
      )}
    >
      {children}
    </button>
  )
}

function SaveStatus({ status, lastSavedAt, error }: { status: string; lastSavedAt: string | null; error?: string | null }) {
  if (status === 'saving') {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 text-xs text-[#0d0d0d]/55">
        <Loader2 size={12} className="animate-spin text-[#0abfbc]" /> Saving…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 text-xs text-red-600" title={error ?? ''}>
        <AlertCircle size={12} /> Failed
      </div>
    )
  }

  if (status === 'saved') {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs text-emerald-700">
        <CheckCircle2 size={12} /> Saved {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
    )
  }

  return (
    <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 text-xs text-[#0d0d0d]/45">
      <span className="h-1.5 w-1.5 rounded-full bg-[#0d0d0d]/20" /> Ready
    </div>
  )
}
