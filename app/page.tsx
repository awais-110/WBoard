import LandingNavbar from '@/components/landing/LandingNavbar'
import LandingContent from '@/components/landing/LandingContent'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'IdeaSpace - Collaborate, Create, Innovate',
  description: 'IdeaSpace is your digital canvas for collaborative creativity. Design, brainstorm, and build amazing things together in real-time.',
}

export default async function HomePage() {
  // Check if user is already logged in
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <>
      <LandingNavbar />
      <LandingContent />
    </>
  )
}
