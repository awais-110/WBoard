import { create } from 'zustand'
import type { PresenceUser } from '@/types/user'

interface CollaborationStore {
  presenceUsers: PresenceUser[]
  setPresenceUsers: (users: PresenceUser[]) => void
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  presenceUsers: [],
  setPresenceUsers: (users) => set({ presenceUsers: users }),
}))