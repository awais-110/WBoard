import AuthShell from '@/components/auth/AuthShell'

export const metadata = {
  title: 'Create Account - IdeaSpace',
  description: 'Create a new IdeaSpace account',
}

export default function RegisterPage() {
  return <AuthShell initialMode="register" />
}
