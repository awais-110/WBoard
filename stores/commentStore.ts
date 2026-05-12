import { create } from 'zustand'

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export interface CommentItem {
  id: string
  targetId: string
  userId: string
  name: string
  text: string
  created_at: string
}

interface CommentStore {
  openTargetId: string | null
  comments: CommentItem[]
  openFor: (targetId: string) => void
  close: () => void
  add: (c: Omit<CommentItem, 'id' | 'created_at'>) => void
}

export const useCommentStore = create<CommentStore>((set) => ({
  openTargetId: null,
  comments: [],
  openFor: (targetId) => set({ openTargetId: targetId }),
  close: () => set({ openTargetId: null }),
  add: (c) => set((s) => ({ comments: [...s.comments, { ...c, id: genId(), created_at: new Date().toISOString() }] })),
}))
