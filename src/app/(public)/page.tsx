import { getCachedFeaturedVehicles } from '@/lib/db/public-vehicle-cached'
import { TuroHeroSearch } from '@/components/public/turo-hero-search'
import { VehicleCarousel } from '@/components/public/vehicle-carousel'
import { HowItWorks } from '@/components/public/how-it-works'
import { WhyChooseUs } from '@/components/public/why-choose-us'
import { HostCtaBanner } from '@/components/public/host-cta-banner'

export default async function Home() {
  const featured = await getCachedFeaturedVehicles(12)

  return (
    <div className="flex flex-col">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        {/* Background image */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-24 sm:py-32 lg:py-40 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
            Rent the exact car you want, anywhere in Pakistan
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-300 max-w-2xl font-medium">
            Self drive or with driver. Book directly with verified vendors for days, weeks, or months.
          </p>

          <div className="mt-8 sm:mt-10 w-full">
            <TuroHeroSearch />
          </div>
        </div>
      </section>

      {/* ─── Featured Vehicles Carousel ─── */}
      {featured.length > 0 && (
        <VehicleCarousel
          title="Top vehicles"
          subtitle="Handpicked rides from verified vendors across Pakistan."
          vehicles={featured}
        />
      )}

      {/* ─── How It Works ─── */}
      <HowItWorks />

      {/* ─── Why Choose Us ─── */}
      <WhyChooseUs />

      {/* ─── Host CTA ─── */}
      <HostCtaBanner />
    </div>
  )
}
