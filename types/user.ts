export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface PresenceUser {
  userId: string
  fullName: string | null
  color: string
  cursor: { x: number; y: number } | null
  online_at: string
}