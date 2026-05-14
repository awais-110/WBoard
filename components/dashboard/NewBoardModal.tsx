'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

interface NewBoardModalProps {
  onClose: () => void
}

/**
 * Modal for creating a new board.
 */
export default function NewBoardModal({ onClose }: NewBoardModalProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!title.trim()) {
      toast.error('Please enter a board title')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Failed to create board')
      }
      const data = await res.json()
      toast.success('Board created!')
      router.push(`/dashboard/board/${data.id}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create board')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0D]/55 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[24px] border border-[#0D0D0D]/10 bg-[#F7F5F0] p-6 shadow-2xl shadow-black/20 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0ABFBC]">New board</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#0D0D0D]">Create a workspace</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#0D0D0D]/50 transition hover:bg-white hover:text-[#0D0D0D]"
          >
            <X size={20} />
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter board title..."
          autoFocus
          className="mb-4 h-12 w-full rounded-full border border-[#0D0D0D]/10 bg-white px-4 text-sm text-[#0D0D0D] outline-none placeholder:text-[#0D0D0D]/35 focus:border-[#0ABFBC] focus:ring-2 focus:ring-[#0ABFBC]/15"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
          }}
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="h-10 rounded-full px-4 text-sm font-bold text-[#0D0D0D]/60 transition-colors hover:bg-white hover:text-[#0D0D0D]"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-full bg-[#0D0D0D] px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:bg-[#0ABFBC] disabled:opacity-50"
          >
            <Plus size={16} />
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
