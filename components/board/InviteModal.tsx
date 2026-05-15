'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { BadgeCheck, Crown, Mail, Shield, Sparkles, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { BoardRole } from '@/types/board'
import { cn } from '@/lib/utils'

interface InviteModalProps {
  boardId: string
  onClose: () => void
  anchorRect?: DOMRect | null
}

export default function InviteModal({ boardId, onClose, anchorRect }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<BoardRole>('editor')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const popupRef = useRef<HTMLDivElement | null>(null)

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

      // insert member
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const membersTable = supabase.from('board_members') as any
      const { error } = await membersTable.insert({ board_id: boardId, user_id: profile.id, role })

      if (error) {
        if ((error as any).code === '23505') {
          toast.error('User is already a member')
        } else {
          toast.error((error as any).message || 'Failed to invite')
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

function RoleChip({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all',
        active ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-[#0b0b0b] text-white/70'
      )}
    >
      <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', active ? 'bg-cyan-400/15 text-cyan-200' : 'bg-white/5 text-white/70')}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </div>
  )
}

function InfoRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300" />
      <span>{text}</span>
    </div>
  )
}
