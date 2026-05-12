'use client'

import React, { useRef, useState } from 'react'
import { Grip, MessageCircle, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useCommentStore } from '@/stores/commentStore'
import { useStickyStore, type StickyNoteData } from '@/stores/stickyStore'

export default function StickyNote({ note }: { note: StickyNoteData }) {
  const { update, remove } = useStickyStore(
    useShallow((state) => ({ update: state.update, remove: state.remove }))
  )
  const openFor = useCommentStore(useShallow((state) => state.openFor))
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const onPointerDown = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('[data-sticky-action], [contenteditable="true"]')) return

    const element = ref.current
    if (!element) return

    dragOffsetRef.current = {
      x: event.clientX - note.x,
      y: event.clientY - note.y,
    }
    element.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging) return

    update(note.id, {
      x: event.clientX - dragOffsetRef.current.x,
      y: event.clientY - dragOffsetRef.current.y,
    })
  }

  const onPointerUp = (event: React.PointerEvent) => {
    ref.current?.releasePointerCapture(event.pointerId)
    setDragging(false)
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ left: note.x, top: note.y }}
      className="absolute w-48 touch-none rounded-xl border border-black/10 bg-white shadow-lg"
    >
      <div className="flex h-8 cursor-grab items-center justify-between rounded-t-xl px-2 shadow-sm" style={{ backgroundColor: note.color }}>
        <Grip size={14} className="text-slate-700" />
        <div className="flex items-center gap-1">
          <button
            data-sticky-action
            type="button"
            onClick={() => openFor(note.id)}
            className="rounded-lg p-1 text-slate-700 hover:bg-white/40"
            title="Comments"
          >
            <MessageCircle size={14} />
          </button>
          <button
            data-sticky-action
            type="button"
            onClick={() => remove(note.id)}
            className="rounded-lg p-1 text-slate-700 hover:bg-white/40"
            title="Remove sticky note"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="relative min-h-28 rounded-b-xl bg-white p-3">
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(event) => update(note.id, { content: event.currentTarget.textContent || '' })}
          className="min-h-20 whitespace-pre-wrap text-sm leading-5 text-slate-800 outline-none"
        >
          {note.content}
        </div>
        <div className="absolute bottom-2 right-2 h-3 w-3 rounded-br-lg border-b-2 border-r-2 border-slate-300" />
      </div>
    </div>
  )
}
