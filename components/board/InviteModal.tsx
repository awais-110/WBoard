'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface InviteModalProps {
  boardId: string
  onClose: () => void
  anchorRect?: DOMRect | null
}

export default function InviteModal({ boardId, onClose, anchorRect }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<Array<any>>([])
  const supabase = createClient()
  const popupRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    const loadMembers = async () => {
      try {
        const { data } = await supabase.from('board_members').select('id, user_id, role, profiles(id,email,full_name)').eq('board_id', boardId)
        if (!mounted) return
        setMembers((data as any[]) ?? [])
      } catch (e) {
        /* ignore */
      }
    }

    loadMembers()
    return () => { mounted = false }
  }, [boardId, supabase])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  async function handleInvite() {
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role: 'editor' }),
      })
      const body = await res.json()
      if (!res.ok || body.error) {
        toast.error(body.error || 'Failed to invite')
      } else {
        if (body.invited) {
          toast.success(`${email} added as editor`)
        } else if (body.token) {
          toast.success(`Invite created. Share this link with ${email}`)
          // Optionally copy invite token link to clipboard
          try {
            await navigator.clipboard.writeText(`${window.location.origin}/invites/accept?token=${body.token}`)
            toast('Invite link copied to clipboard')
          } catch (e) {
            // ignore
          }
        }
        setEmail('')
        // refresh members
        const { data } = await supabase.from('board_members').select('id, user_id, role, profiles(id,email,full_name)').eq('board_id', boardId)
        setMembers((data as any[]) ?? [])
        onClose()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remove this member from the board?')) return
    try {
      const res = await fetch(`/api/boards/${boardId}/members/${userId}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok || body.error) {
        toast.error(body.error || 'Failed to remove')
        return
      }
      toast.success('Member removed')
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove')
    }
  }

  const positionStyle: React.CSSProperties | undefined = anchorRect
    ? {
        top: anchorRect.bottom + 8,
        left: anchorRect.left,
        position: 'fixed',
      }
    : undefined

  const popupClasses = anchorRect
    ? 'pointer-events-auto absolute w-full max-w-[280px] rounded-xl border border-black/10 bg-white p-3 text-black shadow-2xl'
    : 'pointer-events-auto absolute left-1/2 top-24 w-full max-w-[280px] -translate-x-1/2 rounded-xl border border-black/10 bg-white p-3 text-black shadow-2xl'

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div ref={popupRef} className={popupClasses} style={{ ...(positionStyle ?? {}), backdropFilter: 'blur(6px)' }}>
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#0d0d0d]">Invite collaborators</h3>
            <p className="mt-0.5 text-[11px] text-[#0d0d0d]/50">Live presence and quick invite</p>
          </div>
          <button type="button" onClick={onClose} className="ml-2 rounded-md p-1 text-black/60 hover:text-black">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {members.length > 0 && (
            <div className="mb-2">
              <div className="text-[11px] font-medium text-[#0d0d0d]/60">Members</div>
              <div className="mt-1 max-h-36 overflow-auto">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 py-1">
                    <div className="min-w-0">
                      <div className="truncate text-sm">{m.profiles?.full_name ?? m.profiles?.email}</div>
                      <div className="text-[11px] text-[#0d0d0d]/45">{m.role}</div>
                    </div>
                    <div className="ml-2">
                      <button onClick={() => handleRemove(m.user_id)} className="text-xs text-red-500">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <label className="block">
            <div className="text-[11px] font-medium text-[#0d0d0d]/60">Email</div>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none"
            />
          </label>

          <div className="flex items-center gap-2">
            <div className="ml-auto flex gap-2 w-full">
              <button onClick={onClose} className="h-9 w-1/2 rounded-md border border-black/10 bg-white text-sm text-[#0d0d0d]/70">
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={loading}
                className="h-9 w-1/2 rounded-md bg-[#00A198] text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Inviting...' : 'Invite'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
