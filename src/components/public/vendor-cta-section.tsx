import Link from 'next/link'
import Image from 'next/image'

export function VendorCtaSection() {
  return (
    <section className="bg-black w-full overflow-hidden">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center w-full">
          <div className="p-12 lg:p-24 flex-1 space-y-8">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
              List Your Car &amp; Start Earning
            </h2>
            <p className="text-slate-300 text-xl font-medium max-w-lg">
              Join RentNowPk as a vendor and connect with thousands of customers looking for rental cars across Pakistan.
            </p>
            <div>
              <Link
                href="/auth/signup"
                className="inline-block bg-white text-black px-12 py-5 rounded-[22px] border-[5px] border-white font-black text-xl hover:scale-105 transition-transform"
              >
                Become a Vendor
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full flex items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-lg relative rounded-[22px] overflow-hidden border-[5px] border-white/20">
              <Image
                src="/rent-a-car-as-a-vendor.jpg"
                alt="Become a vendor illustration"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
