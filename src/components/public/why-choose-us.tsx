import { ShieldCheck, Verified, Wallet, HeadphonesIcon } from 'lucide-react'

const benefits = [
  {
    icon: Verified,
    title: 'Verified vendors',
    description: 'Every vendor goes through identity verification with CNIC and business documentation.',
  },
  {
    icon: ShieldCheck,
    title: 'No hidden charges',
    description: 'Transparent pricing upfront. What you see is what you pay — no surprise fees.',
  },
  {
    icon: Wallet,
    title: 'Best prices',
    description: 'Book directly with owners. No middleman markup, no counter fees.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Direct support',
    description: 'Chat with your vendor in real-time. Get answers fast through our built-in messaging.',
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Why choose RentNowPk
          </h2>
          <p className="mt-2 text-base text-gray-500 max-w-xl mx-auto">
            The smarter way to rent a car in Pakistan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{b.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
