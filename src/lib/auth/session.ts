import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type Role = 'CUSTOMER' | 'VENDOR' | 'ADMIN'

type DbUser = typeof users.$inferSelect

const ROLE_HOMES: Record<Role, string> = {
  CUSTOMER: '/customer',
  VENDOR: '/vendor',
  ADMIN: '/admin',
}

type SessionLoad =
  | { kind: 'unauthenticated' }
  | { kind: 'setup_incomplete' }
  | { kind: 'ok'; dbUser: DbUser }

/** One Supabase getUser + one DB read per request, shared by layout + pages. */
const loadSessionUser = cache(async (): Promise<SessionLoad> => {
  const supabase = await createClient()
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error || !authUser) {
    return { kind: 'unauthenticated' }
  }

  const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1)

  if (!dbUser) {
    return { kind: 'setup_incomplete' }
  }

  return { kind: 'ok', dbUser }
})

// Use in layouts and pages. Redirects on failure — never returns null.
export async function getRequiredUser(requiredRole?: Role) {
  const session = await loadSessionUser()

  if (session.kind === 'unauthenticated') {
    redirect('/auth/login')
  }

  if (session.kind === 'setup_incomplete') {
    redirect('/auth/login?error=setup_incomplete')
  }

  const { dbUser } = session

  if (requiredRole && dbUser.role !== requiredRole) {
    redirect(ROLE_HOMES[dbUser.role as Role])
  }

  return dbUser
}

// For public pages that show different UI for logged-in users
export async function getOptionalUser() {
  try {
    const session = await loadSessionUser()
    if (session.kind === 'ok') {
      return session.dbUser
    }
    return null
  } catch {
    return null
  }
}
