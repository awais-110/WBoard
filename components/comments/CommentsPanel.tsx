'use client'

import React, { useRef, useEffect, useState } from 'react'
import { X, Send } from 'lucide-react'
import { useCommentStore } from '@/stores/commentStore'
import { useShallow } from 'zustand/react/shallow'

export default function CommentsPanel() {
  const { openTargetId, comments, close, add } = useCommentStore(
    useShallow((s) => ({
      openTargetId: s.openTargetId,
      comments: s.comments,
      close: s.close,
      add: s.add,
    }))
  )

  const filteredComments = comments.filter((c) => c.targetId === openTargetId)
  const [text, setText] = useState('')
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [filteredComments.length])

  if (!openTargetId) return null

  const handleSend = () => {
    if (!text.trim()) return
    add({ targetId: openTargetId, userId: 'local', name: 'You', text: text.trim() })
    setText('')
  }

  return (
    <div className="absolute bottom-24 left-2 z-40 w-[calc(100vw-1rem)] max-w-96 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]/95 text-white shadow-2xl backdrop-blur sm:left-4 sm:w-96">
      <div className="flex items-center justify-between border-b border-[#2a2a2a] px-3 py-2">
        <div className="text-sm font-semibold text-white">Comments</div>
        <button onClick={close} className="rounded-lg p-1 text-white/55 hover:bg-[#2a2a2a] hover:text-white"><X size={16} /></button>
      </div>
      <div ref={ref} className="max-h-64 overflow-auto p-3 space-y-3">
        {filteredComments.length === 0
          ? <div className="text-xs text-white/50">No comments yet.</div>
          : filteredComments.map((c) => (
            <div key={c.id} className="text-sm">
              <div className="text-xs text-white/45">{c.name} · {new Date(c.created_at).toLocaleTimeString()}</div>
              <div className="mt-0.5 text-white/80">{c.text}</div>
            </div>
          ))}
      </div>
      <div className="flex items-center gap-2 border-t border-[#2a2a2a] px-3 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          className="h-9 flex-1 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/30"
          placeholder="Write a comment..."
        />
        <button onClick={handleSend} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-indigo-500"><Send size={14} /></button>
      </div>
    </div>
  )
}
