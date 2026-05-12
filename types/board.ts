import { CanvasData } from './canvas'

export type BoardRole = 'viewer' | 'editor' | 'admin'

export interface Board {
  id: string
  title: string
  owner_id: string
  canvas_data: CanvasData
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  is_public?: boolean
}

export interface BoardMember {
  id: string
  board_id: string
  user_id: string
  role: BoardRole
  invited_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface BoardWithMembers extends Board {
  members: BoardMember[]
}

export interface DashboardBoard extends Board {
  access: 'owned' | 'shared'
  role?: BoardRole
  members?: unknown[]
}
