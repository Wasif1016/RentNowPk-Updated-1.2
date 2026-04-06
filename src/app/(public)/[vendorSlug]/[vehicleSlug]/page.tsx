import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookingRequestForm } from '@/components/public/booking-request-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerBookingPrefill } from '@/lib/db/customer-profile'
import { getCachedPublicVehicleDetail } from '@/lib/db/public-vehicle-cached'
import { getOptionalUser } from '@/lib/auth/session'

function formatPkMoney(decimal: string | null): string {
  if (!decimal) return '—'
  const n = parseFloat(decimal)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vendorSlug: string; vehicleSlug: string }>
}) {
  const { vendorSlug, vehicleSlug } = await params
  const v = await getCachedPublicVehicleDetail(vendorSlug, vehicleSlug)
  if (!v) return { title: 'Vehicle not found — RentNowPk' }
  return {
    title: `${v.name} — ${v.vendor.businessName} | RentNowPk`,
    description: `${v.make} ${v.model} (${v.year}) · ${v.cities.slice(0, 2).join(', ') || 'Pakistan'}`,
  }
}

export default async function PublicVehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ vendorSlug: string; vehicleSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { vendorSlug, vehicleSlug } = await params
  const detail = await getCachedPublicVehicleDetail(vendorSlug, vehicleSlug)
  if (!detail) notFound()

  const user = await getOptionalUser()
  const prefill =
    user?.role === 'CUSTOMER' ? await getCustomerBookingPrefill(user.id) : null

  const rawSearch = await searchParams
  const queryStrings: string[] = []
  if (rawSearch.pickupPlaceId) queryStrings.push(`pickupPlaceId=${encodeURIComponent(Array.isArray(rawSearch.pickupPlaceId) ? rawSearch.pickupPlaceId[0] : rawSearch.pickupPlaceId)}`)
  if (rawSearch.dropoffPlaceId) queryStrings.push(`dropoffPlaceId=${encodeURIComponent(Array.isArray(rawSearch.dropoffPlaceId) ? rawSearch.dropoffPlaceId[0] : rawSearch.dropoffPlaceId)}`)
  if (rawSearch.pickupAddress) queryStrings.push(`pickupAddress=${encodeURIComponent(Array.isArray(rawSearch.pickupAddress) ? rawSearch.pickupAddress[0] : rawSearch.pickupAddress)}`)
  if (rawSearch.dropoffAddress) queryStrings.push(`dropoffAddress=${encodeURIComponent(Array.isArray(rawSearch.dropoffAddress) ? rawSearch.dropoffAddress[0] : rawSearch.dropoffAddress)}`)

  const queryString = queryStrings.length > 0 ? `?${queryStrings.join('&')}` : ''
  const path = `/${vendorSlug}/${vehicleSlug}${queryString}`

  return (
    <div className="container mx-auto max-w-5xl space-y-10 px-4 py-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/search" className="hover:text-foreground">
          Search
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{detail.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted">
            {detail.images[0]?.url ? (
              <Image
                src={detail.images[0].url}
                alt=""
                fill
                className="object-cover"
                priority
                sizes="(max-width:1024px) 100vw, 60vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No photos yet
              </div>
            )}
          </div>
          {detail.images.filter((i) => i.url).length > 1 && (
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {detail.images
                .filter((i) => i.url)
                .slice(1, 9)
                .map((im) => (
                  <li key={im.id} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                    <Image src={im.url} alt="" fill className="object-cover" sizes="120px" />
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{detail.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {detail.make} {detail.model} · {detail.year}
            </p>
            {detail.cities.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">{detail.cities.join(' · ')}</p>
            )}
          </div>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pricing (PKR)</CardTitle>
              <CardDescription>Per day / month where enabled.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {detail.withDriverEnabled && (
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <span className="text-muted-foreground">With driver</span>
                  <span className="text-right font-medium text-foreground">
                    {formatPkMoney(detail.priceWithDriverDay)} / day
                    <span className="text-muted-foreground">
                      {' '}
                      · {formatPkMoney(detail.priceWithDriverMonth)} / mo
                    </span>
                  </span>
                </div>
              )}
              {detail.selfDriveEnabled && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Self drive</span>
                  <span className="text-right font-medium text-foreground">
                    {formatPkMoney(detail.priceSelfDriveDay)} / day
                    <span className="text-muted-foreground">
                      {' '}
                      · {formatPkMoney(detail.priceSelfDriveMonth)} / mo
                    </span>
                  </span>
                </div>
              )}
              {!detail.withDriverEnabled && !detail.selfDriveEnabled && (
                <p className="text-muted-foreground">No pricing configured.</p>
              )}
            </CardContent>
          </Card>

          {detail.pickupFormattedAddress && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Pickup: </span>
              {detail.pickupFormattedAddress}
            </p>
          )}

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{detail.vendor.businessName}</CardTitle>
              <CardDescription>
                Rated {detail.vendor.avgRating} ({detail.vendor.totalReviews} reviews)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.vendor.businessLogoUrl && (
                <div className="relative mb-3 h-12 w-12 overflow-hidden rounded-lg border border-border">
                  <Image
                    src={detail.vendor.businessLogoUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="border-t border-border pt-10">
        <h2 className="text-lg font-semibold text-foreground">Request a booking</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the button below — sign in or create an account in the popup if needed, then enter pickup,
          drop-off, and times. Distance is calculated when you submit.
        </p>
        <div className="mt-6 max-w-2xl">
          <BookingRequestForm
            vehicleId={detail.id}
            withDriverEnabled={detail.withDriverEnabled}
            selfDriveEnabled={detail.selfDriveEnabled}
            user={prefill}
            loginNextPath={path}
            accountRole={user ? (user.role as 'CUSTOMER' | 'VENDOR' | 'ADMIN') : null}
          />
        </div>
      </section>
    </div>
  )
}
