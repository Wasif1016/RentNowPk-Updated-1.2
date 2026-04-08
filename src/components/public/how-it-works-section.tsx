import { Search, MessageCircle, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Search Cars',
    description: 'Find available vehicles by location and dates',
  },
  {
    icon: MessageCircle,
    title: 'Chat with Vendor',
    description: 'Request booking and discuss details',
  },
  {
    icon: CheckCircle,
    title: 'Confirm Booking',
    description: 'Finalize directly with the vendor',
  },
]

export function HowItWorksSection() {
  return (
    <section className="bg-surface-low py-24 px-4 sm:px-8">
      <div className="max-w-[1440px] mx-auto text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Rent in 3 Simple Steps</h2>
        <p className="text-secondary max-w-2xl mx-auto font-medium text-lg">
          Getting behind the wheel of your dream car has never been easier. We handle the details, you handle the road.
        </p>
      </div>

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {steps.map((step) => (
          <div key={step.title} className="flex flex-col items-center text-center space-y-6 group">
            <div className="w-24 h-24 border-[5px] border-black bg-white rounded-[22px] flex items-center justify-center group-hover:bg-primary-container transition-colors">
              <step.icon className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold uppercase">{step.title}</h3>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
