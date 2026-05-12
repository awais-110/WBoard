import { create } from 'zustand'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SaveStore {
  status: SaveStatus
  lastSavedAt: string | null
  error?: string | null
  setSaving: () => void
  setSaved: () => void
  setError: (msg: string) => void
}

export const useSaveStore = create<SaveStore>((set) => ({
  status: 'idle',
  lastSavedAt: null,
  error: null,
  setSaving: () => set({ status: 'saving', error: null }),
  setSaved: () => set({ status: 'saved', lastSavedAt: new Date().toISOString(), error: null }),
  setError: (msg: string) => set({ status: 'error', error: msg }),
}))
