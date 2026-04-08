import { AddVehicleForm } from '@/components/vendor/add-vehicle-form'

export default function VendorAddVehiclePage() {
  const logoDevPublishableKey =
    process.env.LOGO_DEV_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY?.trim() ??
    ''

  return (
    <div className="px-6 pt-10 pb-16 lg:px-12">
      {/* ─── Branded Header ─── */}
      <div className="mb-12 border-b-4 border-[#0B1B3D] pb-10 relative">
         <div className="absolute -bottom-1 left-0 w-24 h-1.5 bg-[#F5A623]" />
         
         <div className="flex items-center gap-3 mb-4">
            <div className="h-2 w-10 bg-[#F5A623]" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#0B1B3D]/40 leading-none mt-0.5">Asset Initialization</h2>
         </div>
         <h1 className="text-5xl font-black tracking-tighter text-[#0B1B3D] uppercase leading-none mb-4">
            Add New<span className="text-[#F5A623] italic">Vehicle</span>
         </h1>
         <p className="text-[12px] font-bold text-[#0B1B3D]/50 uppercase tracking-tight max-w-2xl leading-relaxed">
            Configure your asset parameters, define pricing structures, and upload high-fidelity imagery to attract premium rental requests.
         </p>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl">
         <AddVehicleForm logoDevPublishableKey={logoDevPublishableKey} />
      </div>
    </div>
  )
}
