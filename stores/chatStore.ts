import { create } from 'zustand'

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export interface ChatMessage {
  id: string
  userId: string
  name: string
  text: string
  created_at: string
}

interface ChatStore {
  open: boolean
  messages: ChatMessage[]
  toggle: () => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'created_at'>) => void
  clear: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  open: false,
  messages: [],
  toggle: () => set((s) => ({ open: !s.open })),
  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: genId(), created_at: new Date().toISOString(), ...msg },
      ],
    })),
  clear: () => set({ messages: [] }),
}))
