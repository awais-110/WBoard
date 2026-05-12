'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { BoardRole } from '@/types/board'

interface InviteModalProps {
  boardId: string
  onClose: () => void
}

/**
 * Modal for inviting collaborators to a board.
 */
export default function InviteModal({ boardId, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<BoardRole>('editor')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleInvite() {
    if (!email.trim()) return
    setLoading(true)

    try {
      // Look up user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .single<{ id: string }>()

      if (profileError || !profile) {
        toast.error('User not found. They must create an account first.')
        setLoading(false)
        return
      }

      // Add to board_members
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const membersTable = supabase.from('board_members') as any
      const { error } = await membersTable.insert({
        board_id: boardId,
        user_id: profile.id,
        role,
      })

      if (error) {
        if (error.code === '23505') {
          toast.error('User is already a member')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.success(`${email} added as ${role}`)
        setEmail('')
        onClose()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-white shadow-2xl transition-all">
        <h2 className="mb-4 text-lg font-semibold">Invite Collaborator</h2>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-600 focus:ring-2 focus:ring-violet-600/30"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as BoardRole)}
          className="mb-4 h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm text-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/30"
        >
          <option value="viewer">Viewer — can only view</option>
          <option value="editor">Editor — can draw and edit</option>
          <option value="admin">Admin — can invite others</option>
        </select>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-sm font-medium text-white/65 hover:bg-[#2a2a2a] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={loading}
            className="h-9 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Inviting...' : 'Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}
