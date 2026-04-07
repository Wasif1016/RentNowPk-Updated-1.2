import { AddVehicleForm } from '@/components/vendor/add-vehicle-form'

export default function VendorAddVehiclePage() {
  const logoDevPublishableKey =
    process.env.LOGO_DEV_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY?.trim() ??
    ''

  return (
    <div className="px-6 pt-8 pb-10 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Add Vehicle</h1>
        <p className="text-muted-foreground mt-1">
          Set pickup on the map, add photos and pricing. Listing city is taken from the pickup location automatically.
        </p>
      </div>

      {/* Form */}
      <AddVehicleForm logoDevPublishableKey={logoDevPublishableKey} />
    </div>
  )
}
