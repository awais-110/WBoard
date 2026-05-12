'use client'

import React from 'react'
import { useStickyStore } from '@/stores/stickyStore'
import { useShallow } from 'zustand/react/shallow'
import StickyNote from './StickyNote'

export default function StickyNotesLayer() {
  // ✅ FIX: useShallow so array reference is stable
  const notes = useStickyStore(useShallow((s) => s.notes))

  return (
    <div className="absolute inset-0 pointer-events-none">
      {notes.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <StickyNote note={n} />
        </div>
      ))}
    </div>
  )
}