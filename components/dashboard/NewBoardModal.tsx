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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[32px] border border-[#00A198]/15 bg-white p-6 shadow-2xl shadow-[#00A198]/15 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#008B7A]/80">New board</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Create a workspace</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
          className="mb-4 h-12 w-full rounded-3xl border border-[#00A198]/20 bg-[#F7FFFD] px-4 text-sm text-slate-900 outline-none placeholder:text-[#00A198]/40 focus:border-[#00A198] focus:ring-2 focus:ring-[#00A198]/20"
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
