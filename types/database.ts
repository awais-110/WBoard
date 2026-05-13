import type { Board, BoardMember } from './board'
import type { Profile, PresenceUser } from './user'
import type { CanvasData, CanvasEvent, CanvasEventType } from './canvas'

type BoardInsert = {
  id?: string
  title?: string
  owner_id: string
  canvas_data?: CanvasData | Record<string, never>
  thumbnail_url?: string | null
  is_public?: boolean
  created_at?: string
  updated_at?: string
}

type BoardUpdate = Partial<Omit<BoardInsert, 'id' | 'owner_id' | 'created_at'>>

type BoardMemberInsert = {
  id?: string
  board_id: string
  user_id: string
  role?: BoardMember['role']
  invited_at?: string
}

type CanvasEventInsert = {
  id?: string
  board_id: string
  user_id: string
  event_type: CanvasEventType
  payload: Record<string, unknown>
  created_at?: string
}

type EmailVerificationToken = {
  id: string
  user_id: string
  email: string
  token: string
  expires_at: string
  created_at: string
}

type EmailVerificationTokenInsert = {
  id?: string
  user_id: string
  email: string
  token: string
  expires_at: string
  created_at?: string
}

/**
 * Database schema type definitions.
 * Generated from Supabase schema.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      boards: {
        Row: Board
        Insert: BoardInsert
        Update: BoardUpdate
        Relationships: []
      }
      board_members: {
        Row: BoardMember
        Insert: BoardMemberInsert
        Update: Partial<Omit<BoardMemberInsert, 'id' | 'board_id' | 'user_id' | 'invited_at'>>
        Relationships: []
      }
      canvas_events: {
        Row: CanvasEvent
        Insert: CanvasEventInsert
        Update: never
        Relationships: []
      }
      email_verification_tokens: {
        Row: EmailVerificationToken
        Insert: EmailVerificationTokenInsert
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
