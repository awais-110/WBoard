import { create } from 'zustand'
// lightweight id generator instead of nanoid to avoid extra dependency
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export interface StickyNoteData {
  id: string
  x: number
  y: number
  color: string
  content: string
}

interface StickyStore {
  notes: StickyNoteData[]
  add: (opts?: Partial<StickyNoteData>) => void
  update: (id: string, patch: Partial<StickyNoteData>) => void
  remove: (id: string) => void
}

export const useStickyStore = create<StickyStore>((set) => ({
  notes: [],
  add: (opts = {}) =>
    set((state) => ({
      notes: [
        ...state.notes,
        {
          id: genId(),
          x: 200,
          y: 200,
          color: opts.color || '#FFFB8F',
          content: opts.content || 'New note',
        },
      ],
    })),
  update: (id, patch) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    })),
  remove: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
}))
