'use client'

import React, { useState } from 'react'
import { MessageSquare, UserPlus, X, Users } from 'lucide-react'
import { useCollaborationStore } from '@/stores/collaborationStore'
import { useShallow } from 'zustand/react/shallow'

export default function CollaborationPanel() {
  const [open, setOpen] = useState(false)
  const { presenceUsers } = useCollaborationStore(
    useShallow((state) => ({ presenceUsers: state.presenceUsers }))
  )

  // Deduplicate by userId
  const uniqueUsers = presenceUsers.filter(
    (u, i, arr) => arr.findIndex((x) => x.userId === u.userId) === i
  )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto absolute right-2 top-2 z-30 flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]/90 px-2.5 py-2 text-sm font-medium text-white shadow-lg backdrop-blur hover:bg-[#2a2a2a] sm:right-4 sm:top-4 sm:px-3"
      >
        <Users size={15} />
        {uniqueUsers.length > 0 && (
          <span className="flex -space-x-1">
            {uniqueUsers.slice(0, 3).map((u) => (
              <span
                key={u.userId}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-[#1a1a1a] text-[10px] font-bold text-white"
                style={{ backgroundColor: u.color }}
              >
                {(u.fullName ?? '?')[0].toUpperCase()}
              </span>
            ))}
          </span>
        )}
        <span className="text-white/60 text-xs">
          {uniqueUsers.length > 0 ? `${uniqueUsers.length} online` : 'Solo'}
        </span>
      </button>
    )
  }

  return (
    <div className="pointer-events-auto absolute right-2 top-2 z-30 w-[min(16rem,calc(100%-1rem))] rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]/90 p-3 text-white shadow-2xl backdrop-blur sm:right-4 sm:top-4 sm:w-64">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-white">Collaborators</div>
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-white/55 hover:bg-[#2a2a2a] hover:text-white">
            <UserPlus size={14} /> Invite
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-white/55 hover:bg-[#2a2a2a] hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {uniqueUsers.length === 0 ? (
          <div className="rounded-lg bg-[#0f0f0f] p-3 text-xs text-white/50">No collaborators online</div>
        ) : (
          uniqueUsers.map((u) => (
            <div key={u.userId} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[#2a2a2a]">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: u.color }}
              >
                {u.fullName ? u.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('') : '??'}
              </div>
              <div className="min-w-0 flex-1 truncate text-sm font-medium text-white/75">
                {u.fullName ?? 'Anonymous'}
              </div>
              <div className={`h-2 w-2 shrink-0 rounded-full ${u.cursor ? 'bg-emerald-500' : 'bg-white/25'}`} />
            </div>
          ))
        )}
      </div>

      <div className="mt-3">
        <button
          onClick={toggleChat}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <MessageSquare size={16} /> Chat
        </button>
      </div>
    </div>
  )
}

async function toggleChat() {
  try {
    const { useChatStore } = await import('@/stores/chatStore')
    useChatStore.getState().toggle()
  } catch {
    console.warn('toggleChat failed')
  }
}
