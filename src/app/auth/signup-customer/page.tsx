import { Suspense } from 'react'
import { SignupCustomerForm } from './signup-customer-form'
import { sanitizeNextPath } from '@/lib/auth/safe-next'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function Fallback() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-sm animate-pulse rounded-md bg-muted" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-9 animate-pulse rounded-xl bg-muted" />
        <div className="h-9 animate-pulse rounded-xl bg-muted" />
        <div className="h-9 animate-pulse rounded-xl bg-muted" />
      </CardContent>
    </Card>
  )
}

async function Inner({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const sp = await searchParams
  const nextPath = sp.next ? sanitizeNextPath(sp.next, '/customer') : '/customer'
  return <SignupCustomerForm nextPath={nextPath} />
}

export default function SignupCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <Inner searchParams={searchParams} />
    </Suspense>
  )
}
