import { LoginForm } from './login-form'
import { sanitizeNextPath } from '@/lib/auth/safe-next'

export async function LoginPageInner({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const sp = await searchParams
  const nextPath = sp.next ? sanitizeNextPath(sp.next, '/') : ''
  const errorCode = sp.error ?? null

  return <LoginForm nextPath={nextPath} errorCode={errorCode} />
}
