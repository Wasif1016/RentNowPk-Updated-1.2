import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookingSidebar } from '@/components/public/booking-sidebar'
import { VehicleGallery } from '@/components/public/vehicle-gallery'
import { RecommendedSection } from '@/components/public/recommended-section'
import { getCustomerBookingPrefill } from '@/lib/db/customer-profile'
import { getCachedPublicVehicleDetail } from '@/lib/db/public-vehicle-cached'
import { getOptionalUser } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { 
  Star, 
  MapPin, 
  ChevronRight, 
  Calendar, 
  Car, 
  UserCheck, 
  Settings,
  CircleCheck
} from 'lucide-react'
import { format } from 'date-fns'

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
  
  const queryString = queryStrings.length > 0 ? `?${queryStrings.join('&')}` : ''
  const path = `/${vendorSlug}/${vehicleSlug}${queryString}`

  const memberSince = format(new Date(detail.vendor.createdAt), 'MMMM yyyy')

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F9F9] font-sans">
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 w-full">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0B1B3D]/50 mb-8">
          <Link href="/search" className="hover:text-[#F8991D] transition-colors">Fleet</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1B3D]">{detail.name}</span>
        </nav>

        {/* Column Wrapper - Form will stay inside here */}
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* LEFT CONTENT: Gallery and Details */}
          <div className="flex-1 space-y-12">
            {/* Headline section */}
            <section className="space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-[#0B1B3D] tracking-tight uppercase leading-tight">
                  {detail.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <span className="bg-[#0B1B3D] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0_#F8991D]">
                    Verified Listing
                  </span>
                  <div className="flex items-center gap-2 text-[#0B1B3D] font-bold text-xs">
                    <MapPin className="h-4 w-4 text-[#F8991D]" strokeWidth={2.5} />
                    {detail.cities.join(' • ') || 'Available Statewide'}
                  </div>
                </div>
              </div>

              {/* Client-side Gallery */}
              <VehicleGallery images={detail.images} name={detail.name} />
            </section>

            {/* Specs Grid */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-[#0B1B3D] uppercase tracking-wide border-l-4 border-[#F8991D] pl-4">
                Specifications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border-2 border-[#0B1B3D] p-4 flex items-center gap-4 group hover:bg-[#0B1B3D] hover:text-white transition-all">
                  <Calendar className="h-5 w-5 text-[#F8991D]" />
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#0B1B3D]/50 group-hover:text-white/50">Year</div>
                    <div className="font-bold text-base">{detail.year}</div>
                  </div>
                </div>
                <div className="bg-white border-2 border-[#0B1B3D] p-4 flex items-center gap-4 group hover:bg-[#0B1B3D] hover:text-white transition-all">
                  <Car className="h-5 w-5 text-[#F8991D]" />
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#0B1B3D]/50 group-hover:text-white/50">Make</div>
                    <div className="font-bold text-base">{detail.make}</div>
                  </div>
                </div>
                <div className="bg-white border-2 border-[#0B1B3D] p-4 flex items-center gap-4 group hover:bg-[#0B1B3D] hover:text-white transition-all">
                  <Settings className="h-5 w-5 text-[#F8991D]" />
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#0B1B3D]/50 group-hover:text-white/50">Model</div>
                    <div className="font-bold text-base truncate max-w-[100px]">{detail.model}</div>
                  </div>
                </div>
                <div className="bg-white border-2 border-[#0B1B3D] p-4 flex items-center gap-4 group hover:bg-[#0B1B3D] hover:text-white transition-all">
                  <UserCheck className="h-5 w-5 text-[#F8991D]" />
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#0B1B3D]/50 group-hover:text-white/50">Service</div>
                    <div className="font-bold text-[10px] uppercase">
                      {detail.withDriverEnabled ? 'Driver' : ''}
                      {detail.withDriverEnabled && detail.selfDriveEnabled ? ' & ' : ''}
                      {detail.selfDriveEnabled ? 'Self' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Vendor Info Section */}
            <section className="bg-[#0B1B3D] p-8 border-4 border-[#0B1B3D] shadow-[8px_8px_0_#F8991D] text-white flex flex-col md:flex-row items-center gap-8">
              <div className="relative shrink-0">
                <div className="w-20 h-20 border-2 border-[#F8991D] relative z-10 overflow-hidden bg-white/10">
                  {detail.vendor.businessLogoUrl ? (
                    <img
                      src={detail.vendor.businessLogoUrl}
                      alt={detail.vendor.businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xl">
                      {detail.vendor.businessName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -top-2 -right-2 bg-[#F8991D] text-[#0B1B3D] p-1 shadow-lg border-2 border-[#0B1B3D]">
                  <CircleCheck className="h-4 w-4" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <h3 className="text-2xl font-black tracking-tight uppercase">{detail.vendor.businessName}</h3>
                  <span className="bg-[#F8991D] text-[#0B1B3D] text-[9px] font-black px-2 py-0.5 uppercase">Verified</span>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-[#F8991D]">
                    <Star className="h-4 w-4 fill-[#F8991D]" />
                    <span className="font-black text-sm">{parseFloat(detail.vendor.avgRating).toFixed(1)}</span>
                    <span className="text-white/40 text-[10px] uppercase font-bold">({detail.vendor.totalReviews})</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Since {memberSince}</div>
                </div>
                <Link 
                  href={`/${vendorSlug}`}
                  className="inline-block bg-white text-[#0B1B3D] font-bold px-6 py-2 border-2 border-white hover:bg-[#F8991D] hover:border-[#F8991D] transition-all uppercase text-xs"
                >
                  View Vendor
                </Link>
              </div>
            </section>

            {/* Reviews Section */}
            {detail.reviews.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-xl font-bold text-[#0B1B3D] uppercase tracking-wide border-l-4 border-[#F8991D] pl-4">
                  Customer Experiences
                </h2>
                <div className="grid gap-4">
                  {detail.reviews.map((rev) => (
                    <div key={rev.id} className="bg-white border-2 border-[#0B1B3D]/10 p-6 hover:border-[#0B1B3D] transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 bg-[#0B1B3D] text-white flex items-center justify-center font-bold text-lg border-2 border-[#0B1B3D]">
                            {rev.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-sm text-[#0B1B3D]">{rev.customerName}</p>
                            <p className="text-[10px] text-[#0B1B3D]/40 font-bold uppercase tracking-wider">
                              {format(new Date(rev.createdAt), 'MMM yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 text-[#F8991D]">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn("h-3 w-3", i < rev.rating ? "fill-[#F8991D]" : "text-[#0B1B3D]/10")} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[#0B1B3D]/80 text-sm font-medium leading-relaxed italic">
                        &quot;{rev.comment}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR: Booking Form (Sticky) */}
          <aside className="w-full lg:w-[380px] shrink-0">
            <div className="lg:sticky lg:top-28">
              <BookingSidebar 
                vehicleId={detail.id}
                withDriverEnabled={detail.withDriverEnabled}
                selfDriveEnabled={detail.selfDriveEnabled}
                user={prefill}
                loginNextPath={path}
                accountRole={user ? (user.role as 'CUSTOMER' | 'VENDOR' | 'ADMIN') : null}
                initialSearch={{
                  pickupPlaceId: typeof rawSearch.pickupPlaceId === 'string' ? rawSearch.pickupPlaceId : undefined,
                  dropoffPlaceId: typeof rawSearch.dropoffPlaceId === 'string' ? rawSearch.dropoffPlaceId : undefined,
                  pickupAddress: typeof rawSearch.pickupAddress === 'string' ? rawSearch.pickupAddress : undefined,
                  dropoffAddress: typeof rawSearch.dropoffAddress === 'string' ? rawSearch.dropoffAddress : undefined,
                }}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Recommended Section at the bottom */}
      <div className="mt-10 pt-10 border-t-2 border-[#0B1B3D]/5">
        <RecommendedSection />
      </div>
    </div>
  )
}
