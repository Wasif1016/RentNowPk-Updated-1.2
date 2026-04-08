import Image from 'next/image'
import Link from 'next/link'
import { RecommendedSection } from '@/components/public/recommended-section'
import { HowItWorksSection } from '@/components/public/how-it-works-section'
import { VendorCtaSection } from '@/components/public/vendor-cta-section'
import { HeroSearchCard } from '@/components/public/hero-search-card'

export default async function Home() {
  return (
    <div className="flex flex-col">
      {/* ─── Hero Section (amber pinstripe) ─── */}
      <section className="relative bg-[#F5A623] overflow-hidden pt-16 pb-20 px-4 sm:px-8 md:px-10">
        {/* Pinstripe pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(0,0,0,0.08) 28px, rgba(0,0,0,0.08) 29px)',
          }}
        />

        <div className="relative z-10 max-w-[900px] mx-auto text-center mt-20">
          {/* Badge */}
          <div className="inline-block bg-black text-[#F5A623] text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-sm mb-6">
            PAKISTAN'S #1 CAR RENTAL MARKETPLACE
          </div>

          {/* Title */}
          <h1 className="text-[48px] sm:text-[64px] md:text-[80px] font-bold leading-[0.95] tracking-tight text-black mb-1">
            FIND YOUR
          </h1>
          <h1 className="text-[48px] sm:text-[64px] mb-10 md:text-[80px] font-bold leading-[0.95] tracking-tight text-transparent stroke-black" style={{ WebkitTextStroke: '2px black' }}>
            PERFECT RIDE
          </h1>

          {/* Subhead
          <p className="text-lg text-black/65 max-w-[540px] mx-auto mt-6 mb-8">
            Browse 3,000+ verified cars across Lahore, Karachi &amp; Islamabad. Book in minutes.
          </p> */}

          {/* Search Card */}
          <HeroSearchCard />

          {/* Drive Toggle
          <div className="flex justify-center gap-3 mt-5 flex-wrap">
            <button className="bg-black/12 border-2 border-transparent rounded-lg py-2.5 px-6 font-bold text-sm text-black/65 flex items-center gap-2 hover:bg-black/20 transition-colors">
              🧑‍✈️ With Driver
            </button>
            <button className="bg-black text-[#F5A623] border-2 border-black rounded-lg py-2.5 px-6 font-bold text-sm flex items-center gap-2">
              🔑 Self Drive
            </button>
          </div> */}

          {/* Meta Badges
          <div className="flex justify-center gap-6 mt-10 flex-wrap">
            <div className="bg-black/12 border-[1.5px] border-black/20 rounded-md py-3 px-6">
              <span className="block text-[22px] font-black tracking-wide">3,000+</span>
              <span className="text-sm font-bold text-black/65">Cars</span>
            </div>
            <div className="bg-black/12 border-[1.5px] border-black/20 rounded-md py-3 px-6">
              <span className="block text-[22px] font-black tracking-wide">100%</span>
              <span className="text-sm font-bold text-black/65">Verified Vendors</span>
            </div>
            <div className="bg-black/12 border-[1.5px] border-black/20 rounded-md py-3 px-6">
              <span className="block text-[22px] font-black tracking-wide">24/7</span>
              <span className="text-sm font-bold text-black/65">Support</span>
            </div>
          </div> */}
        </div>
      </section>

      {/* ─── Recommended ─── */}
      <RecommendedSection />

      {/* ─── How It Works ─── */}
      <HowItWorksSection />

      {/* ─── Vendor CTA ─── */}
      <VendorCtaSection />
    </div>
  )
}
