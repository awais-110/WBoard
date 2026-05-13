import LandingNavbar from '@/components/landing/LandingNavbar'
import LandingContent from '@/components/landing/LandingContent'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'IdeaSpace — Modern Collaborative Workspace',
  description: 'IdeaSpace gives your team a polished canvas for real-time collaboration, creative workflows, and board-driven design.',
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
