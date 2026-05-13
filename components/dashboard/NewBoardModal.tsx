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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-white shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">New Board</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/55 transition-colors hover:bg-[#2a2a2a] hover:text-white"
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
          className="mb-4 h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/30"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
          }}
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-sm font-medium text-white/65 transition-colors hover:bg-[#2a2a2a] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus size={16} />
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
