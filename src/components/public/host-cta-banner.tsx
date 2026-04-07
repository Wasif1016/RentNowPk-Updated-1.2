import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HostCtaBanner() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800" />
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-center lg:text-left max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Earn up to PKR 100,000/month sharing your car
            </h2>
            <p className="mt-3 text-base text-gray-300 leading-relaxed">
              List your vehicle on RentNowPk and connect with thousands of renters across Pakistan.
              Set your own prices, manage bookings, and grow your rental business.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 text-base font-semibold bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
            >
              <Link href="/auth/signup">List your car</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8 text-base font-semibold border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/for-vendors">Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
