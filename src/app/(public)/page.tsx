import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
        Rent cars across Pakistan
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        Search by city and vehicle type, compare vendors, and request a booking — chat with verified
        partners on RentNowPk.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/search">Search vehicles</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/signup-customer">Create customer account</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/for-vendors">For vendors</Link>
        </Button>
      </div>
    </div>
  )
}
