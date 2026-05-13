import AuthShell from '@/components/auth/AuthShell'

export const metadata = {
  title: 'Sign In - IdeaSpace',
  description: 'Sign in to your IdeaSpace account',
}

export default function LoginPage() {
  return <AuthShell initialMode="login" />
}
