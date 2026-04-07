import { Search, MessageCircle, Car } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Find the perfect car',
    description: 'Search by city, airport, or address. Filter by vehicle type, price, and more.',
  },
  {
    icon: MessageCircle,
    title: 'Connect with vendors',
    description: 'Chat directly with verified vendors. Ask questions, negotiate, and book with confidence.',
  },
  {
    icon: Car,
    title: 'Hit the road',
    description: 'Pick up your car and go. Self drive or with driver — it\'s your trip.',
  },
]

export function HowItWorks() {
  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            How RentNowPk works
          </h2>
          <p className="mt-2 text-base text-gray-500 max-w-xl mx-auto">
            Skip the rental counter. Book directly with local vendors in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Step {i + 1}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
