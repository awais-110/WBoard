'use client'

import { useCollaborationStore } from '@/stores/collaborationStore'
import { useShallow } from 'zustand/react/shallow'

export default function CollaboratorCursors() {
  const { presenceUsers } = useCollaborationStore(
    useShallow((state) => ({ presenceUsers: state.presenceUsers }))
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {presenceUsers
        .filter((u) => u.cursor)
        .map((user) => (
          <div
            key={user.userId}
            className="absolute transition-transform duration-75"
            style={{
              left: user.cursor!.x,
              top: user.cursor!.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 2l12 7-6 1-3 6L4 2z"
                fill={user.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <span
              className="absolute left-4 top-0 px-1.5 py-0.5 rounded text-white text-xs whitespace-nowrap font-medium"
              style={{ backgroundColor: user.color }}
            >
              {user.fullName ?? 'Anonymous'}
            </span>
          </div>
        ))}
    </div>
  )
}
