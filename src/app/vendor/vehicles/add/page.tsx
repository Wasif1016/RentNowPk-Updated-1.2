import { AddVehicleForm } from '@/components/vendor/add-vehicle-form'

export default function VendorAddVehiclePage() {
  const logoDevPublishableKey =
    process.env.LOGO_DEV_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY?.trim() ??
    ''

  return (
    <div className="max-w-[900px] mx-auto space-y-12 pb-20 font-sans animate-in fade-in duration-500">
      {/* Page Header */}
      <header className="page-header">
        <h1 className="text-[72px] font-black text-[#000615] tracking-tighter leading-[0.95] mb-4">New asset</h1>
        <p className="text-base font-bold text-[#000615]/60 tracking-tight">
          Register your vehicle in the <strong className="text-[#000615]">RentNowPk fleet registry</strong>
        </p>
      </header>

      {/* Form Card Container */}
      <div className="bg-white border-2 border-primary p-6 md:p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
         <AddVehicleForm logoDevPublishableKey={logoDevPublishableKey} />
      </div>
    </div>
  )
}
