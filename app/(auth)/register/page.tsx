import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Create Account - IdeaSpace',
  description: 'Create a new IdeaSpace account',
}

export default async function RegisterPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-black text-ice-latte px-4 py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,161,152,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(228,221,211,0.08),transparent_28%)]" />
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(0,161,152,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(0,161,152,0.7)_1px,transparent_1px)] bg-[size:56px_56px]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="hidden lg:block order-2 lg:order-1 pl-10 animate-slide-in-right">
            <span className="inline-flex items-center rounded-full border border-the-mint/30 bg-the-mint/10 px-4 py-2 text-sm font-medium text-the-mint">
              Build, share, and collaborate
            </span>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-balance">
              Create your space for ideas, boards, and teamwork.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ice-latte/70">
              IdeaSpace gives your team a polished digital canvas with the feel of a modern editor and the speed of real-time collaboration.
            </p>

            <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-3">
              {[
                'Fast onboarding',
                'Elegant board UI',
                'Team-ready workflow',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-ice-latte/80 backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2 animate-slide-in-up">
            <div className="mx-auto w-full max-w-md rounded-3xl border border-the-mint/20 bg-white/5 p-1 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="rounded-[1.4rem] border border-white/10 bg-black/80 p-8 sm:p-10">
                <div className="mb-8">
                  <p className="text-sm font-medium uppercase tracking-[0.35em] text-the-mint">
                    IdeaSpace
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-ice-latte">Create account</h2>
                  <p className="mt-2 text-sm leading-6 text-ice-latte/60">
                    Start a new workspace for your team and your ideas.
                  </p>
                </div>
                <RegisterForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
